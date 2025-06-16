import React, { useState, useEffect } from 'react';
import { Users, Eye } from 'lucide-react';
import { 
  doc, 
  setDoc, 
  onSnapshot, 
  collection,
  query,
  where,
  orderBy,
  limit,
  deleteDoc,
  getDocs
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
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Real Firebase live user tracking
  useEffect(() => {
    if (!currentUser) {
      console.log('❌ No current user, skipping live user tracking');
      return;
    }

    const deviceId = localStorage.getItem('wedding_device_id') || 'unknown';
    console.log(`🔄 === INITIALIZING LIVE USER TRACKING ===`);
    console.log(`👤 User: ${currentUser}`);
    console.log(`📱 Device ID: ${deviceId}`);

    // 🔧 FIX: Clean up any duplicate entries first
    const cleanupDuplicates = async () => {
      try {
        console.log(`🧹 Cleaning up duplicate entries for ${currentUser}...`);
        
        // Find all entries for this user (by userName, not deviceId)
        const duplicateQuery = query(
          collection(db, 'live_users'),
          where('userName', '==', currentUser)
        );
        
        const duplicateSnapshot = await getDocs(duplicateQuery);
        console.log(`🔍 Found ${duplicateSnapshot.docs.length} existing entries for ${currentUser}`);
        
        // Delete all existing entries for this user
        const deletePromises = duplicateSnapshot.docs.map(doc => {
          console.log(`🗑️ Deleting duplicate entry: ${doc.id}`);
          return deleteDoc(doc.ref);
        });
        
        await Promise.all(deletePromises);
        console.log(`✅ Cleaned up ${deletePromises.length} duplicate entries`);
        
      } catch (error) {
        console.error('❌ Error cleaning up duplicates:', error);
      }
    };

    // Update user presence (after cleanup)
    const updatePresence = async () => {
      try {
        console.log(`📡 Updating presence for ${currentUser}...`);
        
        // 🔧 FIX: Use deviceId as document ID to ensure uniqueness
        const userRef = doc(db, 'live_users', deviceId);
        await setDoc(userRef, {
          userName: currentUser,
          deviceId,
          lastSeen: new Date().toISOString(),
          isActive: true
        }, { merge: true });
        
        console.log(`✅ Presence updated for ${currentUser} (${deviceId})`);
        
        if (!isInitialized) {
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('❌ Error updating user presence:', error);
      }
    };

    // Set user offline when leaving
    const setOffline = async () => {
      try {
        console.log(`📡 Setting ${currentUser} offline...`);
        const userRef = doc(db, 'live_users', deviceId);
        await setDoc(userRef, {
          isActive: false,
          lastSeen: new Date().toISOString()
        }, { merge: true });
        console.log(`✅ ${currentUser} set offline`);
      } catch (error) {
        console.error('❌ Error setting user offline:', error);
      }
    };

    // Initialize: cleanup duplicates then set presence
    const initialize = async () => {
      await cleanupDuplicates();
      await updatePresence();
    };

    initialize();

    // Set up presence heartbeat (every 30 seconds for better responsiveness)
    const presenceInterval = setInterval(() => {
      console.log(`💓 Heartbeat for ${currentUser}`);
      updatePresence();
    }, 30000); // Every 30 seconds

    // 🔧 FIX: Use simpler query without complex index requirements
    console.log(`👥 Subscribing to live users (simplified query)...`);
    
    // Try the complex query first, fallback to simple query if it fails
    let unsubscribe: (() => void) | null = null;
    
    try {
      // First try: Complex query with index
      const complexQuery = query(
        collection(db, 'live_users'),
        where('isActive', '==', true),
        orderBy('lastSeen', 'desc'),
        limit(50)
      );
      
      unsubscribe = onSnapshot(complexQuery, (snapshot) => {
        console.log(`👥 === LIVE USERS UPDATE (COMPLEX QUERY) ===`);
        console.log(`📊 Raw docs from Firebase: ${snapshot.docs.length}`);
        
        const users: LiveUser[] = [];
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const seenUsers = new Set<string>(); // 🔧 FIX: Track seen usernames to prevent duplicates
        
        snapshot.docs.forEach((doc, index) => {
          const data = doc.data();
          const lastSeen = new Date(data.lastSeen);
          const isRecent = lastSeen > fiveMinutesAgo;
          
          console.log(`  ${index + 1}. ${data.userName} (${data.deviceId}) - Last seen: ${lastSeen.toLocaleTimeString()} - Recent: ${isRecent}`);
          
          // 🔧 FIX: Only include users who were active in the last 5 minutes AND not already seen
          if (isRecent && !seenUsers.has(data.userName)) {
            seenUsers.add(data.userName);
            users.push({
              id: doc.id,
              ...data
            } as LiveUser);
          } else if (seenUsers.has(data.userName)) {
            console.log(`    ⚠️ Duplicate user ${data.userName} ignored`);
          }
        });
        
        console.log(`👥 Active users (last 5 min, deduplicated): ${users.length}`);
        users.forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.userName} ${user.userName === currentUser ? '(YOU)' : ''}`);
        });
        
        setLiveUsers(users);
        setHasError(false);
      }, (error) => {
        console.error('❌ Complex query failed, trying simple query:', error);
        setHasError(true);
        
        // Fallback: Simple query without orderBy
        const simpleQuery = query(
          collection(db, 'live_users'),
          where('isActive', '==', true),
          limit(50)
        );
        
        const fallbackUnsubscribe = onSnapshot(simpleQuery, (snapshot) => {
          console.log(`👥 === LIVE USERS UPDATE (SIMPLE QUERY) ===`);
          console.log(`📊 Raw docs from Firebase: ${snapshot.docs.length}`);
          
          const users: LiveUser[] = [];
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          const seenUsers = new Set<string>(); // 🔧 FIX: Track seen usernames to prevent duplicates
          
          snapshot.docs.forEach((doc, index) => {
            const data = doc.data();
            const lastSeen = new Date(data.lastSeen);
            const isRecent = lastSeen > fiveMinutesAgo;
            
            console.log(`  ${index + 1}. ${data.userName} (${data.deviceId}) - Last seen: ${lastSeen.toLocaleTimeString()} - Recent: ${isRecent}`);
            
            // 🔧 FIX: Only include users who were active in the last 5 minutes AND not already seen
            if (isRecent && !seenUsers.has(data.userName)) {
              seenUsers.add(data.userName);
              users.push({
                id: doc.id,
                ...data
              } as LiveUser);
            } else if (seenUsers.has(data.userName)) {
              console.log(`    ⚠️ Duplicate user ${data.userName} ignored`);
            }
          });
          
          // Sort in memory by lastSeen (newest first)
          users.sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
          
          console.log(`👥 Active users (last 5 min, sorted, deduplicated): ${users.length}`);
          users.forEach((user, index) => {
            console.log(`  ${index + 1}. ${user.userName} ${user.userName === currentUser ? '(YOU)' : ''}`);
          });
          
          setLiveUsers(users);
          setHasError(false);
        }, (fallbackError) => {
          console.error('❌ Even simple query failed:', fallbackError);
          setLiveUsers([]);
          setHasError(true);
        });
        
        // Replace the unsubscribe function
        unsubscribe = fallbackUnsubscribe;
      });
      
    } catch (queryError) {
      console.error('❌ Failed to create query:', queryError);
      setHasError(true);
    }

    // Set user offline when leaving
    const handleBeforeUnload = () => {
      console.log(`🚪 Page unload - setting ${currentUser} offline`);
      setOffline();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log(`👁️ Page hidden - setting ${currentUser} offline`);
        setOffline();
      } else {
        console.log(`👁️ Page visible - updating ${currentUser} presence`);
        updatePresence();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      console.log(`🧹 Cleaning up live user tracking for ${currentUser}`);
      clearInterval(presenceInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      setOffline();
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser, isInitialized]);

  const onlineCount = liveUsers.length;
  const otherUsers = liveUsers.filter(user => user.userName !== currentUser);
  const isOnline = onlineCount > 0;
  const currentUserOnline = liveUsers.some(user => user.userName === currentUser);

  console.log(`📊 === LIVE USER INDICATOR RENDER ===`);
  console.log(`👤 Current user: ${currentUser}`);
  console.log(`📊 Total online: ${onlineCount}`);
  console.log(`👤 Current user online: ${currentUserOnline}`);
  console.log(`👥 Other users: ${otherUsers.length}`);
  console.log(`❌ Has error: ${hasError}`);

  const getStatusColor = () => {
    if (hasError) return 'bg-orange-500';
    if (!currentUserOnline) return 'bg-red-500';
    if (onlineCount === 1) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (hasError) return 'Verbindungsfehler';
    if (!currentUserOnline) return 'Offline';
    if (onlineCount === 1) return 'Du bist online';
    return `${onlineCount} online`;
  };

  // Don't show anything if not initialized yet
  if (!isInitialized) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300 ${
        isDarkMode 
          ? 'bg-gray-800/80 border border-gray-700/50 backdrop-blur-sm' 
          : 'bg-white/80 border border-gray-200/50 backdrop-blur-sm shadow-sm'
      }`}>
        <div className="w-3 h-3 rounded-full bg-gray-400 animate-pulse"></div>
        <div className="flex items-center gap-1">
          <Users className={`w-4 h-4 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <span className={`text-sm font-medium transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            ...
          </span>
        </div>
      </div>
    );
  }

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
            {currentUserOnline && !hasError && (
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
          
          {hasError ? (
            <div className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-orange-300' : 'text-orange-600'
            }`}>
              Firebase Index wird erstellt...
              <br />
              <span className="text-xs opacity-75">
                Dies kann einige Minuten dauern
              </span>
            </div>
          ) : onlineCount > 0 ? (
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
              Verbindung wird hergestellt...
            </div>
          )}
          
          <div className={`mt-2 pt-2 border-t text-xs transition-colors duration-300 ${
            isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'
          }`}>
            {hasError ? (
              <>
                ⚠️ Index wird erstellt
                <br />
                <a 
                  href="https://console.firebase.google.com/v1/r/project/weddingpix-744e5/firestore/indexes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Firebase Console öffnen
                </a>
              </>
            ) : (
              'Live-Anzeige • Aktualisiert alle 30s'
            )}
          </div>
        </div>
      )}
    </div>
  );
};