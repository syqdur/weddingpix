import React, { useState, useEffect } from 'react';
import { Users, Eye } from 'lucide-react';
import { 
  doc, 
  setDoc, 
  onSnapshot, 
  collection,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Live User Types
interface LiveUser {
  id: string;
  userName: string;
  deviceId: string;
  lastSeen: string;
  isActive: boolean;
}

interface LiveUserIndicatorProps {
  currentUser: string;
  isDarkMode: boolean;
}

export const LiveUserIndicator: React.FC<LiveUserIndicatorProps> = ({
  currentUser,
  isDarkMode
}) => {
  const [liveUsers, setLiveUsers] = useState<LiveUser[]>([]);
  const [showTooltip, setShowTooltip] = useState(false);

  // Real Firebase live user tracking
  useEffect(() => {
    if (!currentUser) return;

    const deviceId = localStorage.getItem('wedding_device_id') || 'unknown';

    // Update user presence
    const updatePresence = async () => {
      try {
        const userRef = doc(db, 'live_users', deviceId);
        await setDoc(userRef, {
          userName: currentUser,
          deviceId,
          lastSeen: new Date().toISOString(),
          isActive: true
        }, { merge: true });
      } catch (error) {
        console.error('Error updating user presence:', error);
      }
    };

    // Set user offline when leaving
    const setOffline = async () => {
      try {
        const userRef = doc(db, 'live_users', deviceId);
        await setDoc(userRef, {
          isActive: false,
          lastSeen: new Date().toISOString()
        }, { merge: true });
      } catch (error) {
        console.error('Error setting user offline:', error);
      }
    };

    // Initial presence update
    updatePresence();

    // Set up presence heartbeat
    const presenceInterval = setInterval(updatePresence, 30000); // Every 30 seconds

    // Subscribe to live users
    const q = query(
      collection(db, 'live_users'),
      where('isActive', '==', true),
      orderBy('lastSeen', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users: LiveUser[] = [];
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const lastSeen = new Date(data.lastSeen);
        
        // Only include users who were active in the last 5 minutes
        if (lastSeen > fiveMinutesAgo) {
          users.push({
            id: doc.id,
            ...data
          } as LiveUser);
        }
      });
      
      setLiveUsers(users);
    }, (error) => {
      console.error('Error listening to live users:', error);
      setLiveUsers([]);
    });

    // Set user offline when leaving
    const handleBeforeUnload = () => {
      setOffline();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(presenceInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      setOffline();
      unsubscribe();
    };
  }, [currentUser]);

  const onlineCount = liveUsers.length;
  const otherUsers = liveUsers.filter(user => user.userName !== currentUser);
  const isOnline = onlineCount > 0;

  const getStatusColor = () => {
    if (onlineCount === 0) return 'bg-red-500';
    if (onlineCount === 1) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (onlineCount === 0) return 'Niemand online';
    if (onlineCount === 1) return 'Du bist online';
    return `${onlineCount} online`;
  };

  return (
    <div className="relative">
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-full cursor-pointer transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gray-800/80 border border-gray-700/50 backdrop-blur-sm hover:bg-gray-700/80' 
            : 'bg-white/80 border border-gray-200/50 backdrop-blur-sm shadow-sm hover:bg-white/90'
        }`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* Status Dot */}
        <div className="relative">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()} transition-colors duration-300`}>
            {isOnline && (
              <div className={`absolute inset-0 rounded-full ${getStatusColor()} animate-ping opacity-75`}></div>
            )}
          </div>
        </div>

        {/* User Count */}
        <div className="flex items-center gap-1">
          <Users className={`w-4 h-4 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`} />
          <span className={`text-sm font-medium transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {onlineCount}
          </span>
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className={`absolute top-full right-0 mt-2 p-3 rounded-xl shadow-lg border z-50 min-w-[200px] transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700 text-white' 
            : 'bg-white border-gray-200 text-gray-900'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
            <span className="font-semibold text-sm">{getStatusText()}</span>
          </div>
          
          {onlineCount > 0 ? (
            <div className="space-y-1">
              {liveUsers.map((user, index) => (
                <div key={user.id} className="flex items-center gap-2 text-sm">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors duration-300 ${
                    user.userName === currentUser
                      ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                      : isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {user.userName.charAt(0).toUpperCase()}
                  </div>
                  <span className={`transition-colors duration-300 ${
                    user.userName === currentUser
                      ? isDarkMode ? 'text-blue-300 font-medium' : 'text-blue-600 font-medium'
                      : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {user.userName === currentUser ? 'Du' : user.userName}
                  </span>
                  {user.userName === currentUser && (
                    <span className={`text-xs px-1.5 py-0.5 rounded transition-colors duration-300 ${
                      isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
                    }`}>
                      Du
                    </span>
                  )}
                </div>
              ))}
              
              {otherUsers.length === 0 && onlineCount === 1 && (
                <div className={`text-xs italic transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Du bist der einzige online
                </div>
              )}
            </div>
          ) : (
            <div className={`text-xs italic transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Niemand ist gerade online
            </div>
          )}
          
          <div className={`mt-2 pt-2 border-t text-xs transition-colors duration-300 ${
            isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'
          }`}>
            Live-Anzeige • Aktualisiert alle 30s
          </div>
        </div>
      )}
    </div>
  );
};