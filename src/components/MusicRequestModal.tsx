import React, { useState, useEffect } from 'react';
import { X, Search, Music, Heart, Clock, ExternalLink, Play, Users, MessageSquare, Loader, Sparkles } from 'lucide-react';
import { SpotifyTrack } from '../types';
import { searchSpotifyTracks, addMusicRequest } from '../services/musicService';

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
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Popular suggestions for empty search
  const popularSuggestions = [
    'Perfect Ed Sheeran',
    'All of Me',
    'Uptown Funk',
    'Happy Pharrell',
    'Thinking Out Loud',
    'Can\'t Stop the Feeling',
    'Auf uns',
    'Sweet Caroline'
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

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
  };

  const handleSubmitRequest = async () => {
    if (!selectedTrack) return;

    setIsSubmitting(true);
    try {
      await addMusicRequest(selectedTrack, userName, deviceId, message);
      
      // Reset form
      setSelectedTrack(null);
      setMessage('');
      setSearchQuery('');
      setSearchResults([]);
      setShowSuggestions(true);
      
      onClose();
    } catch (error) {
      console.error('Error submitting music request:', error);
      alert('Fehler beim Senden des Musikwunsches. Bitte versuche es erneut.');
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
                🎵 Musikwunsch
              </h3>
              <p className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Wünsche dir einen Song für die Hochzeit
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors duration-300 ${
              isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {!selectedTrack ? (
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
                    placeholder="z.B. 'Perfect Ed Sheeran' oder 'Uptown Funk'..."
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors duration-300 ${
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
              </div>

              {/* Popular Suggestions */}
              {showSuggestions && searchQuery.length < 2 && (
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
              {searchResults.length > 0 && (
                <div className="space-y-3">
                  <h4 className={`font-semibold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    🎵 Suchergebnisse ({searchResults.length}):
                  </h4>
                  {searchResults.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => setSelectedTrack(track)}
                      className={`w-full p-4 rounded-xl border transition-all duration-300 hover:scale-[1.02] ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' 
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-300 flex-shrink-0">
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
                          <ExternalLink className={`w-4 h-4 transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`} />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
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
                  <div className="mt-4">
                    <p className={`text-xs mb-2 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      💡 Tipps:
                    </p>
                    <div className={`text-xs space-y-1 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <div>• Verwende Künstler + Songtitel (z.B. "Ed Sheeran Perfect")</div>
                      <div>• Probiere deutsche oder englische Begriffe</div>
                      <div>• Nutze die beliebten Vorschläge oben</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Selected Track */}
              <div className={`p-6 rounded-xl border mb-6 transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-300">
                    <img 
                      src={selectedTrack.album.images[0]?.url || '/placeholder-album.png'}
                      alt={selectedTrack.album.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-lg font-semibold transition-colors duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {selectedTrack.name}
                    </h4>
                    <p className={`transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {selectedTrack.artists.map(a => a.name).join(', ')}
                    </p>
                    <p className={`text-sm transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {selectedTrack.album.name}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="w-4 h-4" />
                        {formatDuration(selectedTrack.duration_ms)}
                      </div>
                      <div className={`flex items-center gap-1 text-sm px-2 py-1 rounded-full ${getPopularityColor(selectedTrack.popularity)}`}>
                        <Heart className="w-4 h-4" />
                        {selectedTrack.popularity}% Beliebtheit
                      </div>
                    </div>
                  </div>
                  <a
                    href={selectedTrack.external_urls.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-2 rounded-full transition-colors duration-300 ${
                      isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
                    }`}
                    title="Auf Spotify anhören"
                  >
                    <ExternalLink className="w-5 h-5 text-white" />
                  </a>
                </div>
              </div>

              {/* Message */}
              <div className="mb-6">
                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  💌 Nachricht (optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Warum wünschst du dir diesen Song? (z.B. 'Unser Hochzeitslied!' oder 'Perfekt zum Tanzen!')"
                  rows={3}
                  maxLength={200}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
                <div className={`text-xs mt-1 text-right transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {message.length}/200
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedTrack(null)}
                  className={`flex-1 py-3 px-4 rounded-xl transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' 
                      : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                  }`}
                >
                  Zurück
                </button>
                <button
                  onClick={handleSubmitRequest}
                  disabled={isSubmitting}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Sende...
                    </>
                  ) : (
                    <>
                      <Music className="w-4 h-4" />
                      Wunsch senden
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export { MusicRequestModal }