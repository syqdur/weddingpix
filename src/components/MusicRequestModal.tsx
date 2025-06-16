import React, { useState, useEffect } from 'react';
import { X, Search, Music, Heart, Clock, ExternalLink, Play, Users, MessageSquare, Loader, Sparkles, Link, AlertCircle, CheckCircle } from 'lucide-react';
import { SpotifyTrack } from '../types';
import { searchSpotifyTracks, addMusicRequest, addMusicRequestFromUrl } from '../services/musicService';
import { validateSpotifyUrl } from '../services/spotifyService';

interface MusicRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  deviceId: string;
  isDarkMode: boolean;
}

export const MusicRequestModal: React.FC<MusicRequestModalProps> = ({
  isOpen,
  onClose,
  userName,
  deviceId,
  isDarkMode
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [activeTab, setActiveTab] = useState<'search' | 'url'>('search');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Popular suggestions for empty search
  const popularSuggestions = [
    'Perfect Ed Sheeran',
    'All of Me John Legend',
    'Uptown Funk Bruno Mars',
    'Happy Pharrell Williams',
    'Thinking Out Loud',
    'Can\'t Stop the Feeling',
    'Auf uns Andreas Bourani',
    'Sweet Caroline Neil Diamond',
    'Don\'t Stop Believin Journey',
    'Lieblingsmensch Namika',
    'Metallica Enter Sandman',
    'Nothing Else Matters'
  ];

  // Auto-search when user types
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (searchQuery.trim().length >= 2) {
      setShowSuggestions(false);
      const timeout = setTimeout(async () => {
        setIsSearching(true);
        try {
          const results = await searchSpotifyTracks(searchQuery);
          setSearchResults(results);
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);

      setSearchTimeout(timeout);
    } else {
      setSearchResults([]);
      setShowSuggestions(true);
    }

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchQuery]);

  // Validate Spotify URL when user types
  useEffect(() => {
    if (spotifyUrl.trim()) {
      if (validateSpotifyUrl(spotifyUrl)) {
        setUrlError(null);
      } else {
        setUrlError('Ungültige Spotify-URL. Bitte verwende einen Link zu einem einzelnen Song.');
      }
    } else {
      setUrlError(null);
    }
  }, [spotifyUrl]);

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
  };

  // 🎯 SIMPLIFIED: Songs werden direkt zur Playlist hinzugefügt
  const handleTrackClick = async (track: SpotifyTrack) => {
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    
    try {
      console.log(`🎵 Adding track: ${track.name} by ${track.artists[0].name}`);
      
      // Song wird automatisch zur Playlist hinzugefügt
      await addMusicRequest(track, userName, deviceId, '');
      
      setSuccessMessage(`🎵 "${track.name}" wurde zur Playlist hinzugefügt!`);
      
      // Close modal immediately
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error: any) {
      console.error('Error adding music request:', error);
      
      // 🔍 DUPLICATE DETECTION
      if (error.message?.includes('bereits in der Playlist')) {
        setErrorMessage(`🔄 "${track.name}" ist bereits in der Playlist`);
      } else {
        setErrorMessage(`❌ Fehler: ${error.message || 'Unbekannter Fehler'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitFromUrl = async () => {
    if (!spotifyUrl.trim() || urlError) return;

    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    
    try {
      // Song wird automatisch zur Playlist hinzugefügt
      await addMusicRequestFromUrl(spotifyUrl, userName, deviceId, '');
      
      setSuccessMessage('🎵 Song wurde zur Playlist hinzugefügt!');
      
      // Reset form
      setSpotifyUrl('');
      setSearchQuery('');
      setSearchResults([]);
      setShowSuggestions(true);
      setUrlError(null);
      
      // Close modal immediately
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error: any) {
      console.error('Error submitting music request from URL:', error);
      
      // 🔍 DUPLICATE DETECTION
      if (error.message?.includes('bereits in der Playlist')) {
        setErrorMessage(`🔄 Song ist bereits in der Playlist`);
      } else {
        setErrorMessage(`❌ Fehler: ${error.message || 'Unbekannter Fehler'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getPopularityColor = (popularity: number) => {
    if (popularity >= 85) return 'text-green-600 bg-green-100';
    if (popularity >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b transition-colors duration-300 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full transition-colors duration-300 ${
              isDarkMode ? 'bg-green-600' : 'bg-green-500'
            }`}>
              <Music className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className={`text-xl font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                🎵 Song zur Playlist hinzufügen
              </h3>
              <p className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Songs werden automatisch zur Hochzeits-Playlist hinzugefügt
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className={`p-2 rounded-full transition-colors duration-300 ${
              isSubmitting
                ? 'cursor-not-allowed opacity-50'
                : isDarkMode 
                  ? 'hover:bg-gray-700 text-gray-400' 
                  : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Success Message */}
          {successMessage && (
            <div className={`mb-6 p-4 rounded-xl border transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-green-900/20 border-green-700/30 text-green-300' 
                : 'bg-green-50 border-green-200 text-green-700'
            }`}>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <div className="font-semibold">{successMessage}</div>
              </div>
              <div className="text-sm mt-1 opacity-75">
                Das Fenster schließt sich automatisch...
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className={`mb-6 p-4 rounded-xl border transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-red-900/20 border-red-700/30 text-red-300' 
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <div className="font-semibold">{errorMessage}</div>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex mb-6">
            <button
              onClick={() => setActiveTab('search')}
              disabled={isSubmitting}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-medium transition-all duration-300 ${
                activeTab === 'search'
                  ? isDarkMode
                    ? 'text-green-400 border-b-2 border-green-400 bg-gray-700/30'
                    : 'text-green-600 border-b-2 border-green-600 bg-green-50'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/20'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              } ${isSubmitting ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <Search className="w-4 h-4" />
              Song suchen
            </button>
            <button
              onClick={() => setActiveTab('url')}
              disabled={isSubmitting}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-medium transition-all duration-300 ${
                activeTab === 'url'
                  ? isDarkMode
                    ? 'text-green-400 border-b-2 border-green-400 bg-gray-700/30'
                    : 'text-green-600 border-b-2 border-green-600 bg-green-50'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/20'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              } ${isSubmitting ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <Link className="w-4 h-4" />
              Spotify-Link
            </button>
          </div>

          {activeTab === 'search' ? (
            <>
              {/* Search Section */}
              <div className="mb-6">
                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  🔍 Song suchen
                </label>
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="z.B. 'Perfect Ed Sheeran' oder 'Metallica'..."
                    disabled={isSubmitting}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors duration-300 ${
                      isSubmitting
                        ? 'cursor-not-allowed opacity-50'
                        : ''
                    } ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader className="w-5 h-5 animate-spin text-green-500" />
                    </div>
                  )}
                </div>
                <p className={`text-xs mt-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  💡 Songs werden automatisch zur Hochzeits-Playlist hinzugefügt!
                </p>
              </div>

              {/* Popular Suggestions */}
              {showSuggestions && searchQuery.length < 2 && !isSubmitting && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className={`w-4 h-4 transition-colors duration-300 ${
                      isDarkMode ? 'text-yellow-400' : 'text-yellow-500'
                    }`} />
                    <h4 className={`font-semibold transition-colors duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      🔥 Beliebte Hochzeitssongs:
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {popularSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className={`px-3 py-2 rounded-full text-sm transition-all duration-300 hover:scale-105 ${
                          isDarkMode 
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600' 
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                        }`}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Results */}
              {searchResults.length > 0 && !isSubmitting && (
                <div className="space-y-3">
                  <h4 className={`font-semibold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    🎵 Suchergebnisse ({searchResults.length}):
                  </h4>
                  {searchResults.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => handleTrackClick(track)}
                      className={`w-full p-4 rounded-xl border transition-all duration-300 hover:scale-[1.02] ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' 
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-300 flex-shrink-0">
                          <img 
                            src={track.album.images[0]?.url || '/placeholder-album.png'}
                            alt={track.album.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <h5 className={`font-semibold truncate transition-colors duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {track.name}
                          </h5>
                          <p className={`text-sm truncate transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {track.artists.map(a => a.name).join(', ')}
                          </p>
                          <p className={`text-xs truncate transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-500'
                          }`}>
                            {track.album.name} • {formatDuration(track.duration_ms)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPopularityColor(track.popularity)}`}>
                            <Heart className="w-3 h-3" />
                            {track.popularity}%
                          </div>
                          <div className={`text-xs px-2 py-1 rounded-full transition-colors duration-300 ${
                            isDarkMode ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'
                          }`}>
                            🎵 Zur Playlist
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && !isSubmitting && (
                <div className="text-center py-8">
                  <Music className={`w-12 h-12 mx-auto mb-4 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-600' : 'text-gray-400'
                  }`} />
                  <p className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Keine Songs gefunden für "{searchQuery}"
                  </p>
                  <p className={`text-sm mt-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    Versuche es mit einem anderen Suchbegriff
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Spotify URL Section */}
              <div className="mb-6">
                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  🔗 Spotify-Link einfügen
                </label>
                <div className="relative">
                  <Link className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    type="url"
                    value={spotifyUrl}
                    onChange={(e) => setSpotifyUrl(e.target.value)}
                    placeholder="https://open.spotify.com/track/..."
                    disabled={isSubmitting}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors duration-300 ${
                      urlError
                        ? 'border-red-500 focus:ring-red-500'
                        : ''
                    } ${
                      isSubmitting
                        ? 'cursor-not-allowed opacity-50'
                        : ''
                    } ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                
                {urlError && (
                  <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {urlError}
                  </div>
                )}
                
                <div className={`mt-3 p-3 rounded-lg transition-colors duration-300 ${
                  isDarkMode ? 'bg-blue-900/20 border border-blue-700/30' : 'bg-blue-50 border border-blue-200'
                }`}>
                  <h5 className={`font-semibold mb-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-blue-300' : 'text-blue-800'
                  }`}>
                    📱 So findest du den Spotify-Link:
                  </h5>
                  <ol className={`text-sm space-y-1 transition-colors duration-300 ${
                    isDarkMode ? 'text-blue-200' : 'text-blue-700'
                  }`}>
                    <li>1. Öffne Spotify (App oder Web)</li>
                    <li>2. Suche deinen gewünschten Song</li>
                    <li>3. Klicke auf "Teilen" (⋯ oder Share)</li>
                    <li>4. Wähle "Song-Link kopieren"</li>
                    <li>5. Füge den Link hier ein</li>
                  </ol>
                </div>
              </div>

              {/* URL Submit Button */}
              {spotifyUrl.trim() && !urlError && (
                <div className="mb-6">
                  <button
                    onClick={handleSubmitFromUrl}
                    disabled={isSubmitting}
                    className={`w-full py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 ${
                      isSubmitting
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700'
                    } text-white`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Song wird hinzugefügt...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        🎵 Zur Playlist hinzufügen
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Loading State */}
          {isSubmitting && (
            <div className="text-center py-8">
              <div className="w-8 h-8 mx-auto border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className={`text-lg font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Song wird zur Playlist hinzugefügt...
              </p>
              <p className={`text-sm mt-1 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Song wird automatisch zur Hochzeits-Playlist hinzugefügt
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};