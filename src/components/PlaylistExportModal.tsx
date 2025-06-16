import React, { useState, useEffect } from 'react';
import { X, Music, Download, ExternalLink, Copy, List, FileText, Check, Loader, LogIn, LogOut, Plus, RefreshCw, Heart, Star, Settings, User, ChevronDown } from 'lucide-react';
import { MusicRequest } from '../types';
import { 
  createPlaylistExport, 
  downloadPlaylistAsJson, 
  downloadPlaylistAsM3U,
  openSpotifyPlaylist,
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
  addToSelectedPlaylist
} from '../services/spotifyPlaylistService';

interface PlaylistExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  approvedRequests: MusicRequest[];
  isDarkMode: boolean;
}

export const PlaylistExportModal: React.FC<PlaylistExportModalProps> = ({
  isOpen,
  onClose,
  approvedRequests,
  isDarkMode
}) => {
  const [playlistExport, setPlaylistExport] = useState<PlaylistExport | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);
  const [spotifyUser, setSpotifyUser] = useState<any | null>(null);
  const [weddingPlaylist, setWeddingPlaylist] = useState<any | null>(null);
  const [userPlaylists, setUserPlaylists] = useState<any[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('');
  const [isAddingToPlaylist, setIsAddingToPlaylist] = useState(false);
  const [addToPlaylistResult, setAddToPlaylistResult] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);

  // Initialize Spotify auth on component mount
  useEffect(() => {
    if (isOpen) {
      initializeSpotifyConnection();
    }
  }, [isOpen]);

  const initializeSpotifyConnection = async () => {
    setIsInitializing(true);
    
    try {
      console.log('🔄 Initializing Spotify connection...');
      
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

  const handleSpotifyConnect = () => {
    console.log('🔐 Starting Spotify connection...');
    initiateAdminSpotifySetup();
  };

  const handleSpotifyDisconnect = () => {
    if (window.confirm('Spotify-Verbindung trennen?')) {
      logoutSpotify();
      setIsSpotifyConnected(false);
      setSpotifyUser(null);
      setWeddingPlaylist(null);
      setUserPlaylists([]);
      setSelectedPlaylistId('');
      console.log('🚪 Spotify disconnected');
    }
  };

  const handleAddToWeddingPlaylist = async () => {
    setIsAddingToPlaylist(true);
    setAddToPlaylistResult(null);

    try {
      console.log(`🎯 === AUTO-ADDING TO WEDDING PLAYLIST ===`);
      console.log(`📊 Total requests: ${approvedRequests.length}`);
      
      const spotifyTracks = approvedRequests.filter(request => request.spotifyId);
      console.log(`🎵 Spotify tracks to add: ${spotifyTracks.length}`);
      
      if (spotifyTracks.length === 0) {
        setAddToPlaylistResult(`❌ Keine Spotify-Songs gefunden. Füge zuerst Songs über die Suche hinzu.`);
        return;
      }
      
      const result = await addToWeddingPlaylist(spotifyTracks);
      
      if (result.success > 0) {
        setAddToPlaylistResult(`🎯 ${result.success} Songs erfolgreich zur Hochzeits-Playlist hinzugefügt!`);
        // Reload wedding playlist to show updated track count
        setTimeout(() => loadWeddingPlaylist(), 1000);
      } else {
        setAddToPlaylistResult(`❌ Fehler: ${result.errors.join(', ')}`);
      }
      
    } catch (error: any) {
      console.error('❌ Error adding to wedding playlist:', error);
      setAddToPlaylistResult(`❌ Fehler: ${error.message}`);
    } finally {
      setIsAddingToPlaylist(false);
    }
  };

  const handleAddToSelectedPlaylist = async () => {
    if (!selectedPlaylistId) {
      setAddToPlaylistResult('❌ Bitte wähle eine Playlist aus');
      return;
    }

    setIsAddingToPlaylist(true);
    setAddToPlaylistResult(null);

    try {
      console.log(`🎯 === ADDING TO SELECTED PLAYLIST ===`);
      console.log(`📊 Playlist ID: ${selectedPlaylistId}`);
      console.log(`📊 Total requests: ${approvedRequests.length}`);
      
      const spotifyTracks = approvedRequests.filter(request => request.spotifyId);
      console.log(`🎵 Spotify tracks to add: ${spotifyTracks.length}`);
      
      if (spotifyTracks.length === 0) {
        setAddToPlaylistResult(`❌ Keine Spotify-Songs gefunden.`);
        return;
      }
      
      const selectedPlaylist = userPlaylists.find(p => p.id === selectedPlaylistId);
      const result = await addToSelectedPlaylist(selectedPlaylistId, spotifyTracks);
      
      if (result.success > 0) {
        setAddToPlaylistResult(`🎯 ${result.success} Songs erfolgreich zu "${selectedPlaylist?.name}" hinzugefügt!`);
      } else {
        setAddToPlaylistResult(`❌ Fehler: ${result.errors.join(', ')}`);
      }
      
    } catch (error: any) {
      console.error('❌ Error adding to selected playlist:', error);
      setAddToPlaylistResult(`❌ Fehler: ${error.message}`);
    } finally {
      setIsAddingToPlaylist(false);
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
                Songs zu Spotify-Playlists hinzufügen
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
                    Songs in Playlist
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

              {/* Spotify Connection Section */}
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
                      <Music className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className={`font-semibold mb-1 transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        🎯 Spotify-Verbindung
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
                          Nicht verbunden - Einmalige Anmeldung erforderlich
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
                        Mit Spotify verbinden
                      </button>
                    )}
                  </div>
                </div>

                {/* Playlist Selection */}
                {isSpotifyConnected && userPlaylists.length > 0 && (
                  <div className={`p-4 rounded-xl transition-colors duration-300 ${
                    isDarkMode ? 'bg-purple-900/30 border border-purple-700/30' : 'bg-purple-50 border border-purple-200'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h5 className={`font-semibold transition-colors duration-300 ${
                          isDarkMode ? 'text-purple-300' : 'text-purple-800'
                        }`}>
                          🎵 Deine Spotify Playlists
                        </h5>
                        <p className={`text-sm transition-colors duration-300 ${
                          isDarkMode ? 'text-purple-200' : 'text-purple-700'
                        }`}>
                          Wähle eine Playlist aus ({userPlaylists.length} verfügbar)
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
                      <div className={`mb-4 p-3 rounded-lg transition-colors duration-300 ${
                        isDarkMode ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-200'
                      }`}>
                        <div className="max-h-40 overflow-y-auto space-y-2">
                          {userPlaylists.map((playlist) => (
                            <button
                              key={playlist.id}
                              onClick={() => {
                                setSelectedPlaylistId(playlist.id);
                                setShowPlaylistSelector(false);
                              }}
                              className={`w-full text-left p-3 rounded-lg transition-colors ${
                                selectedPlaylistId === playlist.id
                                  ? isDarkMode ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-800'
                                  : isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
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
                                {selectedPlaylistId === playlist.id && (
                                  <Check className="w-5 h-5 text-green-500" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Selected Playlist Info */}
                    {selectedPlaylistId && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {(() => {
                            const selectedPlaylist = userPlaylists.find(p => p.id === selectedPlaylistId);
                            return selectedPlaylist ? (
                              <>
                                {selectedPlaylist.images?.[0] ? (
                                  <img 
                                    src={selectedPlaylist.images[0].url} 
                                    alt={selectedPlaylist.name}
                                    className="w-8 h-8 rounded object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded bg-gray-300 flex items-center justify-center">
                                    <Music className="w-4 h-4 text-gray-600" />
                                  </div>
                                )}
                                <div>
                                  <div className={`font-medium transition-colors duration-300 ${
                                    isDarkMode ? 'text-purple-200' : 'text-purple-800'
                                  }`}>
                                    {selectedPlaylist.name}
                                  </div>
                                  <div className={`text-sm transition-colors duration-300 ${
                                    isDarkMode ? 'text-purple-300' : 'text-purple-600'
                                  }`}>
                                    {selectedPlaylist.tracks.total} Songs
                                  </div>
                                </div>
                              </>
                            ) : null;
                          })()}
                        </div>
                        
                        <button
                          onClick={handleAddToSelectedPlaylist}
                          disabled={isAddingToPlaylist || spotifyTracks.length === 0}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                            isAddingToPlaylist || spotifyTracks.length === 0
                              ? 'bg-gray-400 cursor-not-allowed'
                              : isDarkMode
                                ? 'bg-purple-600 hover:bg-purple-700'
                                : 'bg-purple-500 hover:bg-purple-600'
                          } text-white font-semibold`}
                        >
                          {isAddingToPlaylist ? (
                            <>
                              <Loader className="w-4 h-4 animate-spin" />
                              Hinzufügen...
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              {spotifyTracks.length} Songs hinzufügen
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Wedding Playlist Section */}
                {isSpotifyConnected && (
                  <div className={`p-4 rounded-xl transition-colors duration-300 ${
                    isDarkMode ? 'bg-pink-900/30 border border-pink-700/30' : 'bg-pink-50 border border-pink-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Heart className={`w-6 h-6 transition-colors duration-300 ${
                          isDarkMode ? 'text-pink-400' : 'text-pink-600'
                        }`} />
                        <div>
                          <h5 className={`font-semibold transition-colors duration-300 ${
                            isDarkMode ? 'text-pink-300' : 'text-pink-800'
                          }`}>
                            💕 Kristin & Maurizio Hochzeits-Playlist
                          </h5>
                          {weddingPlaylist ? (
                            <p className={`text-sm transition-colors duration-300 ${
                              isDarkMode ? 'text-pink-200' : 'text-pink-700'
                            }`}>
                              "{weddingPlaylist.name}" • {weddingPlaylist.tracks.total} Songs
                            </p>
                          ) : (
                            <p className={`text-sm transition-colors duration-300 ${
                              isDarkMode ? 'text-pink-200' : 'text-pink-700'
                            }`}>
                              {isLoading ? 'Lade Playlist-Details...' : 'Playlist nicht gefunden'}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={openWeddingPlaylist}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                            isDarkMode ? 'bg-pink-600 hover:bg-pink-700' : 'bg-pink-500 hover:bg-pink-600'
                          } text-white text-sm`}
                        >
                          <ExternalLink className="w-4 h-4" />
                          Öffnen
                        </button>
                        
                        <button
                          onClick={handleAddToWeddingPlaylist}
                          disabled={isAddingToPlaylist || spotifyTracks.length === 0}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                            isAddingToPlaylist || spotifyTracks.length === 0
                              ? 'bg-gray-400 cursor-not-allowed'
                              : isDarkMode
                                ? 'bg-pink-600 hover:bg-pink-700'
                                : 'bg-pink-500 hover:bg-pink-600'
                          } text-white font-semibold`}
                        >
                          {isAddingToPlaylist ? (
                            <>
                              <Loader className="w-4 h-4 animate-spin" />
                              Hinzufügen...
                            </>
                          ) : (
                            <>
                              <Star className="w-4 h-4" />
                              {spotifyTracks.length} Songs hinzufügen
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add to Playlist Result */}
                {addToPlaylistResult && (
                  <div className={`mt-4 p-3 rounded-lg ${
                    addToPlaylistResult.includes('✅') || addToPlaylistResult.includes('🎯')
                      ? isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
                      : isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
                  }`}>
                    {addToPlaylistResult}
                  </div>
                )}
              </div>

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
                    🎵 Songs in der Playlist ({spotifyTracks.length})
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