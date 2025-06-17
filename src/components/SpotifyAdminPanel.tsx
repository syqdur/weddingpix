import React, { useState, useEffect } from 'react';
import { Music, User, LogOut, Loader, CheckCircle, AlertCircle, ExternalLink, Copy, Check, Calendar } from 'lucide-react';
import { SpotifyPlaylist, SpotifyUser } from '../types';
import { 
  generateSpotifyAuthUrl, 
  getUserPlaylists, 
  setSelectedPlaylist, 
  getSelectedPlaylist,
  getStoredUser,
  getCurrentUser,
  logout,
  isSpotifyAuthenticated,
  getSharedTokenInfo
} from '../services/spotifyAuthService';

interface SpotifyAdminPanelProps {
  isDarkMode: boolean;
  onClose: () => void;
}

export const SpotifyAdminPanel: React.FC<SpotifyAdminPanelProps> = ({ isDarkMode, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [sharedTokenInfo, setSharedTokenInfo] = useState<any>(null);

  // Load user and playlists on mount
  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      try {
        // Check if user is already authenticated
        const isAuthenticated = isSpotifyAuthenticated();
        
        if (isAuthenticated) {
          // Get stored user
          const storedUser = getStoredUser();
          
          if (storedUser) {
            setUser(storedUser);
          } else {
            // Fetch current user
            const currentUser = await getCurrentUser();
            if (currentUser) {
              setUser(currentUser);
            }
          }
          
          // Get selected playlist
          const playlist = getSelectedPlaylist();
          if (playlist) {
            setSelectedPlaylistId(playlist.id);
          }
          
          // Load playlists
          loadPlaylists();
        }
        
        // Get shared token info
        const tokenInfo = getSharedTokenInfo();
        setSharedTokenInfo(tokenInfo);
        
      } catch (error) {
        console.error('Error loading user data:', error);
        setError('Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, []);

  const loadPlaylists = async () => {
    setIsLoadingPlaylists(true);
    try {
      const userPlaylists = await getUserPlaylists();
      setPlaylists(userPlaylists);
      setError(null);
    } catch (error) {
      console.error('Error loading playlists:', error);
      setError('Failed to load playlists');
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  const handleLogin = () => {
    const authUrl = generateSpotifyAuthUrl();
    window.location.href = authUrl;
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to disconnect Spotify? This will affect all users.')) {
      logout();
      setUser(null);
      setPlaylists([]);
      setSelectedPlaylistId(null);
      setSharedTokenInfo(null);
    }
  };

  const handleSelectPlaylist = (playlist: SpotifyPlaylist) => {
    setSelectedPlaylist(playlist);
    setSelectedPlaylistId(playlist.id);
  };

  const formatExpiryDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className={`p-6 rounded-xl border transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
    }`}>
      <div className="flex items-center justify-between mb-6">
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
              Spotify Integration
            </h3>
            <p className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {user ? 'Manage your Spotify connection' : 'Connect your Spotify account'}
            </p>
          </div>
        </div>
      </div>

      {/* Shared Token Status */}
      {sharedTokenInfo && (
        <div className={`mb-6 p-4 rounded-xl border transition-colors duration-300 ${
          sharedTokenInfo.daysRemaining <= 7
            ? isDarkMode ? 'bg-yellow-900/20 border-yellow-700/30' : 'bg-yellow-50 border-yellow-200'
            : isDarkMode ? 'bg-green-900/20 border-green-700/30' : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className={`w-5 h-5 transition-colors duration-300 ${
              isDarkMode ? 'text-green-400' : 'text-green-600'
            }`} />
            <h4 className={`font-semibold transition-colors duration-300 ${
              isDarkMode ? 'text-green-300' : 'text-green-800'
            }`}>
              🌍 Spotify Integration aktiv für ALLE Benutzer
            </h4>
          </div>
          <div className="flex items-center gap-4">
            <p className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-green-200' : 'text-green-700'
            }`}>
              Eingerichtet von {sharedTokenInfo.admin} am {new Date(sharedTokenInfo.timestamp).toLocaleDateString('de-DE')}
            </p>
            <div className="flex items-center gap-1">
              <Calendar className={`w-4 h-4 transition-colors duration-300 ${
                sharedTokenInfo.daysRemaining <= 7
                  ? isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                  : isDarkMode ? 'text-green-400' : 'text-green-600'
              }`} />
              <span className={`text-sm font-medium transition-colors duration-300 ${
                sharedTokenInfo.daysRemaining <= 7
                  ? isDarkMode ? 'text-yellow-300' : 'text-yellow-800'
                  : isDarkMode ? 'text-green-300' : 'text-green-800'
              }`}>
                {sharedTokenInfo.daysRemaining <= 7 
                  ? `Läuft in ${sharedTokenInfo.daysRemaining} Tagen ab`
                  : `Gültig bis ${formatExpiryDate(sharedTokenInfo.expiryTime)} (${sharedTokenInfo.daysRemaining} Tage)`
                }
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className={`mb-6 p-4 rounded-xl border transition-colors duration-300 ${
          isDarkMode ? 'bg-red-900/20 border-red-700/30' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            <AlertCircle className={`w-5 h-5 transition-colors duration-300 ${
              isDarkMode ? 'text-red-400' : 'text-red-600'
            }`} />
            <p className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-red-300' : 'text-red-700'
            }`}>
              {error}
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader className="w-10 h-10 text-green-500 animate-spin" />
            <p className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Loading Spotify data...
            </p>
          </div>
        </div>
      ) : user ? (
        <div className="space-y-6">
          {/* User Info */}
          <div className={`p-4 rounded-xl border transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-green-500">
                {user.images && user.images.length > 0 ? (
                  <img 
                    src={user.images[0].url} 
                    alt={user.display_name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h4 className={`font-semibold transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {user.display_name}
                </h4>
                <p className={`text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {user.email || 'Spotify User'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className={`p-2 rounded-lg transition-colors duration-300 ${
                  isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'
                } text-white`}
                title="Disconnect Spotify"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Playlists */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className={`font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Your Playlists
              </h4>
              <button
                onClick={loadPlaylists}
                disabled={isLoadingPlaylists}
                className={`text-sm px-3 py-1 rounded transition-colors duration-300 ${
                  isLoadingPlaylists
                    ? 'cursor-not-allowed opacity-50'
                    : isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {isLoadingPlaylists ? (
                  <span className="flex items-center gap-1">
                    <Loader className="w-3 h-3 animate-spin" />
                    Loading...
                  </span>
                ) : 'Refresh'}
              </button>
            </div>

            {isLoadingPlaylists ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-8 h-8 text-green-500 animate-spin" />
              </div>
            ) : playlists.length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {playlists.map(playlist => (
                  <div
                    key={playlist.id}
                    className={`p-3 rounded-lg border transition-all duration-300 ${
                      selectedPlaylistId === playlist.id
                        ? isDarkMode
                          ? 'bg-green-900/20 border-green-700/30'
                          : 'bg-green-50 border-green-200'
                        : isDarkMode
                          ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded overflow-hidden bg-gray-300">
                        {playlist.images && playlist.images.length > 0 ? (
                          <img 
                            src={playlist.images[0].url} 
                            alt={playlist.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music className="w-5 h-5 text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className={`font-medium truncate transition-colors duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {playlist.name}
                        </h5>
                        <p className={`text-xs truncate transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {playlist.tracks.total} songs • {playlist.owner.display_name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSelectPlaylist(playlist)}
                          className={`p-2 rounded transition-colors duration-300 ${
                            selectedPlaylistId === playlist.id
                              ? isDarkMode
                                ? 'bg-green-600 text-white'
                                : 'bg-green-500 text-white'
                              : isDarkMode
                                ? 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                          }`}
                          title={selectedPlaylistId === playlist.id ? 'Selected' : 'Select playlist'}
                        >
                          {selectedPlaylistId === playlist.id ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <Music className="w-5 h-5" />
                          )}
                        </button>
                        <a
                          href={`https://open.spotify.com/playlist/${playlist.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`p-2 rounded transition-colors duration-300 ${
                            isDarkMode
                              ? 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                          }`}
                          title="Open in Spotify"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`p-8 text-center rounded-lg border transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <Music className={`w-12 h-12 mx-auto mb-3 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <p className={`text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  No playlists found
                </p>
              </div>
            )}
          </div>

          {/* Selected Playlist Info */}
          {selectedPlaylistId && (
            <div className={`p-4 rounded-xl border transition-colors duration-300 ${
              isDarkMode ? 'bg-blue-900/20 border-blue-700/30' : 'bg-blue-50 border-blue-200'
            }`}>
              <h4 className={`font-semibold mb-2 transition-colors duration-300 ${
                isDarkMode ? 'text-blue-300' : 'text-blue-800'
              }`}>
                Selected Playlist
              </h4>
              <div className="flex items-center justify-between">
                <p className={`text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-blue-200' : 'text-blue-700'
                }`}>
                  {playlists.find(p => p.id === selectedPlaylistId)?.name || 'Unknown Playlist'}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`https://open.spotify.com/playlist/${selectedPlaylistId}`);
                      setCopySuccess(true);
                      setTimeout(() => setCopySuccess(false), 2000);
                    }}
                    className={`p-1.5 rounded transition-colors duration-300 ${
                      isDarkMode
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                    title="Copy link"
                  >
                    {copySuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <a
                    href={`https://open.spotify.com/playlist/${selectedPlaylistId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-1.5 rounded transition-colors duration-300 ${
                      isDarkMode
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                    title="Open in Spotify"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <Music className={`w-16 h-16 mx-auto mb-4 transition-colors duration-300 ${
            isDarkMode ? 'text-green-500' : 'text-green-600'
          }`} />
          <h4 className={`text-xl font-semibold mb-3 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Connect to Spotify
          </h4>
          <p className={`text-sm mb-6 max-w-md mx-auto transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Connect your Spotify account to enable music requests for all users. Your connection will remain active until you manually disconnect.
          </p>
          <button
            onClick={handleLogin}
            className={`px-6 py-3 rounded-lg transition-colors duration-300 ${
              isDarkMode
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            Connect Spotify
          </button>
        </div>
      )}
    </div>
  );
};