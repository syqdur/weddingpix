import React, { useState, useEffect } from 'react';
import { X, Search, Music, ExternalLink, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { SpotifyTrack } from '../types';
import { searchSpotifyTracks } from '../services/spotifyAuthService';
import { addMusicRequest, addMusicRequestFromUrl } from '../services/musicService';

interface MusicRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  deviceId: string;
  isDarkMode: boolean;
  onSuccess?: () => void;
}

export const MusicRequestModal: React.FC<MusicRequestModalProps> = ({
  isOpen,
  onClose,
  userName,
  deviceId,
  isDarkMode,
  onSuccess
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
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

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleTrackSelect = async (track: SpotifyTrack) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await addMusicRequest(track, userName, deviceId);
      setSuccess(`🎉 "${track.name}" wurde zur Playlist hinzugefügt!`);
      
      // Reset form
      setSearchQuery('');
      setSearchResults([]);
      setUrlInput('');
      
      onSuccess?.();
      
      // Close modal after short delay
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error: any) {
      setError(error.message || 'Fehler beim Hinzufügen des Songs');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await addMusicRequestFromUrl(urlInput.trim(), userName, deviceId);
      setSuccess('🎉 Song wurde zur Playlist hinzugefügt!');
      
      // Reset form
      setSearchQuery('');
      setSearchResults([]);
      setUrlInput('');
      
      onSuccess?.();
      
      // Close modal after short delay
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error: any) {
      setError(error.message || 'Fehler beim Hinzufügen des Songs');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-300 ${
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
                🎵 Musikwunsch hinzufügen
              </h3>
              <p className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Suche nach Songs oder füge einen Spotify-Link hinzu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className={`p-2 rounded-full transition-colors duration-300 ${
              isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Success Message */}
          {success && (
            <div className={`mb-4 p-4 rounded-xl border transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-green-900/20 border-green-700/30 text-green-300' 
                : 'bg-green-50 border-green-200 text-green-700'
            }`}>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5" />
                <div>
                  <div className="font-semibold">{success}</div>
                  <div className="text-sm mt-1">
                    ✅ Song wurde zur Hochzeits-Playlist hinzugefügt
                    <br />
                    🎯 Automatisch auch zu Spotify synchronisiert
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className={`mb-4 p-4 rounded-xl border transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-red-900/20 border-red-700/30 text-red-300' 
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5" />
                <div>
                  <div className="font-semibold">Fehler beim Hinzufügen</div>
                  <div className="text-sm mt-1">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Search Section */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              🔍 Song suchen
            </label>
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="z.B. Perfect Ed Sheeran, Metallica Enter Sandman, Hochzeitslieder..."
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                disabled={isSubmitting}
              />
            </div>
            
            {isSearching && (
              <div className="mt-2 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                <span className={`text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Durchsuche Millionen von Songs...
                </span>
              </div>
            )}

            {/* Search Tips */}
            <div className={`mt-2 text-xs transition-colors duration-300 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-500'
            }`}>
              💡 Tipp: Suche nach "Hochzeit", "Party", "Metallica", "Ed Sheeran", "Beatles" oder deinen Lieblingskünstlern
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mb-6">
              <h4 className={`font-semibold mb-3 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                🎵 Suchergebnisse ({searchResults.length}):
              </h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {searchResults.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => handleTrackSelect(track)}
                    disabled={isSubmitting}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-300 hover:scale-[1.02] ${
                      isSubmitting
                        ? 'cursor-not-allowed opacity-50'
                        : isDarkMode 
                          ? 'hover:bg-gray-700 text-gray-300 border border-gray-600' 
                          : 'hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {track.album?.images?.[0] ? (
                        <img 
                          src={track.album.images[0].url} 
                          alt={track.name}
                          className="w-12 h-12 rounded object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-gray-300 flex items-center justify-center">
                          <Music className="w-6 h-6 text-gray-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{track.name}</div>
                        <div className="text-sm opacity-75 truncate">
                          {track.artists.map(a => a.name).join(', ')}
                        </div>
                        {track.album?.name && (
                          <div className="text-xs opacity-60 truncate">
                            {track.album.name}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs opacity-60">
                          {track.popularity}% ⭐
                        </div>
                        <Plus className="w-4 h-4 text-green-500" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* URL Input Section */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              🔗 Oder Spotify-Link hinzufügen
            </label>
            <form onSubmit={handleUrlSubmit} className="space-y-3">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://open.spotify.com/track/..."
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={!urlInput.trim() || isSubmitting}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl transition-colors font-medium"
              >
                {isSubmitting ? 'Wird hinzugefügt...' : '🎯 Song zur Playlist hinzufügen'}
              </button>
            </form>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className={`w-full mt-6 py-3 px-4 rounded-xl transition-colors duration-300 ${
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