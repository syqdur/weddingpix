import React, { useState, useEffect } from 'react';
import { X, Users, Smartphone, Wifi, WifiOff, Clock, RefreshCw, XCircle, Eye } from 'lucide-react';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

interface LiveUser {
  id: string;
  userName: string;
  deviceId: string;
  lastSeen: string;
  isActive: boolean;
}

interface UserInfo {
  userName: string;
  deviceId: string;
  lastSeen: string;
  isOnline: boolean;
  contributionCount: number;
  lastActivity: string;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  isDarkMode
}) => {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [liveUsers, setLiveUsers] = useState<LiveUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setLastUpdate(new Date());
      loadUserData();
    }, 30000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Load user data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadUserData();
    }
  }, [isOpen]);

  // Subscribe to live users with error handling
  useEffect(() => {
    if (!isOpen) return;

    console.log('👥 Subscribing to live users...');
    
    try {
      const q = query(
        collection(db, 'live_users'),
        orderBy('lastSeen', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        try {
          const now = new Date();
          const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
          const activeUsers: LiveUser[] = [];
          
          snapshot.docs.forEach(doc => {
            try {
              const data = doc.data();
              if (data && data.lastSeen && data.userName && data.deviceId) {
                const lastSeen = new Date(data.lastSeen);
                const isActive = lastSeen > fiveMinutesAgo;
                
                if (isActive) {
                  activeUsers.push({
                    id: doc.id,
                    userName: data.userName,
                    deviceId: data.deviceId,
                    lastSeen: data.lastSeen,
                    isActive: true
                  });
                }
              }
            } catch (docError) {
              console.warn('Error processing live user document:', docError);
            }
          });
          
          console.log(`👥 Found ${activeUsers.length} active users`);
          setLiveUsers(activeUsers);
          setError(null);
          
        } catch (snapshotError) {
          console.error('Error processing live users snapshot:', snapshotError);
          setError('Fehler beim Laden der Live-Benutzer');
        }
      }, (error) => {
        console.error('❌ Error loading live users:', error);
        setError('Fehler beim Laden der Live-Benutzer');
        setLiveUsers([]);
      });

      return unsubscribe;
    } catch (subscriptionError) {
      console.error('❌ Error setting up live users subscription:', subscriptionError);
      setError('Fehler beim Einrichten der Live-Benutzer-Überwachung');
      return () => {};
    }
  }, [isOpen]);

  const loadUserData = async () => {
    if (!isOpen) return;

    setIsLoading(true);
    setError(null);
    console.log('👥 === LOADING USER MANAGEMENT DATA ===');

    try {
      // Get all media items to count contributions
      const mediaQuery = query(collection(db, 'media'), orderBy('uploadedAt', 'desc'));
      const mediaSnapshot = await getDocs(mediaQuery);
      
      // Aggregate user data
      const userMap = new Map<string, UserInfo>();
      
      // Process media contributions
      mediaSnapshot.docs.forEach(doc => {
        try {
          const data = doc.data();
          if (data && data.userName && data.deviceId && data.uploadedAt) {
            const key = `${data.userName}-${data.deviceId}`;
            
            if (!userMap.has(key)) {
              userMap.set(key, {
                userName: data.userName,
                deviceId: data.deviceId,
                lastSeen: data.uploadedAt,
                isOnline: false,
                contributionCount: 0,
                lastActivity: data.uploadedAt
              });
            }
            
            const user = userMap.get(key)!;
            user.contributionCount++;
            
            // Update last activity if this is more recent
            if (new Date(data.uploadedAt) > new Date(user.lastActivity)) {
              user.lastActivity = data.uploadedAt;
            }
          }
        } catch (docError) {
          console.warn('Error processing media document:', docError);
        }
      });
      
      // Convert to array and update with live status
      const allUsers = Array.from(userMap.values());
      
      // Update online status
      allUsers.forEach(user => {
        try {
          // Check if user is currently online
          const liveUser = liveUsers.find(lu => lu.deviceId === user.deviceId);
          user.isOnline = !!liveUser;
          if (liveUser) {
            user.lastSeen = liveUser.lastSeen;
          }
        } catch (userError) {
          console.warn('Error processing user data:', userError);
        }
      });
      
      // Sort by online status, then by last activity
      allUsers.sort((a, b) => {
        if (a.isOnline !== b.isOnline) {
          return a.isOnline ? -1 : 1; // Online users first
        }
        return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
      });
      
      console.log(`👥 Loaded ${allUsers.length} total users`);
      console.log(`🟢 ${allUsers.filter(u => u.isOnline).length} currently online`);
      
      setUsers(allUsers);
      
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      setError('Fehler beim Laden der Benutzerdaten');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'gerade eben';
      if (diffInMinutes < 60) return `vor ${diffInMinutes}m`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `vor ${diffInHours}h`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      return `vor ${diffInDays}d`;
    } catch (error) {
      console.warn('Error formatting time:', error);
      return 'unbekannt';
    }
  };

  const stats = {
    totalUsers: users.length,
    onlineUsers: users.filter(u => u.isOnline).length,
    totalContributions: users.reduce((sum, u) => sum + u.contributionCount, 0)
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b transition-colors duration-300 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full transition-colors duration-300 ${
              isDarkMode ? 'bg-cyan-600' : 'bg-cyan-500'
            }`}>
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className={`text-xl font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                👥 User Management
              </h3>
              <p className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Alle Benutzer und deren Status im Überblick
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadUserData}
              disabled={isLoading}
              className={`p-2 rounded-full transition-colors duration-300 ${
                isLoading
                  ? 'cursor-not-allowed opacity-50'
                  : isDarkMode 
                    ? 'hover:bg-gray-700 text-gray-400' 
                    : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Daten aktualisieren"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-colors duration-300 ${
                isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Error Display */}
          {error && (
            <div className={`mb-6 p-4 rounded-xl border transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-red-900/20 border-red-700/30 text-red-300' 
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                <div>
                  <div className="font-semibold">Fehler beim Laden der Daten</div>
                  <div className="text-sm mt-1">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className={`p-4 rounded-xl transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-700/50 border border-gray-600' : 'bg-gray-50 border border-gray-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Users className={`w-4 h-4 transition-colors duration-300 ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
                <span className={`text-sm font-medium transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Gesamt
                </span>
              </div>
              <div className={`text-2xl font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {stats.totalUsers}
              </div>
              <div className={`text-xs transition-colors duration-300 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-500'
              }`}>
                Benutzer
              </div>
            </div>

            <div className={`p-4 rounded-xl transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-700/50 border border-gray-600' : 'bg-gray-50 border border-gray-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Wifi className={`w-4 h-4 transition-colors duration-300 ${
                  isDarkMode ? 'text-green-400' : 'text-green-600'
                }`} />
                <span className={`text-sm font-medium transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Online
                </span>
              </div>
              <div className={`text-2xl font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-green-400' : 'text-green-600'
              }`}>
                {stats.onlineUsers}
              </div>
              <div className={`text-xs transition-colors duration-300 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-500'
              }`}>
                Aktiv (5min)
              </div>
            </div>

            <div className={`p-4 rounded-xl transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-700/50 border border-gray-600' : 'bg-gray-50 border border-gray-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Eye className={`w-4 h-4 transition-colors duration-300 ${
                  isDarkMode ? 'text-pink-400' : 'text-pink-600'
                }`} />
                <span className={`text-sm font-medium transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Beiträge
                </span>
              </div>
              <div className={`text-2xl font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-pink-400' : 'text-pink-600'
              }`}>
                {stats.totalContributions}
              </div>
              <div className={`text-xs transition-colors duration-300 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-500'
              }`}>
                Gesamt
              </div>
            </div>
          </div>

          {/* Last Update Info */}
          <div className={`flex items-center justify-between mb-4 text-sm transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Letztes Update: {lastUpdate.toLocaleTimeString('de-DE')}</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              <span>Auto-Refresh: 30s</span>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                <span className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Lade Benutzerdaten...
                </span>
              </div>
            </div>
          )}

          {/* Users Table */}
          {!isLoading && users.length > 0 && (
            <div className={`rounded-xl border overflow-hidden transition-colors duration-300 ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className={`overflow-x-auto transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <table className="w-full">
                  <thead className={`transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <tr>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Benutzer
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Status
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Aktivität
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Beiträge
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y transition-colors duration-300 ${
                    isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
                  }`}>
                    {users.map((user, index) => {
                      return (
                        <tr key={`${user.userName}-${user.deviceId}`} className={`transition-colors duration-300 ${
                          isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
                        }`}>
                          {/* User Info */}
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300 ${
                                user.isOnline
                                  ? isDarkMode ? 'bg-green-600 text-white' : 'bg-green-500 text-white'
                                  : isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-300 text-gray-700'
                              }`}>
                                {user.userName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className={`font-medium transition-colors duration-300 ${
                                  isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {user.userName}
                                </div>
                                <div className={`text-xs font-mono transition-colors duration-300 ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  {user.deviceId.substring(0, 8)}...
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Online Status */}
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              {user.isOnline ? (
                                <>
                                  <Wifi className="w-4 h-4 text-green-500" />
                                  <span className={`text-sm font-medium transition-colors duration-300 ${
                                    isDarkMode ? 'text-green-400' : 'text-green-600'
                                  }`}>
                                    Online
                                  </span>
                                </>
                              ) : (
                                <>
                                  <WifiOff className="w-4 h-4 text-gray-500" />
                                  <span className={`text-sm transition-colors duration-300 ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                  }`}>
                                    Offline
                                  </span>
                                </>
                              )}
                            </div>
                            <div className={`text-xs mt-1 transition-colors duration-300 ${
                              isDarkMode ? 'text-gray-500' : 'text-gray-500'
                            }`}>
                              {formatTimeAgo(user.lastSeen)}
                            </div>
                          </td>

                          {/* Last Activity */}
                          <td className="px-4 py-4">
                            <div className={`text-sm transition-colors duration-300 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              {formatTimeAgo(user.lastActivity)}
                            </div>
                            <div className={`text-xs transition-colors duration-300 ${
                              isDarkMode ? 'text-gray-500' : 'text-gray-500'
                            }`}>
                              Letzte Aktivität
                            </div>
                          </td>

                          {/* Contributions */}
                          <td className="px-4 py-4">
                            <div className={`text-sm font-medium transition-colors duration-300 ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {user.contributionCount}
                            </div>
                            <div className={`text-xs transition-colors duration-300 ${
                              isDarkMode ? 'text-gray-500' : 'text-gray-500'
                            }`}>
                              Beiträge
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && users.length === 0 && !error && (
            <div className="text-center py-12">
              <Users className={`w-16 h-16 mx-auto mb-4 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-600' : 'text-gray-400'
              }`} />
              <h3 className={`text-lg font-medium mb-2 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Keine Benutzer gefunden
              </h3>
              <p className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Es wurden noch keine Benutzeraktivitäten aufgezeichnet.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t text-center transition-colors duration-300 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={onClose}
            className={`py-2 px-6 rounded-xl transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' 
                : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
            }`}
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};