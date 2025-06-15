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
  console.log(`📱 === STORIES BAR RENDER ===`);
  console.log(`📊 Total stories: ${stories.length}`);
  console.log(`👤 Current user: ${currentUser}`);
  
  // Group stories by user
  const groupedStories = stories.reduce((acc, story) => {
    if (!acc[story.userName]) {
      acc[story.userName] = [];
    }
    acc[story.userName].push(story);
    return acc;
  }, {} as Record<string, Story[]>);

  console.log(`👥 Grouped stories:`, Object.keys(groupedStories).map(user => `${user}: ${groupedStories[user].length}`));

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

  console.log(`📋 User stories sorted:`, userStories.map(us => `${us.userName} (${us.stories.length} stories, unviewed: ${us.hasUnviewed})`));

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
    console.log(`🎯 Story clicked for user: ${userName}`);
    
    // Find the first story index for this user in the original stories array
    const firstStoryIndex = stories.findIndex(story => story.userName === userName);
    console.log(`📍 First story index for ${userName}: ${firstStoryIndex}`);
    
    if (firstStoryIndex !== -1) {
      onViewStory(firstStoryIndex);
    }
  };

  // 🔧 FIX: Always show Stories Bar, even if no stories exist
  return (
    <div className={`p-4 border-b transition-colors duration-300 ${
      isDarkMode ? 'border-gray-700' : 'border-gray-100'
    }`}>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {/* Add Story Button - Always visible */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <button
            onClick={onAddStory}
            className={`w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center transition-all duration-300 ${
              isDarkMode 
                ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/30' 
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <Plus className={`w-6 h-6 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`} />
          </button>
          <span className={`text-xs text-center transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Deine Story
          </span>
        </div>

        {/* User Stories - Only show if stories exist */}
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

        {/* Empty state message when no stories exist */}
        {userStories.length === 0 && (
          <div className="flex items-center justify-center flex-1 py-4">
            <div className="text-center">
              <div className={`text-2xl mb-2`}>⚡</div>
              <p className={`text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Noch keine Stories
              </p>
              <p className={`text-xs transition-colors duration-300 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-500'
              }`}>
                Sei der Erste und teile einen spontanen Moment!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};