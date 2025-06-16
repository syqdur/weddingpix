import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Heart, ExternalLink, Music } from 'lucide-react';

interface NowPlayingTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: number;
  progress: number;
  isPlaying: boolean;
  spotifyUrl?: string;
}

interface NowPlayingWidgetProps {
  isDarkMode: boolean;
}

export const NowPlayingWidget: React.FC<NowPlayingWidgetProps> = ({ isDarkMode }) => {
  const [currentTrack, setCurrentTrack] = useState<NowPlayingTrack | null>(null);
  const [isLiked, setIsLiked] = useState(false);

  // 🎵 MOCK: Simulate currently playing track (in real app, this would come from Spotify API)
  useEffect(() => {
    // Simulate a currently playing track
    const mockTrack: NowPlayingTrack = {
      id: 'perfect-ed-sheeran',
      name: 'Perfect',
      artist: 'Ed Sheeran',
      album: '÷ (Divide)',
      albumArt: 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
      duration: 263000, // 4:23
      progress: 125000, // 2:05
      isPlaying: true,
      spotifyUrl: 'https://open.spotify.com/track/0tgVpDi06FyKpA1z0VMD4v'
    };

    setCurrentTrack(mockTrack);

    // Simulate progress updates
    const interval = setInterval(() => {
      setCurrentTrack(prev => {
        if (!prev || !prev.isPlaying) return prev;
        
        const newProgress = prev.progress + 1000;
        if (newProgress >= prev.duration) {
          // Song ended, simulate next track
          return {
            ...prev,
            progress: 0,
            name: 'Thinking Out Loud',
            artist: 'Ed Sheeran',
            album: 'x (Multiply)',
            duration: 281000
          };
        }
        
        return {
          ...prev,
          progress: newProgress
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePlayPause = () => {
    setCurrentTrack(prev => prev ? { ...prev, isPlaying: !prev.isPlaying } : null);
  };

  const toggleLike = () => {
    setIsLiked(!isLiked);
  };

  if (!currentTrack) {
    return (
      <div className={`p-4 rounded-xl transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-16 h-16 rounded-lg flex items-center justify-center transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <Music className={`w-8 h-8 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`} />
          </div>
          <div className="flex-1">
            <h4 className={`font-semibold transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Kein Song wird gespielt
            </h4>
            <p className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Starte die Musik um den aktuellen Song zu sehen
            </p>
          </div>
        </div>
      </div>
    );
  }

  const progressPercentage = (currentTrack.progress / currentTrack.duration) * 100;

  return (
    <div className={`p-6 rounded-xl transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700 backdrop-blur-sm' 
        : 'bg-gradient-to-br from-white/90 to-gray-50/90 border border-gray-200 shadow-lg backdrop-blur-sm'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-2 rounded-full transition-colors duration-300 ${
          isDarkMode ? 'bg-green-600' : 'bg-green-500'
        }`}>
          <Volume2 className="w-4 h-4 text-white" />
        </div>
        <h3 className={`font-semibold text-sm transition-colors duration-300 ${
          isDarkMode ? 'text-green-400' : 'text-green-600'
        }`}>
          🎵 Wird gerade gespielt
        </h3>
        {currentTrack.isPlaying && (
          <div className="flex items-center gap-1">
            <div className="w-1 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <div className="w-1 h-4 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-1 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Album Art - Larger */}
        <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-300 flex-shrink-0 shadow-lg">
          <img 
            src={currentTrack.albumArt}
            alt={currentTrack.album}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <h4 className={`font-bold text-lg truncate transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {currentTrack.name}
          </h4>
          <p className={`text-sm truncate transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {currentTrack.artist}
          </p>
          <p className={`text-xs truncate transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {currentTrack.album}
          </p>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className={`w-full h-1 rounded-full transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <div 
                className="h-full bg-green-500 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className={`text-xs transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {formatTime(currentTrack.progress)}
              </span>
              <span className={`text-xs transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {formatTime(currentTrack.duration)}
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-3">
          {/* Main Controls */}
          <div className="flex items-center gap-2">
            <button
              className={`p-2 rounded-full transition-all duration-300 hover:scale-110 ${
                isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              title="Vorheriger Song"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlayPause}
              className={`p-3 rounded-full transition-all duration-300 hover:scale-110 ${
                isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
              } text-white shadow-lg`}
              title={currentTrack.isPlaying ? 'Pausieren' : 'Abspielen'}
            >
              {currentTrack.isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>

            <button
              className={`p-2 rounded-full transition-all duration-300 hover:scale-110 ${
                isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              title="Nächster Song"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Secondary Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLike}
              className={`p-1.5 rounded-full transition-all duration-300 hover:scale-110 ${
                isLiked 
                  ? 'text-red-500' 
                  : isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Gefällt mir"
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            </button>

            {currentTrack.spotifyUrl && (
              <a
                href={currentTrack.spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-1.5 rounded-full transition-all duration-300 hover:scale-110 ${
                  isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
                } text-white`}
                title="In Spotify öffnen"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};