import React from 'react';
import { Eye, Users } from 'lucide-react';
import { LiveUser } from '../services/liveService';

interface LiveViewCounterProps {
  liveUsers: LiveUser[];
  currentUser: string;
  isDarkMode: boolean;
}

export const LiveViewCounter: React.FC<LiveViewCounterProps> = ({
  liveUsers,
  currentUser,
  isDarkMode
}) => {
  const otherUsers = liveUsers.filter(user => user.userName !== currentUser);
  const totalUsers = liveUsers.length;

  if (totalUsers === 0) return null;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300 ${
      isDarkMode 
        ? 'bg-gray-800/80 border border-gray-700/50 backdrop-blur-sm' 
        : 'bg-white/80 border border-gray-200/50 backdrop-blur-sm shadow-sm'
    }`}>
      <div className="relative">
        <Eye className={`w-4 h-4 transition-colors duration-300 ${
          isDarkMode ? 'text-green-400' : 'text-green-600'
        }`} />
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      </div>
      
      <span className={`text-sm font-medium transition-colors duration-300 ${
        isDarkMode ? 'text-white' : 'text-gray-900'
      }`}>
        {totalUsers === 1 ? 'Du bist online' : `${totalUsers} online`}
      </span>
      
      {otherUsers.length > 0 && (
        <div className="flex items-center gap-1 ml-1">
          <Users className={`w-3 h-3 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`} />
          <span className={`text-xs transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {otherUsers.length === 1 
              ? `+${otherUsers[0].userName}` 
              : `+${otherUsers.length} weitere`
            }
          </span>
        </div>
      )}
    </div>
  );
};