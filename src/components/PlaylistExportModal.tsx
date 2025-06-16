import React, { useState, useEffect } from 'react';
import { X, Music, Download, ExternalLink, Copy, List, FileText, Check, Loader, LogIn, LogOut, Plus, RefreshCw } from 'lucide-react';
import { MusicRequest } from '../types';
import { 
  createPlaylistExport, 
  downloadPlaylistAsJson, 
  downloadPlaylistAsM3U,
  openSpotifyPlaylist,
  copyTrackListToClipboard,
  PlaylistExport,
  isUserLoggedIn,
  initiateSpotifyLogin,
  logoutSpotifyUser,
  getUserPlaylists,
  addApprovedRequestsToPlaylist
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userPlaylists, setUserPlaylists] = useState<any[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('');
  const [isAddingToPlaylist, setIsAddingToPlaylist] = useState(false);
  const [addToPlaylistResult, setAddToPlaylistResult] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoggedIn(isUserLoggedIn());
      
      if (approvedRequests.length > 0) {
        setIsLoading(true);
        setTimeout(() => {
          const exportData = createPlaylistExport(approvedRequests);
          setPlaylistExport(exportData);
          setIsLoading(false);
        }, 500);
      }
    }
  }, [isOpen, approvedRequests]);

  useEffect(() => {
    if (isLoggedIn && isOpen) {
      loadUserPlaylists();
    }
  }, [isLoggedIn, isOpen]);

  const loadUserPlaylists = async () => {
    try {
      setIsLoading(true);
      const playlists = await getUserPlaylists();
      setUserPlaylists(playlists);
      console.log(`✅ Loaded ${playlists.length} user playlists`);
    } catch (error) {
      console.error('❌ Error loading playlists:', error);
      alert(`Fehler beim Laden der Playlists: ${error.message}`);
      if (error.message.includes('angemeldet')) {
        setIsLoggedIn(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpotifyLogin = () => {
    initiateSpotifyLogin();
    
    // Check for login success every 2 seconds
    const checkLogin = setInterval(() => {
      if (isUserLoggedIn()) {
        setIsLoggedIn(true);
        clearInterval(checkLogin);
        loadUserPlaylists();
      }
    }, 2000);
    
    // Stop checking after 2 minutes
    setTimeout(() => clearInterval(checkLogin), 120000);
  };

  const handleSpotifyLogout = () => {
    logoutSpotifyUser();
    setIsLoggedIn(false);
    setUserPlaylists([]);
    setSelectedPlaylistId('');
  };

  const handleAddToPlaylist = async () => {
    if (!selectedPlaylistId) {
      alert('Bitte wähle eine Playlist aus.');
      return;
    }

    setIsAddingToPlaylist(true);
    setAddToPlaylistResult(null);

    try {
      const result = await addApprovedRequestsToPlaylist(selectedPlaylistId, approvedRequests);
      
      if (result.success > 0) {
        setAddToPlaylistResult(`✅ ${result.success} Songs erfolgreich zur Playlist hinzugefügt!`);
      } else {
        setAddToPlaylistResult(`❌ Fehler: ${result.errors.join(', ')}`);
      }
      
    } catch (error) {
      console.error('❌ Error adding to playlist:', error);
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
                🎵 Spotify Playlist Management
              </h3>
              <p className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Füge genehmigte Songs zu deiner Spotify Playlist hinzu
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
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 mx-auto border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className={`text-lg font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {isLoggedIn ? 'Lade Playlists...' : 'Erstelle Export...'}
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
                    Genehmigte Songs
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

              {/* Spotify Login Section */}
              <div className={`p-6 rounded-xl mb-6 transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-green-900/20 border border-green-700/30' 
                  : 'bg-green-50 border border-green-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`font-semibold mb-2 transition-colors duration-300 ${
                      isDarkMode ? 'text-green-300' : 'text-green-800'
                    }`}>
                      🎯 Zu bestehender Playlist hinzufügen
                    </h4>
                    <p className={`text-sm transition-colors duration-300 ${
                      isDarkMode ? 'text-green-200' : 'text-green-700'
                    }`}>
                      {isLoggedIn 
                        ? 'Du bist bei Spotify angemeldet. Wähle eine Playlist aus:'
                        : 'Melde dich bei Spotify an, um Songs zu deinen Playlists hinzuzufügen.'
                      }
                    </p>
                  </div>
                  
                  {isLoggedIn ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={loadUserPlaylists}
                        className={`p-2 rounded-lg transition-colors ${
                          isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
                        } text-white`}
                        title="Playlists neu laden"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleSpotifyLogout}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'
                        } text-white`}
                      >
                        <LogOut className="w-4 h-4" />
                        Abmelden
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleSpotifyLogin}
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
                        isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
                      } text-white font-semibold`}
                    >
                      <LogIn className="w-5 h-5" />
                      Bei Spotify anmelden
                    </button>
                  )}
                </div>

                {/* Playlist Selection */}
                {isLoggedIn && userPlaylists.length > 0 && (
                  <div className="mt-4">
                    <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                      isDarkMode ? 'text-green-300' : 'text-green-800'
                    }`}>
                      Playlist auswählen:
                    </label>
                    <div className="flex gap-3">
                      <select
                        value={selectedPlaylistId}
                        onChange={(e) => setSelectedPlaylistId(e.target.value)}
                        className={`flex-1 px-3 py-2 border rounded-lg transition-colors duration-300 ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="">-- Playlist wählen --</option>
                        {userPlaylists.map((playlist) => (
                          <option key={playlist.id} value={playlist.id}>
                            {playlist.name} ({playlist.tracks.total} Songs)
                          </option>
                        ))}
                      </select>
                      
                      <button
                        onClick={handleAddToPlaylist}
                        disabled={!selectedPlaylistId || isAddingToPlaylist || spotifyTracks.length === 0}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          !selectedPlaylistId || isAddingToPlaylist || spotifyTracks.length === 0
                            ? 'bg-gray-400 cursor-not-allowed'
                            : isDarkMode
                              ? 'bg-green-600 hover:bg-green-700'
                              : 'bg-green-500 hover:bg-green-600'
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

                    {/* Add to Playlist Result */}
                    {addToPlaylistResult && (
                      <div className={`mt-3 p-3 rounded-lg ${
                        addToPlaylistResult.includes('✅') 
                          ? isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
                          : isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
                      }`}>
                        {addToPlaylistResult}
                      </div>
                    )}
                  </div>
                )}

                {isLoggedIn && userPlaylists.length === 0 && !isLoading && (
                  <div className={`mt-4 p-3 rounded-lg transition-colors duration-300 ${
                    isDarkMode ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    ⚠️ Keine Playlists gefunden. Erstelle zuerst eine Playlist in Spotify.
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
                      Neue Playlist in Spotify erstellen
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
                    🎵 Genehmigte Spotify Tracks ({spotifyTracks.length})
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