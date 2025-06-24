import React from 'react';
import { Camera, Music, Heart } from 'lucide-react';

interface TabNavigationProps {
  activeTab: 'gallery' | 'music' | 'timeline';
  onTabChange: (tab: 'gallery' | 'music' | 'timeline') => void;
  isDarkMode: boolean;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  isDarkMode
}) => {
  const tabs = [
    {
      id: 'gallery' as const,
      label: 'Galerie',
      icon: <Camera className="w-5 h-5" />,
      emoji: '📸'
    },
    {
      id: 'timeline' as const,
      label: 'Timeline',
      icon: <Heart className="w-5 h-5" />,
      emoji: '💕'
    },
    {
      id: 'music' as const,
      label: 'Musikwünsche',
      icon: <Music className="w-5 h-5" />,
      emoji: '🎵'
    }
  ];

  return (
    <div className={`border-b transition-colors duration-300 ${
      isDarkMode ? 'border-gray-700' : 'border-gray-200'
    }`}>
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 font-medium transition-all duration-300 ${
              activeTab === tab.id
                ? isDarkMode
                  ? 'text-pink-400 border-b-2 border-pink-400 bg-gray-700/30'
                  : 'text-pink-600 border-b-2 border-pink-600 bg-pink-50'
                : isDarkMode
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/20'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <span className="text-lg">{tab.emoji}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};