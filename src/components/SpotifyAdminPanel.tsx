import React, { useState, useEffect } from 'react';
import { Music, LogOut, RefreshCw, Check, AlertCircle, Search, ExternalLink, Plus, Play } from 'lucide-react';
import { 
  isSpotifyAuthenticated, 
  initiateSpotifySetup, 
  clearStoredTokens, 
  getUserPlaylists, 
  getCurrentSpotifyUser,
  setSelectedPlaylist,
  getSelectedPlaylist,
  SpotifyPlaylist
} from '../services/spotifyAuthService';

interface SpotifyAdminPanelProps {
  isDarkMode: boolean;
  onClose: () => void;
}

export const SpotifyAdminPanel: React.FC<SpotifyAdminPanelProps> = ({ isDarkMode, onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPlaylists, setFilteredPlaylists] = useState<SpotifyPlaylist[]>([]);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Filter playlists when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPlaylists(playlists);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = playlists.filter(playlist => 
      playlist.name.toLowerCase().includes(query) || 
      playlist.owner.display_name.toLowerCase().includes(query)
    );
    
    setFilteredPlaylists(filtered);
  }, [searchQuery, playlists]);

  const checkAuthStatus = async () => {
    const isAuth = isSpotifyAuthenticated();
    setIsAuthenticated(isAuth);
    
    if (isAuth) {
      const user = getCurrentSpotifyUser();
      setUserInfo(user);
      
      // Load playlists
      loadPlaylists();
      
      // Check for selected playlist
      const selectedPlaylist = getSelectedPlaylist();
      if (selectedPlaylist) {
        setSelectedPlaylistId(selectedPlaylist.id);
      }
    }
  };

  const handleLogin = () => {
    initiateSpotifySetup();
  };

  const handleLogout = () => {
    if (window.confirm('Spotify-Verbindung wirklich trennen? Alle Benutzer verlieren dadurch den Zugriff auf die automatische Playlist-Synchronisierung.')) {
      clearStoredTokens();
      setIsAuthenticated(false);
      setUserInfo(null);
      setPlaylists([]);
      setSelectedPlaylistId(null);
    }
  };

  const loadPlaylists = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const userPlaylists = await getUserPlaylists();
      setPlaylists(userPlaylists);
      setFilteredPlaylists(userPlaylists);
      
    } catch (error) {
      console.error('Error loading playlists:', error);
      setError('Fehler beim Laden der Playlists: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlaylist = (playlist: SpotifyPlaylist) => {
    setSelectedPlaylistId(playlist.id);
    setSelectedPlaylist({ id: playlist.id, name: playlist.name });
    
    // Show confirmation
    alert(`✅ Playlist "${playlist.name}" wurde erfolgreich ausgewählt!\n\nAlle Musikwünsche werden nun automatisch zu dieser Playlist hinzugefügt und beim Löschen auch daraus entfernt.`);
  };

  const openPlaylist = (playlistId: string) => {
    window.open(`https://open.spotify.com/playlist/${playlistId}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-300 ${
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
                Spotify Admin Panel
              </h3>
              <p className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Verbinde dein Spotify-Konto für automatische Playlist-Synchronisierung
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors duration-300 ${
              isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!isAuthenticated ? (
            // Not Authenticated View
            <div className="text-center py-8">
              <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center transition-colors duration-300 ${
                isDarkMode ? 'bg-green-600' : 'bg-green-500'
              }`}>
                <Music className="w-10 h-10 text-white" />
              </div>
              
              <h4 className={`text-xl font-semibold mb-4 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Spotify-Konto verbinden
              </h4>
              
              <p className={`text-base mb-6 max-w-md mx-auto transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Verbinde dein Spotify-Konto, um automatisch Musikwünsche in eine Playlist zu synchronisieren. 
                Die Verbindung bleibt bestehen, bis du sie manuell trennst.
              </p>
              
              {error && (
                <div className={`mb-6 p-4 rounded-xl border transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-red-900/20 border-red-700/30 text-red-300' 
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                  </div>
                </div>
              )}
              
              <button
                onClick={handleLogin}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-green-600 hover:bg-green-700 text-white hover:scale-105' 
                    : 'bg-green-500 hover:bg-green-600 text-white hover:scale-105'
                }`}
              >
                Mit Spotify verbinden
              </button>
            </div>
          ) : (
            // Authenticated View
            <>
              {/* User Info */}
              <div className={`p-4 rounded-xl border transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-300">
                      {userInfo?.images?.[0] ? (
                        <img 
                          src={userInfo.images[0].url} 
                          alt={userInfo.display_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-green-500 text-white">
                          <span className="text-xl font-bold">{userInfo?.display_name?.[0] || 'S'}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className={`font-semibold transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {userInfo?.display_name || 'Spotify User'}
                      </h4>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className={`text-sm transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Verbunden
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className={`px-4 py-2 rounded-lg transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                    title="Verbindung trennen"
                  >
                    <div className="flex items-center gap-2">
                      <LogOut className="w-4 h-4" />
                      <span>Trennen</span>
                    </div>
                  </button>
                </div>
              </div>
              
              {/* Selected Playlist */}
              {selectedPlaylistId && (
                <div className={`p-4 rounded-xl border transition-colors duration-300 ${
                  isDarkMode ? 'bg-green-900/20 border-green-700/30' : 'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Check className={`w-5 h-5 transition-colors duration-300 ${
                        isDarkMode ? 'text-green-400' : 'text-green-600'
                      }`} />
                      <div>
                        <h5 className={`font-semibold transition-colors duration-300 ${
                          isDarkMode ? 'text-green-300' : 'text-green-800'
                        }`}>
                          Aktive Playlist
                        </h5>
                        <p className={`text-sm transition-colors duration-300 ${
                          isDarkMode ? 'text-green-200' : 'text-green-700'
                        }`}>
                          {playlists.find(p => p.id === selectedPlaylistId)?.name || 'Ausgewählte Playlist'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openPlaylist(selectedPlaylistId)}
                        className={`p-2 rounded-lg transition-colors duration-300 ${
                          isDarkMode 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                        title="In Spotify öffnen"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => setSelectedPlaylistId(null)}
                        className={`p-2 rounded-lg transition-colors duration-300 ${
                          isDarkMode 
                            ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                            : 'bg-gray-500 hover:bg-gray-600 text-white'
                        }`}
                        title="Auswahl aufheben"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={loadPlaylists}
                      disabled={isLoading}
                      className={`p-2 rounded-lg transition-colors duration-300 ${
                        isLoading
                          ? 'cursor-not-allowed opacity-50'
                          : isDarkMode 
                            ? 'hover:bg-gray-700 text-gray-400' 
                            : 'hover:bg-gray-100 text-gray-600'
                      }`}
                      title="Aktualisieren"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>
                
                {/* Search */}
                <div className="relative mb-4">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Playlists durchsuchen..."
                    className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-8 h-8 animate-spin text-green-500" />
                  </div>
                ) : filteredPlaylists.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {filteredPlaylists.map((playlist) => (
                      <div
                        key={playlist.id}
                        className={`p-3 rounded-lg border transition-all duration-300 ${
                          selectedPlaylistId === playlist.id
                            ? isDarkMode
                              ? 'bg-green-900/20 border-green-700/50 ring-2 ring-green-500'
                              : 'bg-green-50 border-green-200 ring-2 ring-green-500'
                            : isDarkMode
                              ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded overflow-hidden bg-gray-300 flex-shrink-0">
                            {playlist.images?.[0] ? (
                              <img 
                                src={playlist.images[0].url} 
                                alt={playlist.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Music className="w-6 h-6 text-gray-500" />
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
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSelectPlaylist(playlist)}
                              className={`p-2 rounded-lg transition-colors duration-300 ${
                                selectedPlaylistId === playlist.id
                                  ? isDarkMode 
                                    ? 'bg-green-600 text-white' 
                                    : 'bg-green-500 text-white'
                                  : isDarkMode 
                                    ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                                    : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                              }`}
                              title={selectedPlaylistId === playlist.id ? 'Ausgewählte Playlist' : 'Als aktive Playlist auswählen'}
                            >
                              {selectedPlaylistId === playlist.id ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Plus className="w-4 h-4" />
                              )}
                            </button>
                            
                            <button
                              onClick={() => openPlaylist(playlist.id)}
                              className={`p-2 rounded-lg transition-colors duration-300 ${
                                isDarkMode 
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                              }`}
                              title="In Spotify öffnen"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`text-center py-8 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <Music className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    {searchQuery ? (
                      <p>Keine Playlists gefunden für "{searchQuery}"</p>
                    ) : (
                      <p>Keine Playlists gefunden</p>
                    )}
                  </div>
                )}
              </div>
              
              {/* Instructions */}
              <div className={`p-4 rounded-xl border transition-colors duration-300 ${
                isDarkMode ? 'bg-blue-900/20 border-blue-700/30' : 'bg-blue-50 border-blue-200'
              }`}>
                <h5 className={`font-semibold mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-800'
                }`}>
                  ℹ️ So funktioniert's:
                </h5>
                <ol className={`text-sm space-y-1 list-decimal list-inside transition-colors duration-300 ${
                  isDarkMode ? 'text-blue-200' : 'text-blue-700'
                }`}>
                  <li>Wähle eine Playlist aus deinem Spotify-Konto aus</li>
                  <li>Alle Musikwünsche werden automatisch zu dieser Playlist hinzugefügt</li>
                  <li>Gelöschte Musikwünsche werden auch aus der Playlist entfernt</li>
                  <li>Die Verbindung bleibt bestehen, bis du sie manuell trennst</li>
                  <li>Alle Benutzer können Musikwünsche hinzufügen, ohne sich bei Spotify anzumelden</li>
                </ol>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t text-center transition-colors duration-300 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={onClose}
            className={`py-2 px-6 rounded-xl transition-colors duration-300 ${
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