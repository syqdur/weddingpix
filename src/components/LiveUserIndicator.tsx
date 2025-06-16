import React, { useState, useEffect } from 'react';
import { Users, Eye } from 'lucide-react';

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

  // Mock live users for demonstration (replace with real Firebase subscription)
  useEffect(() => {
    // Simulate live users
    const mockUsers: LiveUser[] = [
      {
        id: '1',
        userName: currentUser,
        deviceId: 'current-device',
        lastSeen: new Date().toISOString(),
        isActive: true
      }
    ];

    // Add some random users occasionally
    const interval = setInterval(() => {
      const randomUsers = ['Anna', 'Tom', 'Lisa', 'Max', 'Sarah', 'Ben'];
      const shouldAddUser = Math.random() > 0.7;
      
      if (shouldAddUser && mockUsers.length < 5) {
        const randomName = randomUsers[Math.floor(Math.random() * randomUsers.length)];
        if (!mockUsers.find(u => u.userName === randomName)) {
          mockUsers.push({
            id: Math.random().toString(),
            userName: randomName,
            deviceId: `device-${Math.random()}`,
            lastSeen: new Date().toISOString(),
            isActive: true
          });
        }
      } else if (mockUsers.length > 1 && Math.random() > 0.8) {
        // Sometimes remove a user (except current user)
        const nonCurrentUsers = mockUsers.filter(u => u.userName !== currentUser);
        if (nonCurrentUsers.length > 0) {
          const userToRemove = nonCurrentUsers[Math.floor(Math.random() * nonCurrentUsers.length)];
          const index = mockUsers.findIndex(u => u.id === userToRemove.id);
          if (index > -1) {
            mockUsers.splice(index, 1);
          }
        }
      }
      
      setLiveUsers([...mockUsers]);
    }, 3000);

    setLiveUsers(mockUsers);

    return () => clearInterval(interval);
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