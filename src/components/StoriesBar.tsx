import React from 'react';
import { Plus } from 'lucide-react';
import { Story } from '../services/liveService';

interface StoriesBarProps {
  stories: Story[];
  currentUser: string;
  onAddStory: () => void;
  onViewStory: (storyIndex: number) => void;
  isDarkMode: boolean;
}

export const StoriesBar: React.FC<StoriesBarProps> = ({
  stories,
  currentUser,
  onAddStory,
  onViewStory,
  isDarkMode
}) => {
  // Group stories by user
  const groupedStories = stories.reduce((acc, story) => {
    if (!acc[story.userName]) {
      acc[story.userName] = [];
    }
    acc[story.userName].push(story);
    return acc;
  }, {} as Record<string, Story[]>);

  // Get unique users with their latest story
  const userStories = Object.entries(groupedStories).map(([userName, userStoriesArray]) => ({
    userName,
    stories: userStoriesArray,
    latestStory: userStoriesArray[userStoriesArray.length - 1],
    hasUnviewed: userStoriesArray.some(story => !story.views.includes(currentUser))
  }));

  // Sort by latest story time
  userStories.sort((a, b) => {
    return new Date(b.latestStory.createdAt).getTime() - new Date(a.latestStory.createdAt).getTime();
  });

  const getAvatarUrl = (username: string) => {
    const weddingAvatars = [
      'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1616113/pexels-photo-1616113.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1729797/pexels-photo-1729797.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1070850/pexels-photo-1070850.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1444424/pexels-photo-1444424.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1024967/pexels-photo-1024967.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1729799/pexels-photo-1729799.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1444443/pexels-photo-1444443.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
    ];
    
    const hash = username.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return weddingAvatars[Math.abs(hash) % weddingAvatars.length];
  };

  const handleStoryClick = (userName: string) => {
    // Find the first story index for this user in the original stories array
    const firstStoryIndex = stories.findIndex(story => story.userName === userName);
    if (firstStoryIndex !== -1) {
      onViewStory(firstStoryIndex);
    }
  };

  if (userStories.length === 0) {
    return null; // Don't show stories bar if no stories exist
  }

  return (
    <div className={`p-4 border-b transition-colors duration-300 ${
      isDarkMode ? 'border-gray-700' : 'border-gray-100'
    }`}>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {/* User Stories */}
        {userStories.map((userStory) => (
          <div key={userStory.userName} className="flex flex-col items-center gap-2 flex-shrink-0">
            <button
              onClick={() => handleStoryClick(userStory.userName)}
              className="relative"
            >
              <div className={`w-16 h-16 rounded-full p-0.5 transition-all duration-300 ${
                userStory.hasUnviewed
                  ? 'bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500'
                  : isDarkMode
                    ? 'bg-gray-600'
                    : 'bg-gray-300'
              }`}>
                <div className={`w-full h-full rounded-full overflow-hidden border-2 transition-colors duration-300 ${
                  isDarkMode ? 'border-gray-800' : 'border-white'
                }`}>
                  <img 
                    src={getAvatarUrl(userStory.userName)}
                    alt={userStory.userName}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              {/* Story count indicator */}
              {userStory.stories.length > 1 && (
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-700 text-white border-2 border-gray-800' : 'bg-white text-gray-900 border-2 border-white shadow-sm'
                }`}>
                  {userStory.stories.length}
                </div>
              )}
            </button>
            <span className={`text-xs text-center max-w-[64px] truncate transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {userStory.userName === currentUser ? 'Du' : userStory.userName}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};