import React, { useState, useEffect } from 'react';
import { X, Music, Download, ExternalLink, Copy, List, FileText, Check, Loader, LogIn, LogOut, Plus, RefreshCw, Heart, Star, Settings, User, ChevronDown, Lock, Shield, Eye, Info } from 'lucide-react';
import { MusicRequest } from '../types';
import { 
  createPlaylistExport,
  downloadPlaylistAsJson,
  downloadPlaylistAsM3U,
  copyTrackListToClipboard,
  PlaylistExport,
  isSpotifyAuthenticated,
  getCurrentSpotifyUser,
  initiateAdminSpotifySetup,
  addToWeddingPlaylist,
  getWeddingPlaylistDetails,
  openWeddingPlaylist,
  getWeddingPlaylistUrl,
  logoutSpotify,
  initializeSpotifyAuth,
  getUserPlaylists,
  addToSelectedPlaylist,
  getSelectedPlaylist,
  setSelectedPlaylist,
  isPlaylistLocked
} from '../services/spotifyPlaylistService';

interface PlaylistExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  approvedRequests: MusicRequest[];
  isDarkMode: boolean;
  isAdmin?: boolean; // 🔒 NEW: Admin check
}

export const PlaylistExportModal: React.FC<PlaylistExportModalProps> = ({
  isOpen,
  onClose,
  approvedRequests,
  isDarkMode,
  isAdmin = false // 🔒 Default: not admin
}) => {
  const [playlistExport, setPlaylistExport] = useState<PlaylistExport | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);
  const [spotifyUser, setSpotifyUser] = useState<any | null>(null);
  const [weddingPlaylist, setWeddingPlaylist] = useState<any | null>(null);
  const [userPlaylists, setUserPlaylists] = useState<any[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('');
  const [addToPlaylistResult, setAddToPlaylistResult] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
  const [showConnectionStatus, setShowConnectionStatus] = useState(false);

  // 🎯 NEW: Persistent playlist state
  const [persistentPlaylist, setPersistentPlaylist] = useState<any | null>(null);
  const [playlistLocked, setPlaylistLocked] = useState(false);

  // 🔒 ADMIN-ONLY: Initialize Spotify auth only for admins
  useEffect(() => {
    if (isOpen) {
      if (isAdmin) {
        console.log('🔒 Admin detected - initializing Spotify connection...');
        initializeSpotifyConnection();
      } else {
        console.log('👤 Regular user - checking Spotify status...');
        checkSpotifyStatus();
        
        // Still create playlist export for download features
        if (approvedRequests.length > 0) {
          const exportData = createPlaylistExport(approvedRequests);
          setPlaylistExport(exportData);
        }
      }
    }
  }, [isOpen, isAdmin]);

  const checkSpotifyStatus = async () => {
    setIsInitializing(true);
    
    try {
      // Check for persistent playlist selection
      const savedPlaylist = getSelectedPlaylist();
      if (savedPlaylist) {
        setPersistentPlaylist(savedPlaylist);
        setSelectedPlaylistId(savedPlaylist.id);
        setPlaylistLocked(savedPlaylist.isLocked);
        console.log(`🔒 Found persistent playlist: "${savedPlaylist.name}"`);
      }
      
      // Check if Spotify is authenticated (without initializing)
      const authenticated = isSpotifyAuthenticated();
      if (authenticated) {
        const user = getCurrentSpotifyUser();
        setIsSpotifyConnected(true);
        setSpotifyUser(user);
        console.log(`✅ Spotify connected as: ${user?.display_name}`);
      } else {
        setIsSpotifyConnected(false);
        setSpotifyUser(null);
        console.log('❌ Spotify not connected');
      }
      
    } catch (error) {
      console.error('❌ Error checking Spotify status:', error);
      setIsSpotifyConnected(false);
      setSpotifyUser(null);
    } finally {
      setIsInitializing(false);
    }
  };

  const initializeSpotifyConnection = async () => {
    setIsInitializing(true);
    
    try {
      console.log('🔄 Initializing Spotify connection (Admin only)...');
      
      // Check for persistent playlist selection
      const savedPlaylist = getSelectedPlaylist();
      if (savedPlaylist) {
        setPersistentPlaylist(savedPlaylist);
        setSelectedPlaylistId(savedPlaylist.id);
        setPlaylistLocked(savedPlaylist.isLocked);
        console.log(`🔒 Found persistent playlist: "${savedPlaylist.name}"`);
      }
      
      // Initialize auth (handles callback if present)
      const authResult = await initializeSpotifyAuth();
      
      if (authResult) {
        const user = getCurrentSpotifyUser();
        setIsSpotifyConnected(true);
        setSpotifyUser(user);
        console.log(`✅ Spotify connected as: ${user?.display_name}`);
        
        // Load wedding playlist details and user playlists
        await Promise.all([
          loadWeddingPlaylist(),
          loadUserPlaylists()
        ]);
      } else {
        setIsSpotifyConnected(false);
        setSpotifyUser(null);
        console.log('❌ Spotify not connected');
      }
      
    } catch (error) {
      console.error('❌ Error initializing Spotify:', error);
      setIsSpotifyConnected(false);
      setSpotifyUser(null);
    } finally {
      setIsInitializing(false);
    }
    
    // Create playlist export
    if (approvedRequests.length > 0) {
      const exportData = createPlaylistExport(approvedRequests);
      setPlaylistExport(exportData);
    }
  };

  const loadWeddingPlaylist = async () => {
    if (!isSpotifyConnected) return;
    
    try {
      setIsLoading(true);
      const playlist = await getWeddingPlaylistDetails();
      setWeddingPlaylist(playlist);
      console.log(`✅ Wedding playlist loaded: ${playlist.name}`);
    } catch (error) {
      console.error('❌ Error loading wedding playlist:', error);
      // Don't show error for wedding playlist - it might not be accessible
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserPlaylists = async () => {
    if (!isSpotifyConnected) return;
    
    try {
      console.log('🎵 Loading user playlists...');
      const playlists = await getUserPlaylists();
      setUserPlaylists(playlists);
      console.log(`✅ Loaded ${playlists.length} user playlists`);
    } catch (error) {
      console.error('❌ Error loading user playlists:', error);
      setUserPlaylists([]);
    }
  };

  // 🔒 ADMIN-ONLY: Spotify connection functions
  const handleSpotifyConnect = () => {
    if (!isAdmin) {
      setAddToPlaylistResult('🔒 Nur Admins können sich mit Spotify verbinden');
      return;
    }
    
    console.log('🔐 Starting Spotify connection (Admin only)...');
    initiateAdminSpotifySetup();
  };

  const handleSpotifyDisconnect = () => {
    if (!isAdmin) {
      setAddToPlaylistResult('🔒 Nur Admins können die Spotify-Verbindung trennen');
      return;
    }
    
    if (window.confirm('Spotify-Verbindung trennen?')) {
      logoutSpotify();
      setIsSpotifyConnected(false);
      setSpotifyUser(null);
      setWeddingPlaylist(null);
      setUserPlaylists([]);
      // 🎯 Don't reset playlist selection - it should persist
      console.log('🚪 Spotify disconnected (playlist selection preserved)');
    }
  };

  // 🔒 ADMIN-ONLY: Playlist selection
  const handlePlaylistSelection = (playlist: any) => {
    if (!isAdmin) {
      setAddToPlaylistResult('🔒 Nur Admins können Playlists auswählen');
      return;
    }
    
    if (playlistLocked) {
      setAddToPlaylistResult('🔒 Playlist bereits ausgewählt und gesperrt');
      return;
    }

    const confirmMessage = `🎯 "${playlist.name}" als Hochzeits-Playlist auswählen?\n\n⚠️ Diese Auswahl kann nicht mehr geändert werden!\n\nAlle zukünftigen Songs werden automatisch zu dieser Playlist hinzugefügt.`;
    
    if (window.confirm(confirmMessage)) {
      setSelectedPlaylist(playlist);
      setPersistentPlaylist(playlist);
      setSelectedPlaylistId(playlist.id);
      setPlaylistLocked(true);
      setShowPlaylistSelector(false);
      
      setAddToPlaylistResult(`🔒 "${playlist.name}" wurde als Hochzeits-Playlist festgelegt!`);
      
      console.log(`🔒 Playlist permanently selected: ${playlist.name}`);
    }
  };

  const handleCopyToClipboard = async () => {
    const success = await copyTrackListToClipboard(approvedRequests);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleOpenSpotify = () => {
    openSpotifyPlaylist(approvedRequests);
  };

  const handleDownloadJson = () => {
    if (playlistExport) {
      downloadPlaylistAsJson(playlistExport);
    }
  };

  const handleDownloadM3U = () => {
    if (playlistExport) {
      downloadPlaylistAsM3U(playlistExport);
    }
  };

  if (!isOpen) return null;

  const spotifyTracks = approvedRequests.filter(request => request.spotifyId);
  const nonSpotifyTracks = approvedRequests.filter(request => !request.spotifyId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden transition-colors duration-300 ${
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
                🎯 Playlist Management
              </h3>
              <p className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {isAdmin ? 'Admin: Verlauf und Spotify-Integration' : 'Verlauf der hinzugefügten Songs'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* 🆕 NEW: Connection Status Button */}
            <button
              onClick={() => setShowConnectionStatus(!showConnectionStatus)}
              className={`p-2 rounded-full transition-colors duration-300 ${
                isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Spotify-Verbindungsstatus anzeigen"
            >
              <Info className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-colors duration-300 ${
                isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* 🆕 NEW: Connection Status Panel */}
          {showConnectionStatus && (
            <div className={`mb-6 p-6 rounded-xl transition-colors duration-300 ${
              isSpotifyConnected
                ? isDarkMode 
                  ? 'bg-green-900/20 border border-green-700/30' 
                  : 'bg-green-50 border border-green-200'
                : isDarkMode 
                  ? 'bg-gray-700/50 border border-gray-600' 
                  : 'bg-gray-50 border border-gray-200'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                <Eye className={`w-6 h-6 transition-colors duration-300 ${
                  isSpotifyConnected
                    ? isDarkMode ? 'text-green-400' : 'text-green-600'
                    : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <h4 className={`text-lg font-semibold transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  🔍 Spotify-Verbindungsstatus
                </h4>
              </div>

              {isSpotifyConnected && spotifyUser ? (
                <div className="space-y-4">
                  {/* Connected User Info */}
                  <div className={`p-4 rounded-lg transition-colors duration-300 ${
                    isDarkMode ? 'bg-green-800/30' : 'bg-green-100'
                  }`}>
                    <div className="flex items-center gap-3 mb-2">
                      <User className="w-5 h-5 text-green-500" />
                      <span className={`font-semibold transition-colors duration-300 ${
                        isDarkMode ? 'text-green-300' : 'text-green-800'
                      }`}>
                        ✅ Verbunden mit Spotify
                      </span>
                    </div>
                    <div className={`text-sm space-y-1 transition-colors duration-300 ${
                      isDarkMode ? 'text-green-200' : 'text-green-700'
                    }`}>
                      <div><strong>Account:</strong> {spotifyUser.display_name}</div>
                      {spotifyUser.email && <div><strong>E-Mail:</strong> {spotifyUser.email}</div>}
                      <div><strong>Spotify ID:</strong> {spotifyUser.id}</div>
                    </div>
                  </div>

                  {/* Selected Playlist Info */}
                  {persistentPlaylist && (
                    <div className={`p-4 rounded-lg transition-colors duration-300 ${
                      isDarkMode ? 'bg-blue-800/30' : 'bg-blue-100'
                    }`}>
                      <div className="flex items-center gap-3 mb-2">
                        <Lock className="w-5 h-5 text-blue-500" />
                        <span className={`font-semibold transition-colors duration-300 ${
                          isDarkMode ? 'text-blue-300' : 'text-blue-800'
                        }`}>
                          🎯 Ausgewählte Hochzeits-Playlist
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {persistentPlaylist.images?.[0] ? (
                          <img 
                            src={persistentPlaylist.images[0].url} 
                            alt={persistentPlaylist.name}
                            className="w-12 h-12 rounded object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-gray-300 flex items-center justify-center">
                            <Music className="w-6 h-6 text-gray-600" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className={`font-semibold transition-colors duration-300 ${
                            isDarkMode ? 'text-blue-200' : 'text-blue-800'
                          }`}>
                            {persistentPlaylist.name}
                          </div>
                          <div className={`text-sm transition-colors duration-300 ${
                            isDarkMode ? 'text-blue-300' : 'text-blue-600'
                          }`}>
                            {persistentPlaylist.tracks.total} Songs • Ausgewählt am {new Date(persistentPlaylist.selectedAt).toLocaleDateString('de-DE')}
                          </div>
                        </div>
                        <a
                          href={`https://open.spotify.com/playlist/${persistentPlaylist.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`p-2 rounded-lg transition-colors duration-300 ${
                            isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
                          } text-white`}
                          title="Playlist in Spotify öffnen"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Integration Status */}
                  <div className={`p-4 rounded-lg transition-colors duration-300 ${
                    isDarkMode ? 'bg-purple-800/30' : 'bg-purple-100'
                  }`}>
                    <div className="flex items-center gap-3 mb-2">
                      <Settings className="w-5 h-5 text-purple-500" />
                      <span className={`font-semibold transition-colors duration-300 ${
                        isDarkMode ? 'text-purple-300' : 'text-purple-800'
                      }`}>
                        🔧 Integration Status
                      </span>
                    </div>
                    <div className={`text-sm space-y-1 transition-colors duration-300 ${
                      isDarkMode ? 'text-purple-200' : 'text-purple-700'
                    }`}>
                      <div>✅ Automatisches Hinzufügen: <strong>Aktiv</strong></div>
                      <div>✅ Automatisches Entfernen: <strong>Aktiv</strong></div>
                      <div>✅ Für alle Benutzer: <strong>Verfügbar</strong></div>
                      <div>🎯 Songs werden automatisch zur ausgewählten Playlist hinzugefügt</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`p-4 rounded-lg transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    <User className="w-5 h-5 text-gray-500" />
                    <span className={`font-semibold transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      ❌ Nicht mit Spotify verbunden
                    </span>
                  </div>
                  <div className={`text-sm space-y-1 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <div>• Songs werden nur zur internen Playlist hinzugefügt</div>
                    <div>• Keine automatische Spotify-Integration</div>
                    {isAdmin ? (
                      <div>• Als Admin kannst du die Verbindung einrichten</div>
                    ) : (
                      <div>• Ein Admin muss die Spotify-Verbindung einrichten</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {isInitializing ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 mx-auto border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className={`text-lg font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {isAdmin ? 'Spotify-Verbindung prüfen...' : 'Lade Playlist-Verlauf...'}
              </p>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className={`p-4 rounded-xl transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <div className={`text-2xl font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`}>
                    {approvedRequests.length}
                  </div>
                  <div className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Songs im Verlauf
                  </div>
                </div>
                <div className={`p-4 rounded-xl transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <div className={`text-2xl font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    {spotifyTracks.length}
                  </div>
                  <div className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Spotify Tracks
                  </div>
                </div>
                <div className={`p-4 rounded-xl transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <div className={`text-2xl font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                  }`}>
                    {nonSpotifyTracks.length}
                  </div>
                  <div className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Andere Tracks
                  </div>
                </div>
              </div>

              {/* 🔒 ADMIN-ONLY: Spotify Connection Section */}
              {isAdmin && (
                <div className={`p-6 rounded-xl mb-6 transition-colors duration-300 ${
                  isSpotifyConnected
                    ? isDarkMode 
                      ? 'bg-green-900/20 border border-green-700/30' 
                      : 'bg-green-50 border border-green-200'
                    : isDarkMode 
                      ? 'bg-gray-700/50 border border-gray-600' 
                      : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-full transition-colors duration-300 ${
                        isSpotifyConnected
                          ? isDarkMode ? 'bg-green-600' : 'bg-green-500'
                          : isDarkMode ? 'bg-gray-600' : 'bg-gray-400'
                      }`}>
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className={`font-semibold mb-1 transition-colors duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          🔒 Admin: Spotify-Verbindung
                        </h4>
                        {isSpotifyConnected && spotifyUser ? (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-green-500" />
                            <span className={`text-sm font-medium transition-colors duration-300 ${
                              isDarkMode ? 'text-green-300' : 'text-green-700'
                            }`}>
                              Verbunden als: {spotifyUser.display_name}
                            </span>
                          </div>
                        ) : (
                          <p className={`text-sm transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Nicht verbunden - Nur Admins können sich verbinden
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isSpotifyConnected ? (
                        <>
                          <button
                            onClick={loadUserPlaylists}
                            disabled={isLoading}
                            className={`p-2 rounded-lg transition-colors ${
                              isLoading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
                            } text-white`}
                            title="Playlists neu laden"
                          >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                          </button>
                          <button
                            onClick={handleSpotifyDisconnect}
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
                          onClick={handleSpotifyConnect}
                          className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
                            isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
                          } text-white font-semibold`}
                        >
                          <LogIn className="w-5 h-5" />
                          Admin: Mit Spotify verbinden
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 🎯 ADMIN-ONLY: Persistent Playlist Selection */}
                  {isSpotifyConnected && (
                    <div className={`p-4 rounded-xl transition-colors duration-300 ${
                      playlistLocked && persistentPlaylist
                        ? isDarkMode ? 'bg-green-900/30 border border-green-700/30' : 'bg-green-50 border border-green-200'
                        : isDarkMode ? 'bg-purple-900/30 border border-purple-700/30' : 'bg-purple-50 border border-purple-200'
                    }`}>
                      {playlistLocked && persistentPlaylist ? (
                        /* Locked Playlist Display */
                        <div>
                          <div className="flex items-center gap-3 mb-3">
                            <Lock className={`w-5 h-5 transition-colors duration-300 ${
                              isDarkMode ? 'text-green-400' : 'text-green-600'
                            }`} />
                            <h5 className={`font-semibold transition-colors duration-300 ${
                              isDarkMode ? 'text-green-300' : 'text-green-800'
                            }`}>
                              🔒 Ausgewählte Hochzeits-Playlist
                            </h5>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {persistentPlaylist.images?.[0] ? (
                                <img 
                                  src={persistentPlaylist.images[0].url} 
                                  alt={persistentPlaylist.name}
                                  className="w-12 h-12 rounded object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded bg-gray-300 flex items-center justify-center">
                                  <Music className="w-6 h-6 text-gray-600" />
                                </div>
                              )}
                              <div>
                                <div className={`font-semibold transition-colors duration-300 ${
                                  isDarkMode ? 'text-green-200' : 'text-green-800'
                                }`}>
                                  {persistentPlaylist.name}
                                </div>
                                <div className={`text-sm transition-colors duration-300 ${
                                  isDarkMode ? 'text-green-300' : 'text-green-600'
                                }`}>
                                  {persistentPlaylist.tracks.total} Songs • Ausgewählt am {new Date(persistentPlaylist.selectedAt).toLocaleDateString('de-DE')}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className={`mt-3 p-3 rounded-lg transition-colors duration-300 ${
                            isDarkMode ? 'bg-green-800/30' : 'bg-green-100'
                          }`}>
                            <p className={`text-sm transition-colors duration-300 ${
                              isDarkMode ? 'text-green-200' : 'text-green-700'
                            }`}>
                              ✅ Alle neuen Songs werden automatisch zu dieser Playlist hinzugefügt - auch von normalen Benutzern!
                            </p>
                          </div>
                        </div>
                      ) : userPlaylists.length > 0 ? (
                        /* Playlist Selection */
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h5 className={`font-semibold transition-colors duration-300 ${
                                isDarkMode ? 'text-purple-300' : 'text-purple-800'
                              }`}>
                                🎵 Hochzeits-Playlist auswählen
                              </h5>
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
                              <ChevronDown className={`w-4 h-4 transition-transform ${showPlaylistSelector ? 'rotate-180' : ''}`} />
                            </button>
                          </div>

                          {/* Playlist Dropdown */}
                          {showPlaylistSelector && (
                            <div className={`p-3 rounded-lg transition-colors duration-300 ${
                              isDarkMode ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-200'
                            }`}>
                              <div className="max-h-40 overflow-y-auto space-y-2">
                                {userPlaylists.map((playlist) => (
                                  <button
                                    key={playlist.id}
                                    onClick={() => handlePlaylistSelection(playlist)}
                                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                                      isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      {playlist.images?.[0] ? (
                                        <img 
                                          src={playlist.images[0].url} 
                                          alt={playlist.name}
                                          className="w-10 h-10 rounded object-cover"
                                        />
                                      ) : (
                                        <div className="w-10 h-10 rounded bg-gray-300 flex items-center justify-center">
                                          <Music className="w-5 h-5 text-gray-600" />
                                        </div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{playlist.name}</div>
                                        <div className="text-sm opacity-75">{playlist.tracks.total} Songs</div>
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className={`transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Keine Playlists gefunden. Erstelle zuerst eine Playlist in Spotify.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Add to Playlist Result */}
                  {addToPlaylistResult && (
                    <div className={`mt-4 p-3 rounded-lg ${
                      addToPlaylistResult.includes('✅') || addToPlaylistResult.includes('🎯') || addToPlaylistResult.includes('🔒')
                        ? isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
                        : isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
                    }`}>
                      {addToPlaylistResult}
                    </div>
                  )}
                </div>
              )}

              {/* 🔒 NON-ADMIN: Info about automatic integration */}
              {!isAdmin && (
                <div className={`p-6 rounded-xl mb-6 transition-colors duration-300 ${
                  isDarkMode ? 'bg-blue-900/20 border border-blue-700/30' : 'bg-blue-50 border border-blue-200'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className={`w-6 h-6 transition-colors duration-300 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                    <h4 className={`font-semibold transition-colors duration-300 ${
                      isDarkMode ? 'text-blue-300' : 'text-blue-800'
                    }`}>
                      ℹ️ Automatische Spotify-Integration
                    </h4>
                  </div>
                  <p className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-blue-200' : 'text-blue-700'
                  }`}>
                    Wenn ein Admin die Spotify-Integration eingerichtet hat, werden deine Songs automatisch zur Hochzeits-Playlist hinzugefügt. Du musst nichts weiter tun - einfach Songs hinzufügen und sie erscheinen sowohl hier als auch in Spotify!
                  </p>
                </div>
              )}

              {/* Export Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Quick Actions */}
                <div className={`p-4 rounded-xl transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <h4 className={`font-semibold mb-3 transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    🚀 Schnelle Aktionen
                  </h4>
                  <div className="space-y-2">
                    <button
                      onClick={handleOpenSpotify}
                      disabled={spotifyTracks.length === 0}
                      className={`w-full flex items-center gap-2 p-3 rounded-lg transition-colors ${
                        spotifyTracks.length === 0
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700'
                      } text-white`}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Playlist in Spotify öffnen
                    </button>
                    
                    <button
                      onClick={handleCopyToClipboard}
                      className={`w-full flex items-center gap-2 p-3 rounded-lg transition-colors ${
                        isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                      } text-white`}
                    >
                      {copySuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copySuccess ? 'Kopiert!' : 'Track-Liste kopieren'}
                    </button>
                  </div>
                </div>

                {/* Download Options */}
                <div className={`p-4 rounded-xl transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <h4 className={`font-semibold mb-3 transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    💾 Download-Optionen
                  </h4>
                  <div className="space-y-2">
                    <button
                      onClick={handleDownloadJson}
                      className={`w-full flex items-center gap-2 p-3 rounded-lg transition-colors ${
                        isDarkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'
                      } text-white`}
                    >
                      <FileText className="w-4 h-4" />
                      Als JSON herunterladen
                    </button>
                    
                    <button
                      onClick={handleDownloadM3U}
                      className={`w-full flex items-center gap-2 p-3 rounded-lg transition-colors ${
                        isDarkMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-orange-500 hover:bg-orange-600'
                      } text-white`}
                    >
                      <List className="w-4 h-4" />
                      Als M3U herunterladen
                    </button>
                  </div>
                </div>
              </div>

              {/* Track Preview */}
              {spotifyTracks.length > 0 && (
                <div className={`p-4 rounded-xl transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <h4 className={`font-semibold mb-3 transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    🎵 Songs im Verlauf ({spotifyTracks.length})
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {spotifyTracks.slice(0, 10).map((track, index) => (
                      <div key={track.id} className={`flex items-center gap-3 p-2 rounded transition-colors duration-300 ${
                        isDarkMode ? 'bg-gray-600' : 'bg-white'
                      }`}>
                        <span className={`text-sm font-mono transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {(index + 1).toString().padStart(2, '0')}
                        </span>
                        <div className="flex-1">
                          <div className={`font-medium transition-colors duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {track.songTitle}
                          </div>
                          <div className={`text-sm transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {track.artist}
                          </div>
                        </div>
                        <div className={`text-xs px-2 py-1 rounded transition-colors duration-300 ${
                          isDarkMode ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'
                        }`}>
                          {track.votes} 👍
                        </div>
                      </div>
                    ))}
                    {spotifyTracks.length > 10 && (
                      <div className={`text-center text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        ... und {spotifyTracks.length - 10} weitere Songs
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Non-Spotify Tracks Warning */}
              {nonSpotifyTracks.length > 0 && (
                <div className={`p-4 rounded-xl transition-colors duration-300 ${
                  isDarkMode ? 'bg-yellow-900/20 border border-yellow-700/30' : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <h4 className={`font-semibold mb-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-yellow-300' : 'text-yellow-800'
                  }`}>
                    ⚠️ Nicht-Spotify Tracks ({nonSpotifyTracks.length})
                  </h4>
                  <p className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-yellow-200' : 'text-yellow-700'
                  }`}>
                    Diese Songs können nicht automatisch zu Spotify Playlists hinzugefügt werden, da sie keine Spotify-IDs haben:
                  </p>
                  <div className="mt-2 space-y-1">
                    {nonSpotifyTracks.slice(0, 5).map((track) => (
                      <div key={track.id} className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-yellow-200' : 'text-yellow-700'
                      }`}>
                        • {track.songTitle} - {track.artist}
                      </div>
                    ))}
                    {nonSpotifyTracks.length > 5 && (
                      <div className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-yellow-300' : 'text-yellow-600'
                      }`}>
                        ... und {nonSpotifyTracks.length - 5} weitere
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};