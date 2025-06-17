import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  AlertCircle, 
  CheckCircle, 
  Users, 
  Smartphone, 
  Calendar, 
  RefreshCw,
  Filter,
  Clock,
  Info
} from 'lucide-react';
import { 
  collection, 
  query, 
  getDocs, 
  where, 
  deleteDoc, 
  doc,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';

interface UserManagementTableProps {
  isDarkMode: boolean;
  onClose: () => void;
}

interface UserData {
  userName: string;
  deviceIds: string[];
  firstSeen: string;
  lastSeen: string;
  totalContributions: number;
  mediaCount: number;
  commentCount: number;
  likeCount: number;
  musicRequestCount: number;
}

type SortField = 'userName' | 'deviceCount' | 'firstSeen' | 'lastSeen' | 'totalContributions';
type SortDirection = 'asc' | 'desc';

export const UserManagementTable: React.FC<UserManagementTableProps> = ({ isDarkMode, onClose }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('lastSeen');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Load user data
  useEffect(() => {
    loadUserData();
  }, []);

  // Filter users when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(user => 
        user.userName.toLowerCase().includes(query) ||
        user.deviceIds.some(id => id.toLowerCase().includes(query))
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const loadUserData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('📊 Loading user data...');
      
      // Temporary storage for user data
      const userMap = new Map<string, UserData>();
      
      // Load media items
      const mediaQuery = query(collection(db, 'media'), orderBy('uploadedAt', 'desc'));
      const mediaSnapshot = await getDocs(mediaQuery);
      
      console.log(`📸 Found ${mediaSnapshot.docs.length} media items`);
      
      // Process media items
      mediaSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!data.userName) return;
        
        if (!userMap.has(data.userName)) {
          userMap.set(data.userName, {
            userName: data.userName,
            deviceIds: data.deviceId ? [data.deviceId] : [],
            firstSeen: data.uploadedAt,
            lastSeen: data.uploadedAt,
            totalContributions: 0,
            mediaCount: 0,
            commentCount: 0,
            likeCount: 0,
            musicRequestCount: 0
          });
        }
        
        const userData = userMap.get(data.userName)!;
        
        // Add device ID if not already present
        if (data.deviceId && !userData.deviceIds.includes(data.deviceId)) {
          userData.deviceIds.push(data.deviceId);
        }
        
        // Update first/last seen
        if (new Date(data.uploadedAt) < new Date(userData.firstSeen)) {
          userData.firstSeen = data.uploadedAt;
        }
        if (new Date(data.uploadedAt) > new Date(userData.lastSeen)) {
          userData.lastSeen = data.uploadedAt;
        }
        
        // Count contributions
        userData.totalContributions++;
        userData.mediaCount++;
      });
      
      // Load comments
      const commentsQuery = query(collection(db, 'comments'));
      const commentsSnapshot = await getDocs(commentsQuery);
      
      console.log(`💬 Found ${commentsSnapshot.docs.length} comments`);
      
      // Process comments
      commentsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!data.userName) return;
        
        if (!userMap.has(data.userName)) {
          userMap.set(data.userName, {
            userName: data.userName,
            deviceIds: data.deviceId ? [data.deviceId] : [],
            firstSeen: data.createdAt,
            lastSeen: data.createdAt,
            totalContributions: 0,
            mediaCount: 0,
            commentCount: 0,
            likeCount: 0,
            musicRequestCount: 0
          });
        }
        
        const userData = userMap.get(data.userName)!;
        
        // Add device ID if not already present
        if (data.deviceId && !userData.deviceIds.includes(data.deviceId)) {
          userData.deviceIds.push(data.deviceId);
        }
        
        // Update first/last seen
        if (new Date(data.createdAt) < new Date(userData.firstSeen)) {
          userData.firstSeen = data.createdAt;
        }
        if (new Date(data.createdAt) > new Date(userData.lastSeen)) {
          userData.lastSeen = data.createdAt;
        }
        
        // Count contributions
        userData.totalContributions++;
        userData.commentCount++;
      });
      
      // Load likes
      const likesQuery = query(collection(db, 'likes'));
      const likesSnapshot = await getDocs(likesQuery);
      
      console.log(`❤️ Found ${likesSnapshot.docs.length} likes`);
      
      // Process likes
      likesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!data.userName) return;
        
        if (!userMap.has(data.userName)) {
          userMap.set(data.userName, {
            userName: data.userName,
            deviceIds: data.deviceId ? [data.deviceId] : [],
            firstSeen: data.createdAt,
            lastSeen: data.createdAt,
            totalContributions: 0,
            mediaCount: 0,
            commentCount: 0,
            likeCount: 0,
            musicRequestCount: 0
          });
        }
        
        const userData = userMap.get(data.userName)!;
        
        // Add device ID if not already present
        if (data.deviceId && !userData.deviceIds.includes(data.deviceId)) {
          userData.deviceIds.push(data.deviceId);
        }
        
        // Update first/last seen
        if (new Date(data.createdAt) < new Date(userData.firstSeen)) {
          userData.firstSeen = data.createdAt;
        }
        if (new Date(data.createdAt) > new Date(userData.lastSeen)) {
          userData.lastSeen = data.createdAt;
        }
        
        // Count contributions
        userData.totalContributions++;
        userData.likeCount++;
      });
      
      // Load music requests
      const musicQuery = query(collection(db, 'music_requests'));
      const musicSnapshot = await getDocs(musicQuery);
      
      console.log(`🎵 Found ${musicSnapshot.docs.length} music requests`);
      
      // Process music requests
      musicSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!data.requestedBy) return;
        
        if (!userMap.has(data.requestedBy)) {
          userMap.set(data.requestedBy, {
            userName: data.requestedBy,
            deviceIds: data.deviceId ? [data.deviceId] : [],
            firstSeen: data.requestedAt,
            lastSeen: data.requestedAt,
            totalContributions: 0,
            mediaCount: 0,
            commentCount: 0,
            likeCount: 0,
            musicRequestCount: 0
          });
        }
        
        const userData = userMap.get(data.requestedBy)!;
        
        // Add device ID if not already present
        if (data.deviceId && !userData.deviceIds.includes(data.deviceId)) {
          userData.deviceIds.push(data.deviceId);
        }
        
        // Update first/last seen
        if (new Date(data.requestedAt) < new Date(userData.firstSeen)) {
          userData.firstSeen = data.requestedAt;
        }
        if (new Date(data.requestedAt) > new Date(userData.lastSeen)) {
          userData.lastSeen = data.requestedAt;
        }
        
        // Count contributions
        userData.totalContributions++;
        userData.musicRequestCount++;
      });
      
      // Convert map to array and sort
      const userArray = Array.from(userMap.values());
      
      console.log(`👥 Found ${userArray.length} unique users`);
      
      // Apply initial sorting
      const sortedUsers = sortUsers(userArray, sortField, sortDirection);
      
      setUsers(sortedUsers);
      setFilteredUsers(sortedUsers);
      setLastUpdate(new Date());
      
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Fehler beim Laden der Benutzerdaten. Bitte versuche es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const sortUsers = (userList: UserData[], field: SortField, direction: SortDirection): UserData[] => {
    return [...userList].sort((a, b) => {
      let comparison = 0;
      
      switch (field) {
        case 'userName':
          comparison = a.userName.localeCompare(b.userName);
          break;
        case 'deviceCount':
          comparison = a.deviceIds.length - b.deviceIds.length;
          break;
        case 'firstSeen':
          comparison = new Date(a.firstSeen).getTime() - new Date(b.firstSeen).getTime();
          break;
        case 'lastSeen':
          comparison = new Date(a.lastSeen).getTime() - new Date(b.lastSeen).getTime();
          break;
        case 'totalContributions':
          comparison = a.totalContributions - b.totalContributions;
          break;
      }
      
      return direction === 'asc' ? comparison : -comparison;
    });
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // Toggle direction if same field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortDirection('desc');
    }
    
    // Apply sorting
    const sorted = sortUsers(users, field, field === sortField && sortDirection === 'asc' ? 'desc' : 'asc');
    setUsers(sorted);
    
    // Apply filtering if search is active
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const filtered = sorted.filter(user => 
        user.userName.toLowerCase().includes(query) ||
        user.deviceIds.some(id => id.toLowerCase().includes(query))
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(sorted);
    }
  };

  const handleDeleteUser = async (userName: string) => {
    setIsDeleting(true);
    
    try {
      console.log(`🗑️ Deleting user: ${userName}`);
      
      // Get all device IDs for this user
      const user = users.find(u => u.userName === userName);
      if (!user) {
        throw new Error(`User ${userName} not found`);
      }
      
      const deviceIds = user.deviceIds;
      console.log(`📱 Found ${deviceIds.length} devices for user ${userName}`);
      
      // Delete from live_users collection
      for (const deviceId of deviceIds) {
        try {
          console.log(`🗑️ Deleting live user entry for device: ${deviceId}`);
          await deleteDoc(doc(db, 'live_users', deviceId));
        } catch (error) {
          console.warn(`⚠️ Error deleting live user for device ${deviceId}:`, error);
          // Continue with other deletions
        }
      }
      
      console.log(`✅ User ${userName} successfully deleted`);
      
      // Update local state
      const updatedUsers = users.filter(u => u.userName !== userName);
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers.filter(u => 
        searchQuery.trim() === '' || 
        u.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.deviceIds.some(id => id.toLowerCase().includes(searchQuery.toLowerCase()))
      ));
      
      // Show success message
      alert(`✅ Benutzer "${userName}" wurde erfolgreich gelöscht.\n\n${deviceIds.length} Geräte-Zuordnungen wurden entfernt.\n\nAlle Medien und Beiträge bleiben erhalten.`);
      
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(`❌ Fehler beim Löschen des Benutzers "${userName}".\n\n${error}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Ungültiges Datum';
    }
  };

  const getSortIcon = (field: SortField) => {
    if (field !== sortField) {
      return null;
    }
    
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4" /> 
      : <ArrowDown className="w-4 h-4" />;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`rounded-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b transition-colors duration-300 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full transition-colors duration-300 ${
              isDarkMode ? 'bg-blue-600' : 'bg-blue-500'
            }`}>
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className={`text-xl font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Benutzer-Verwaltung
              </h3>
              <p className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Übersicht aller registrierten Benutzer und ihrer Geräte
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
                <AlertCircle className="w-5 h-5" />
                <div>
                  <div className="font-semibold">Fehler beim Laden der Daten</div>
                  <div className="text-sm mt-1">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Search and Info Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            {/* Search */}
            <div className="relative w-full md:w-auto md:flex-1 max-w-md">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Benutzer oder Geräte-ID suchen..."
                className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-1 text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <Users className="w-4 h-4" />
                <span>{users.length} Benutzer</span>
              </div>
              <div className={`flex items-center gap-1 text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <Smartphone className="w-4 h-4" />
                <span>{users.reduce((sum, user) => sum + user.deviceIds.length, 0)} Geräte</span>
              </div>
              <div className={`flex items-center gap-1 text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <Clock className="w-4 h-4" />
                <span>Stand: {lastUpdate.toLocaleTimeString('de-DE')}</span>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className={`mb-6 p-4 rounded-xl border transition-colors duration-300 ${
            isDarkMode ? 'bg-blue-900/20 border-blue-700/30' : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-start gap-2">
              <Info className={`w-5 h-5 mt-0.5 flex-shrink-0 transition-colors duration-300 ${
                isDarkMode ? 'text-blue-400' : 'text-blue-600'
              }`} />
              <div>
                <h4 className={`font-semibold mb-1 transition-colors duration-300 ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-800'
                }`}>
                  Hinweis zur Benutzer-Verwaltung
                </h4>
                <p className={`text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-blue-200' : 'text-blue-700'
                }`}>
                  Das Löschen eines Benutzers entfernt nur die Zuordnung zwischen Benutzername und Geräten. 
                  Alle hochgeladenen Medien, Kommentare und Likes bleiben erhalten. 
                  Wenn ein gelöschter Benutzer die Seite erneut besucht, wird er als neuer Benutzer behandelt.
                </p>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className={`text-lg transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Lade Benutzerdaten...
                </p>
              </div>
            </div>
          )}

          {/* Users Table */}
          {!isLoading && filteredUsers.length > 0 && (
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
                      {/* Username Column */}
                      <th 
                        className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                        }`}
                        onClick={() => handleSort('userName')}
                      >
                        <div className="flex items-center gap-2">
                          <span>Benutzername</span>
                          {getSortIcon('userName')}
                        </div>
                      </th>
                      
                      {/* Devices Column */}
                      <th 
                        className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                        }`}
                        onClick={() => handleSort('deviceCount')}
                      >
                        <div className="flex items-center gap-2">
                          <span>Geräte</span>
                          {getSortIcon('deviceCount')}
                        </div>
                      </th>
                      
                      {/* First Seen Column */}
                      <th 
                        className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                        }`}
                        onClick={() => handleSort('firstSeen')}
                      >
                        <div className="flex items-center gap-2">
                          <span>Erste Aktivität</span>
                          {getSortIcon('firstSeen')}
                        </div>
                      </th>
                      
                      {/* Last Seen Column */}
                      <th 
                        className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                        }`}
                        onClick={() => handleSort('lastSeen')}
                      >
                        <div className="flex items-center gap-2">
                          <span>Letzte Aktivität</span>
                          {getSortIcon('lastSeen')}
                        </div>
                      </th>
                      
                      {/* Contributions Column */}
                      <th 
                        className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                        }`}
                        onClick={() => handleSort('totalContributions')}
                      >
                        <div className="flex items-center gap-2">
                          <span>Beiträge</span>
                          {getSortIcon('totalContributions')}
                        </div>
                      </th>
                      
                      {/* Actions Column */}
                      <th className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y transition-colors duration-300 ${
                    isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
                  }`}>
                    {filteredUsers.map((user) => (
                      <tr key={user.userName} className={`transition-colors duration-300 ${
                        isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
                      }`}>
                        {/* Username */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300 ${
                              isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                            }`}>
                              {user.userName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className={`font-medium transition-colors duration-300 ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                {user.userName}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Devices */}
                        <td className="px-4 py-4">
                          <div className={`flex items-center gap-2 transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            <Smartphone className="w-4 h-4" />
                            <span className="font-medium">{user.deviceIds.length}</span>
                          </div>
                          <div className={`text-xs mt-1 transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-500'
                          }`}>
                            {user.deviceIds.map(id => id.substring(0, 8)).join(', ')}...
                          </div>
                        </td>

                        {/* First Seen */}
                        <td className="px-4 py-4">
                          <div className={`text-sm transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {formatDate(user.firstSeen)}
                          </div>
                          <div className={`text-xs transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-500'
                          }`}>
                            Erste Registrierung
                          </div>
                        </td>

                        {/* Last Seen */}
                        <td className="px-4 py-4">
                          <div className={`text-sm transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {formatDate(user.lastSeen)}
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
                            {user.totalContributions}
                          </div>
                          <div className={`text-xs transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-500'
                          }`}>
                            {user.mediaCount > 0 && `${user.mediaCount} Medien`}
                            {user.commentCount > 0 && (user.mediaCount > 0 ? `, ${user.commentCount} Kommentare` : `${user.commentCount} Kommentare`)}
                            {user.likeCount > 0 && (user.mediaCount > 0 || user.commentCount > 0 ? `, ${user.likeCount} Likes` : `${user.likeCount} Likes`)}
                            {user.musicRequestCount > 0 && (user.mediaCount > 0 || user.commentCount > 0 || user.likeCount > 0 ? `, ${user.musicRequestCount} Songs` : `${user.musicRequestCount} Songs`)}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 text-right">
                          {showDeleteConfirm === user.userName ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setShowDeleteConfirm(null)}
                                disabled={isDeleting}
                                className={`p-2 rounded transition-colors duration-300 ${
                                  isDarkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-600'
                                }`}
                                title="Abbrechen"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.userName)}
                                disabled={isDeleting}
                                className={`p-2 rounded transition-colors duration-300 ${
                                  isDeleting
                                    ? 'cursor-not-allowed opacity-50'
                                    : isDarkMode 
                                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                                      : 'bg-red-500 hover:bg-red-600 text-white'
                                }`}
                                title="Löschen bestätigen"
                              >
                                {isDeleting ? (
                                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowDeleteConfirm(user.userName)}
                              className={`p-2 rounded transition-colors duration-300 ${
                                isDarkMode ? 'hover:bg-red-600/20 text-red-400 hover:text-red-300' : 'hover:bg-red-50 text-red-500 hover:text-red-600'
                              }`}
                              title="Benutzer löschen"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className={`w-16 h-16 mx-auto mb-4 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-600' : 'text-gray-400'
              }`} />
              {searchQuery.trim() !== '' ? (
                <>
                  <h3 className={`text-lg font-medium mb-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Keine Benutzer gefunden
                  </h3>
                  <p className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Keine Benutzer entsprechen deiner Suche "{searchQuery}"
                  </p>
                </>
              ) : (
                <>
                  <h3 className={`text-lg font-medium mb-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Keine Benutzer gefunden
                  </h3>
                  <p className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Es wurden noch keine Benutzer registriert.
                  </p>
                </>
              )}
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