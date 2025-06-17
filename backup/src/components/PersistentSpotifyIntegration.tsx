import React, { useState, useEffect } from 'react';
import { Music, ExternalLink, Plus, CheckCircle, AlertCircle, Loader, LogOut, User, Shield } from 'lucide-react';
import { 
  spotifyAuth, 
  SpotifyAuthState, 
  SpotifyAuthError, 
  SpotifyAPIError, 
  SpotifyRateLimitError,
  SpotifyPlaylist
} from '../services/spotifyAuthService';

interface PersistentSpotifyIntegrationProps {
  isDarkMode: boolean;
  onPlaylistSelected?: (playlistId: string) => void;
  selectedPlaylistId?: string;
}

export const PersistentSpotifyIntegration: React.FC<PersistentSpotifyIntegrationProps> = ({
  isDarkMode,
  onPlaylistSelected,
  selectedPlaylistId
}) => {
  const [authState, setAuthState] = useState<SpotifyAuthState>({
    isAuthenticated: false,
    user: null,
    expiresAt: null,
    lastRefresh: null
  });
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = spotifyAuth.onAuthStateChange(setAuthState);
    return unsubscribe;
  }, []);

  // Load playlists when authenticated
  useEffect(() => {
    if (authState.isAuthenticated) {
      loadUserPlaylists();
    } else {
      setPlaylists([]);
    }
  }, [authState.isAuthenticated]);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await spotifyAuth.initiateAuth();
    } catch (error) {
      console.error('❌ Login failed:', error);
      setError(error instanceof Error ? error.message : 'Login fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await spotifyAuth.logout();
      setPlaylists([]);
      setError(null);
    } catch (error) {
      console.error('❌ Logout failed:', error);
    }
  };

  const loadUserPlaylists = async () => {
    try {
      setIsLoadingPlaylists(true);
      setError(null);
      const userPlaylists = await spotifyAuth.getUserPlaylists();
      setPlaylists(userPlaylists);
    } catch (error) {
      console.error('❌ Failed to load playlists:', error);
      
      if (error instanceof SpotifyRateLimitError) {
        setError(`Rate limit erreicht. Versuche es in ${error.retryAfter} Sekunden erneut.`);
      } else if (error instanceof SpotifyAuthError) {
        setError('Authentifizierung fehlgeschlagen. Bitte melde dich erneut an.');
      } else if (error instanceof SpotifyAPIError) {
        setError(`Spotify API Fehler: ${error.message}`);
      } else {
        setError('Fehler beim Laden der Playlists. Prüfe deine Internetverbindung.');
      }
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  const addSampleTrack = async (playlistId: string) => {
    try {
      setError(null);
      // Example: Add a sample track to test the integration
      await spotifyAuth.addTracksToPlaylist(playlistId, ['spotify:track:4VqPOruhp5EdPBeR92t6lQ']); // Nothing Else Matters
      alert('✅ Sample track added successfully!');
    } catch (error) {
      console.error('❌ Failed to add track:', error);
      
      if (error instanceof SpotifyRateLimitError) {
        setError(`Rate limit erreicht. Versuche es in ${error.retryAfter} Sekunden erneut.`);
      } else if (error instanceof SpotifyAuthError) {
        setError('Authentifizierung fehlgeschlagen. Bitte melde dich erneut an.');
      } else {
        setError(error instanceof Error ? error.message : 'Fehler beim Hinzufügen des Tracks');
      }
    }
  };

  const formatTimeRemaining = (expiresAt: number): string => {
    const now = Date.now();
    const remaining = expiresAt - now;
    
    if (remaining <= 0) return 'Abgelaufen';
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  if (!authState.isAuthenticated) {
    return (
      <div className={`p-6 rounded-xl border transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
      }`}>
        <div className="text-center">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-colors duration-300 ${
            isDarkMode ? 'bg-green-600' : 'bg-green-500'
          }`}>
            <Music className="w-8 h-8 text-white" />
          </div>
          
          <h3 className={`text-xl font-semibold mb-2 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Spotify Integration
          </h3>
          
          <p className={`text-sm mb-6 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Verbinde dein Spotify-Konto für nahtlose Playlist-Verwaltung
          </p>

          {/* Security Features */}
          <div className={`mb-6 p-4 rounded-lg transition-colors duration-300 ${
            isDarkMode ? 'bg-blue-900/20 border border-blue-700/30' : 'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className={`w-4 h-4 transition-colors duration-300 ${
                isDarkMode ? 'text-blue-400' : 'text-blue-600'
              }`} />
              <span className={`font-semibold text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-blue-300' : 'text-blue-800'
              }`}>
                Sichere Authentifizierung
              </span>
            </div>
            <ul className={`text-xs space-y-1 transition-colors duration-300 ${
              isDarkMode ? 'text-blue-200' : 'text-blue-700'
            }`}>
              <li>✅ PKCE OAuth 2.0 Flow</li>
              <li>✅ Automatische Token-Erneuerung</li>
              <li>✅ Sichere lokale Speicherung</li>
              <li>✅ Session-übergreifende Persistenz</li>
            </ul>
          </div>

          {error && (
            <div className={`mb-4 p-3 rounded-lg border transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-red-900/20 border-red-700/30 text-red-300' 
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
              isLoading
                ? 'cursor-not-allowed opacity-50'
                : 'hover:scale-105'
            } ${
              isDarkMode 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isLoading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Verbinde mit Spotify...
              </>
            ) : (
              <>
                <Music className="w-5 h-5" />
                Mit Spotify verbinden
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-xl border transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
    }`}>
      {/* User Info Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-green-500">
            {authState.user?.images?.[0] ? (
              <img 
                src={authState.user.images[0].url} 
                alt={authState.user.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
          <div>
            <h4 className={`font-semibold transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {authState.user?.display_name || 'Spotify User'}
            </h4>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span className={`text-xs transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Verbunden
                {authState.expiresAt && (
                  <span className="ml-1">
                    • {formatTimeRemaining(authState.expiresAt)} verbleibend
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className={`p-2 rounded-lg transition-colors ${
            isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
          }`}
          title="Verbindung trennen"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className={`mb-4 p-3 rounded-lg border transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-red-900/20 border-red-700/30 text-red-300' 
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Playlists Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h5 className={`font-semibold transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Deine Playlists
          </h5>
          <button
            onClick={loadUserPlaylists}
            disabled={isLoadingPlaylists}
            className={`text-sm px-3 py-1 rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            {isLoadingPlaylists ? 'Lädt...' : 'Aktualisieren'}
          </button>
        </div>

        {isLoadingPlaylists ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-6 h-6 animate-spin text-green-500" />
          </div>
        ) : playlists.length > 0 ? (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className={`p-3 rounded-lg border transition-all duration-300 ${
                  selectedPlaylistId === playlist.id
                    ? isDarkMode
                      ? 'bg-green-900/20 border-green-700/50'
                      : 'bg-green-50 border-green-200'
                    : isDarkMode
                      ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded overflow-hidden bg-gray-300">
                    {playlist.images?.[0] ? (
                      <img 
                        src={playlist.images[0].url} 
                        alt={playlist.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-4 h-4 text-gray-500" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h6 className={`font-medium truncate transition-colors duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {playlist.name}
                    </h6>
                    <p className={`text-xs truncate transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {playlist.tracks.total} Songs • {playlist.owner.display_name}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onPlaylistSelected?.(playlist.id)}
                      className={`p-1.5 rounded transition-colors ${
                        selectedPlaylistId === playlist.id
                          ? 'bg-green-500 text-white'
                          : isDarkMode
                            ? 'hover:bg-gray-600 text-gray-400'
                            : 'hover:bg-gray-200 text-gray-600'
                      }`}
                      title="Playlist auswählen"
                    >
                      <CheckCircle className="w-3 h-3" />
                    </button>
                    
                    <button
                      onClick={() => addSampleTrack(playlist.id)}
                      className={`p-1.5 rounded transition-colors ${
                        isDarkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
                      }`}
                      title="Test-Track hinzufügen"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    
                    <a
                      href={`https://open.spotify.com/playlist/${playlist.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-1.5 rounded transition-colors ${
                        isDarkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
                      }`}
                      title="In Spotify öffnen"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`text-center py-8 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Keine Playlists gefunden</p>
          </div>
        )}
      </div>
    </div>
  );
};