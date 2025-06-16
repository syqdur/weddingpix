import React, { useState, useEffect } from 'react';
import { X, Music, User, LogOut, LogIn, RefreshCw, Check, AlertCircle, Lock, Unlock, List, Settings, ExternalLink, Trash2, Plus, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import { 
  isSpotifyAuthenticated,
  getCurrentSpotifyUser,
  initiateAdminSpotifySetup,
  logoutSpotify,
  getUserPlaylists,
  getSelectedPlaylist,
  setSelectedPlaylist,
  isPlaylistLocked,
  getActivePlaylistId,
  initializeSpotifyAuth
} from '../services/spotifyPlaylistService';

interface SpotifyAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  isAdmin?: boolean; // 🔒 NEW: Admin check
}

export const SpotifyAdminModal: React.FC<SpotifyAdminModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  isAdmin = false // 🔒 Default: not admin
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [userPlaylists, setUserPlaylists] = useState<any[]>([]);
  const [selectedPlaylist, setSelectedPlaylistState] = useState<any | null>(null);
  const [playlistLocked, setPlaylistLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // 🔒 ADMIN-ONLY: Initialize on modal open only for admins
  useEffect(() => {
    if (isOpen) {
      if (isAdmin) {
        console.log('🔒 Admin detected - initializing Spotify admin connection...');
        initializeConnection();
      } else {
        console.log('🚫 Non-admin user - Spotify admin features disabled');
        setIsInitializing(false);
        setStatusMessage('🔒 Nur Admins haben Zugriff auf Spotify-Einstellungen');
      }
    }
  }, [isOpen, isAdmin]);

  const initializeConnection = async () => {
    setIsInitializing(true);
    
    try {
      console.log('🔄 Initializing Spotify admin connection...');
      
      // Check for persistent playlist selection
      const savedPlaylist = getSelectedPlaylist();
      if (savedPlaylist) {
        setSelectedPlaylistState(savedPlaylist);
        setPlaylistLocked(savedPlaylist.isLocked);
        console.log(`🔒 Found persistent playlist: "${savedPlaylist.name}"`);
      }
      
      // Initialize auth (handles callback if present)
      const authResult = await initializeSpotifyAuth();
      
      if (authResult) {
        const user = getCurrentSpotifyUser();
        setIsConnected(true);
        setCurrentUser(user);
        console.log(`✅ Spotify connected as: ${user?.display_name}`);
        
        // Load user playlists
        await loadUserPlaylists();
      } else {
        setIsConnected(false);
        setCurrentUser(null);
        console.log('❌ Spotify not connected');
      }
      
    } catch (error) {
      console.error('❌ Error initializing Spotify:', error);
      setIsConnected(false);
      setCurrentUser(null);
      setStatusMessage('❌ Fehler beim Initialisieren der Spotify-Verbindung');
    } finally {
      setIsInitializing(false);
    }
  };

  const loadUserPlaylists = async () => {
    if (!isConnected || !isAdmin) return;
    
    setIsLoadingPlaylists(true);
    try {
      console.log('🎵 Loading user playlists...');
      const playlists = await getUserPlaylists();
      setUserPlaylists(playlists);
      console.log(`✅ Loaded ${playlists.length} user playlists`);
      setStatusMessage(`✅ ${playlists.length} Playlists geladen`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      console.error('❌ Error loading user playlists:', error);
      setUserPlaylists([]);
      setStatusMessage('❌ Fehler beim Laden der Playlists');
      setTimeout(() => setStatusMessage(null), 5000);
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  // 🔒 ADMIN-ONLY: Connection functions
  const handleConnect = () => {
    if (!isAdmin) {
      setStatusMessage('🔒 Nur Admins können sich mit Spotify verbinden');
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }
    
    console.log('🔐 Starting Spotify connection (Admin only)...');
    setStatusMessage('🔄 Weiterleitung zu Spotify...');
    initiateAdminSpotifySetup();
  };

  const handleDisconnect = () => {
    if (!isAdmin) {
      setStatusMessage('🔒 Nur Admins können die Spotify-Verbindung trennen');
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }
    
    if (window.confirm('🚪 Spotify-Verbindung wirklich trennen?\n\n⚠️ Die ausgewählte Playlist bleibt gespeichert.')) {
      logoutSpotify();
      setIsConnected(false);
      setCurrentUser(null);
      setUserPlaylists([]);
      setStatusMessage('🚪 Spotify-Verbindung getrennt');
      setTimeout(() => setStatusMessage(null), 3000);
      console.log('🚪 Spotify disconnected (playlist selection preserved)');
    }
  };

  // 🔒 ADMIN-ONLY: Playlist selection
  const handlePlaylistSelection = (playlist: any) => {
    if (!isAdmin) {
      setStatusMessage('🔒 Nur Admins können Playlists auswählen');
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }
    
    if (playlistLocked) {
      setStatusMessage('🔒 Playlist bereits ausgewählt und gesperrt');
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    const confirmMessage = `🎯 "${playlist.name}" als Hochzeits-Playlist auswählen?\n\n⚠️ Diese Auswahl kann nicht mehr geändert werden!\n\nAlle zukünftigen Songs werden automatisch zu dieser Playlist hinzugefügt.`;
    
    if (window.confirm(confirmMessage)) {
      setSelectedPlaylist(playlist);
      setSelectedPlaylistState(playlist);
      setPlaylistLocked(true);
      setShowPlaylistSelector(false);
      
      setStatusMessage(`🔒 "${playlist.name}" wurde als Hochzeits-Playlist festgelegt!`);
      setTimeout(() => setStatusMessage(null), 5000);
      
      console.log(`🔒 Playlist permanently selected: ${playlist.name}`);
    }
  };

  // 🔒 ADMIN-ONLY: Unlock playlist
  const handleUnlockPlaylist = () => {
    if (!isAdmin) {
      setStatusMessage('🔒 Nur Admins können die Playlist-Sperre aufheben');
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }
    
    const confirmMessage = `⚠️ WARNUNG: Playlist-Sperre aufheben?\n\n🔓 Dies ermöglicht es, eine andere Playlist auszuwählen.\n\n❌ Dies sollte nur in Notfällen gemacht werden!\n\nFortfahren?`;
    
    if (window.confirm(confirmMessage)) {
      // Clear the persistent playlist selection
      localStorage.removeItem('selected_wedding_playlist');
      setSelectedPlaylistState(null);
      setPlaylistLocked(false);
      
      setStatusMessage('🔓 Playlist-Sperre aufgehoben - neue Auswahl möglich');
      setTimeout(() => setStatusMessage(null), 5000);
      
      console.log('🔓 Playlist lock removed - new selection possible');
    }
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
              isAdmin
                ? isDarkMode ? 'bg-green-600' : 'bg-green-500'
                : isDarkMode ? 'bg-gray-600' : 'bg-gray-400'
            }`}>
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className={`text-xl font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                🎵 Spotify Einstellungen
              </h3>
              <p className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {isAdmin ? 'Admin: Account verwalten und Playlist auswählen' : 'Nur für Admins verfügbar'}
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
          {isInitializing ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 mx-auto border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className={`text-lg font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Spotify-Verbindung prüfen...
              </p>
            </div>
          ) : !isAdmin ? (
            // 🔒 NON-ADMIN: Access denied message
            <div className={`p-6 rounded-xl transition-colors duration-300 ${
              isDarkMode ? 'bg-red-900/20 border border-red-700/30' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                <Shield className={`w-8 h-8 transition-colors duration-300 ${
                  isDarkMode ? 'text-red-400' : 'text-red-600'
                }`} />
                <div>
                  <h4 className={`text-lg font-semibold transition-colors duration-300 ${
                    isDarkMode ? 'text-red-300' : 'text-red-800'
                  }`}>
                    🔒 Zugriff verweigert
                  </h4>
                  <p className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-red-200' : 'text-red-700'
                  }`}>
                    Spotify-Einstellungen sind nur für Admins verfügbar
                  </p>
                </div>
              </div>
              
              <div className={`p-4 rounded-lg transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-800/50' : 'bg-white/50'
              }`}>
                <p className={`text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Die Spotify-Integration ermöglicht es, dass Songs automatisch zur Hochzeits-Playlist hinzugefügt werden. Nur Admins können diese Funktion einrichten und verwalten.
                </p>
                <p className={`text-sm mt-3 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Als normaler Benutzer kannst du trotzdem Songs hinzufügen, die automatisch in der Playlist erscheinen, wenn ein Admin die Integration eingerichtet hat.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Status Message */}
              {statusMessage && (
                <div className={`mb-6 p-4 rounded-xl border transition-colors duration-300 ${
                  statusMessage.includes('✅') || statusMessage.includes('🔒') || statusMessage.includes('🚪')
                    ? isDarkMode ? 'bg-green-900/20 border-green-700/30 text-green-300' : 'bg-green-50 border-green-200 text-green-700'
                    : statusMessage.includes('❌') || statusMessage.includes('⚠️')
                      ? isDarkMode ? 'bg-red-900/20 border-red-700/30 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
                      : isDarkMode ? 'bg-blue-900/20 border-blue-700/30 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700'
                }`}>
                  <div className="flex items-center gap-2">
                    {statusMessage.includes('✅') ? <Check className="w-5 h-5" /> :
                     statusMessage.includes('❌') ? <AlertCircle className="w-5 h-5" /> :
                     <Music className="w-5 h-5" />}
                    <div className="font-semibold">{statusMessage}</div>
                  </div>
                </div>
              )}

              {/* Connection Status */}
              <div className={`p-6 rounded-xl mb-6 transition-colors duration-300 ${
                isConnected
                  ? isDarkMode ? 'bg-green-900/20 border border-green-700/30' : 'bg-green-50 border border-green-200'
                  : isDarkMode ? 'bg-gray-700/50 border border-gray-600' : 'bg-gray-50 border border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-full transition-colors duration-300 ${
                      isConnected
                        ? isDarkMode ? 'bg-green-600' : 'bg-green-500'
                        : isDarkMode ? 'bg-gray-600' : 'bg-gray-400'
                    }`}>
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className={`font-semibold mb-1 transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Spotify Account
                      </h4>
                      {isConnected && currentUser ? (
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium transition-colors duration-300 ${
                            isDarkMode ? 'text-green-300' : 'text-green-700'
                          }`}>
                            Verbunden als: {currentUser.display_name}
                          </span>
                          {currentUser.email && (
                            <span className={`text-xs transition-colors duration-300 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              ({currentUser.email})
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className={`text-sm transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Nicht verbunden
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <>
                        <button
                          onClick={loadUserPlaylists}
                          disabled={isLoadingPlaylists}
                          className={`p-2 rounded-lg transition-colors ${
                            isLoadingPlaylists
                              ? 'bg-gray-400 cursor-not-allowed'
                              : isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
                          } text-white`}
                          title="Playlists neu laden"
                        >
                          <RefreshCw className={`w-4 h-4 ${isLoadingPlaylists ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                          onClick={handleDisconnect}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                            isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'
                          } text-white text-sm`}
                        >
                          <LogOut className="w-4 h-4" />
                          Trennen
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleConnect}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
                          isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
                        } text-white font-semibold`}
                      >
                        <LogIn className="w-5 h-5" />
                        Mit Spotify verbinden
                      </button>
                    )}
                  </div>
                </div>

                {/* Account Info */}
                {isConnected && currentUser && (
                  <div className={`p-4 rounded-xl transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-800/50' : 'bg-white/50'
                  }`}>
                    <div className="flex items-center gap-4">
                      {currentUser.images?.[0] && (
                        <img 
                          src={currentUser.images[0].url} 
                          alt={currentUser.display_name}
                          className="w-12 h-12 rounded-full"
                        />
                      )}
                      <div>
                        <div className={`font-semibold transition-colors duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {currentUser.display_name}
                        </div>
                        <div className={`text-sm transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Spotify User ID: {currentUser.id}
                        </div>
                        {currentUser.email && (
                          <div className={`text-sm transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {currentUser.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Playlist Selection */}
              {isConnected && (
                <div className={`p-6 rounded-xl mb-6 transition-colors duration-300 ${
                  playlistLocked && selectedPlaylist
                    ? isDarkMode ? 'bg-green-900/20 border border-green-700/30' : 'bg-green-50 border border-green-200'
                    : isDarkMode ? 'bg-purple-900/20 border border-purple-700/30' : 'bg-purple-50 border border-purple-200'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-full transition-colors duration-300 ${
                        playlistLocked && selectedPlaylist
                          ? isDarkMode ? 'bg-green-600' : 'bg-green-500'
                          : isDarkMode ? 'bg-purple-600' : 'bg-purple-500'
                      }`}>
                        {playlistLocked ? <Lock className="w-6 h-6 text-white" /> : <List className="w-6 h-6 text-white" />}
                      </div>
                      <div>
                        <h4 className={`font-semibold transition-colors duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          Hochzeits-Playlist
                        </h4>
                        <p className={`text-sm transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {playlistLocked && selectedPlaylist 
                            ? `Ausgewählt: "${selectedPlaylist.name}"`
                            : 'Playlist für automatische Song-Hinzufügung auswählen'
                          }
                        </p>
                      </div>
                    </div>

                    {playlistLocked && selectedPlaylist && (
                      <button
                        onClick={handleUnlockPlaylist}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                          isDarkMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-orange-500 hover:bg-orange-600'
                        } text-white text-sm`}
                        title="⚠️ Playlist-Sperre aufheben (Notfall)"
                      >
                        <Unlock className="w-4 h-4" />
                        Entsperren
                      </button>
                    )}
                  </div>

                  {playlistLocked && selectedPlaylist ? (
                    /* Locked Playlist Display */
                    <div className={`p-4 rounded-xl transition-colors duration-300 ${
                      isDarkMode ? 'bg-gray-800/50' : 'bg-white/50'
                    }`}>
                      <div className="flex items-center gap-4">
                        {selectedPlaylist.images?.[0] ? (
                          <img 
                            src={selectedPlaylist.images[0].url} 
                            alt={selectedPlaylist.name}
                            className="w-16 h-16 rounded object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded bg-gray-300 flex items-center justify-center">
                            <Music className="w-8 h-8 text-gray-600" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className={`font-semibold text-lg transition-colors duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {selectedPlaylist.name}
                          </div>
                          <div className={`text-sm transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {selectedPlaylist.tracks.total} Songs • Ausgewählt am {new Date(selectedPlaylist.selectedAt).toLocaleDateString('de-DE')}
                          </div>
                          <div className={`text-xs mt-1 transition-colors duration-300 ${
                            isDarkMode ? 'text-green-400' : 'text-green-600'
                          }`}>
                            🔒 Alle neuen Songs werden automatisch zu dieser Playlist hinzugefügt
                          </div>
                        </div>
                        <a
                          href={`https://open.spotify.com/playlist/${selectedPlaylist.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`p-2 rounded-lg transition-colors ${
                            isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
                          } text-white`}
                          title="Playlist in Spotify öffnen"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ) : userPlaylists.length > 0 ? (
                    /* Playlist Selection */
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className={`text-sm transition-colors duration-300 ${
                            isDarkMode ? 'text-purple-200' : 'text-purple-700'
                          }`}>
                            ⚠️ Einmalige Auswahl - kann nicht mehr geändert werden!
                          </p>
                        </div>
                        
                        <button
                          onClick={() => setShowPlaylistSelector(!showPlaylistSelector)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                            isDarkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'
                          } text-white`}
                        >
                          <List className="w-4 h-4" />
                          Playlist wählen
                          {showPlaylistSelector ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Playlist Dropdown */}
                      {showPlaylistSelector && (
                        <div className={`p-4 rounded-xl transition-colors duration-300 ${
                          isDarkMode ? 'bg-gray-800/50 border border-gray-600' : 'bg-white/50 border border-gray-200'
                        }`}>
                          <div className="max-h-60 overflow-y-auto space-y-3">
                            {userPlaylists.map((playlist) => (
                              <button
                                key={playlist.id}
                                onClick={() => handlePlaylistSelection(playlist)}
                                className={`w-full text-left p-4 rounded-lg transition-all duration-300 hover:scale-[1.02] ${
                                  isDarkMode ? 'hover:bg-gray-700 bg-gray-800/50' : 'hover:bg-gray-50 bg-white'
                                }`}
                              >
                                <div className="flex items-center gap-4">
                                  {playlist.images?.[0] ? (
                                    <img 
                                      src={playlist.images[0].url} 
                                      alt={playlist.name}
                                      className="w-12 h-12 rounded object-cover"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded bg-gray-300 flex items-center justify-center">
                                      <Music className="w-6 h-6 text-gray-600" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className={`font-medium truncate transition-colors duration-300 ${
                                      isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                      {playlist.name}
                                    </div>
                                    <div className={`text-sm transition-colors duration-300 ${
                                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                      {playlist.tracks.total} Songs
                                    </div>
                                    {playlist.description && (
                                      <div className={`text-xs mt-1 truncate transition-colors duration-300 ${
                                        isDarkMode ? 'text-gray-500' : 'text-gray-500'
                                      }`}>
                                        {playlist.description}
                                      </div>
                                    )}
                                  </div>
                                  <div className={`px-3 py-1 rounded-full text-xs transition-colors duration-300 ${
                                    isDarkMode ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-800'
                                  }`}>
                                    Auswählen
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Music className={`w-12 h-12 mx-auto mb-4 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-600' : 'text-gray-400'
                      }`} />
                      <p className={`transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {isLoadingPlaylists 
                          ? 'Lade Playlists...'
                          : 'Keine Playlists gefunden. Erstelle zuerst eine Playlist in Spotify.'
                        }
                      </p>
                      {!isLoadingPlaylists && (
                        <button
                          onClick={loadUserPlaylists}
                          className={`mt-4 px-4 py-2 rounded-lg transition-colors ${
                            isDarkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'
                          } text-white text-sm`}
                        >
                          <RefreshCw className="w-4 h-4 inline mr-2" />
                          Erneut laden
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Info Section */}
              <div className={`p-4 rounded-xl transition-colors duration-300 ${
                isDarkMode ? 'bg-blue-900/20 border border-blue-700/30' : 'bg-blue-50 border border-blue-200'
              }`}>
                <h4 className={`font-semibold mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-800'
                }`}>
                  ℹ️ Wichtige Informationen:
                </h4>
                <ul className={`text-sm space-y-1 transition-colors duration-300 ${
                  isDarkMode ? 'text-blue-200' : 'text-blue-700'
                }`}>
                  <li>• Die Spotify-Verbindung ermöglicht automatisches Hinzufügen von Songs</li>
                  <li>• Die Playlist-Auswahl ist permanent und kann nicht geändert werden</li>
                  <li>• Alle Gäste können Songs hinzufügen, die automatisch zur Playlist hinzugefügt werden</li>
                  <li>• Songs werden auch automatisch entfernt, wenn sie gelöscht werden</li>
                  <li>• Die Verbindung bleibt bestehen, auch wenn du dich abmeldest</li>
                  <li>• 🔒 Nur Admins können sich mit Spotify verbinden und Playlists verwalten</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};