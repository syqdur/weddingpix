import React, { useState, useEffect } from 'react';
import { X, Music, Download, Copy, ExternalLink, Check, Loader, LogOut, User, Shield, List, FileText, Play } from 'lucide-react';
import { MusicRequest } from '../types';
import { 
  getUserPlaylists, 
  getWeddingPlaylistDetails, 
  setSelectedPlaylist,
  getSelectedPlaylist,
  createPlaylistExport,
  downloadPlaylistAsJson,
  downloadPlaylistAsM3U,
  copyTrackListToClipboard,
  openSpotifyPlaylist,
  logoutSpotify,
  getCurrentSpotifyUser,
  getWeddingPlaylistUrl,
  initiateAdminSpotifySetup
} from '../services/spotifyPlaylistService';
import { PersistentSpotifyIntegration } from './PersistentSpotifyIntegration';
import { loadMusicRequests } from '../services/musicService';

interface PlaylistExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  isAdmin: boolean;
}

export const PlaylistExportModal: React.FC<PlaylistExportModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  isAdmin
}) => {
  const [requests, setRequests] = useState<MusicRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [playlistDetails, setPlaylistDetails] = useState<any | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  // Load music requests
  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    
    // Get selected playlist from localStorage
    const savedPlaylist = getSelectedPlaylist();
    if (savedPlaylist) {
      setSelectedPlaylistId(savedPlaylist.id);
    }
    
    // Get current user info
    getCurrentSpotifyUser().then(user => {
      setCurrentUser(user);
    }).catch(error => {
      console.error('Error getting user info:', error);
    });
    
    // Load music requests
    const unsubscribe = loadMusicRequests((loadedRequests) => {
      setRequests(loadedRequests);
      setIsLoading(false);
      
      // Try to load playlist details if we have a selected playlist
      if (savedPlaylist) {
        loadPlaylistDetails(savedPlaylist.id);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen]);

  const loadPlaylistDetails = async (playlistId: string) => {
    try {
      setError(null);
      const details = await getWeddingPlaylistDetails();
      setPlaylistDetails(details);
    } catch (error) {
      console.error('Error loading playlist details:', error);
      setError('Fehler beim Laden der Playlist-Details');
    }
  };

  const handlePlaylistSelected = (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    setSelectedPlaylist({ id: playlistId });
    loadPlaylistDetails(playlistId);
  };

  const handleExport = async (format: 'json' | 'm3u' | 'clipboard' | 'open') => {
    setIsExporting(true);
    setExportSuccess(null);
    setCopySuccess(false);
    
    try {
      const playlistExport = createPlaylistExport(requests);
      
      switch (format) {
        case 'json':
          downloadPlaylistAsJson(playlistExport);
          setExportSuccess('Playlist als JSON heruntergeladen');
          break;
        case 'm3u':
          downloadPlaylistAsM3U(playlistExport);
          setExportSuccess('Playlist als M3U heruntergeladen');
          break;
        case 'clipboard':
          const success = await copyTrackListToClipboard(requests);
          if (success) {
            setCopySuccess(true);
            setExportSuccess('Tracklist in die Zwischenablage kopiert');
          } else {
            throw new Error('Fehler beim Kopieren in die Zwischenablage');
          }
          break;
        case 'open':
          openSpotifyPlaylist(requests);
          setExportSuccess('Playlist in Spotify geöffnet');
          break;
      }
    } catch (error) {
      console.error('Export error:', error);
      setError(`Fehler beim Export: ${error.message || 'Unbekannter Fehler'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutSpotify();
      setCurrentUser(null);
      setPlaylistDetails(null);
      setSelectedPlaylistId(null);
    } catch (error) {
      console.error('Logout error:', error);
      setError('Fehler beim Abmelden');
    }
  };

  if (!isOpen) return null;

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
                🎵 Spotify Playlist-Verwaltung
              </h3>
              <p className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Verbinde dein Spotify-Konto und verwalte die Hochzeits-Playlist
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

        <div className="p-6 space-y-6">
          {/* Spotify Integration */}
          <PersistentSpotifyIntegration 
            isDarkMode={isDarkMode}
            onPlaylistSelected={handlePlaylistSelected}
            selectedPlaylistId={selectedPlaylistId || undefined}
          />

          {/* Error Display */}
          {error && (
            <div className={`p-4 rounded-xl border transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-red-900/20 border-red-700/30 text-red-300' 
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Success Message */}
          {exportSuccess && (
            <div className={`p-4 rounded-xl border transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-green-900/20 border-green-700/30 text-green-300' 
                : 'bg-green-50 border-green-200 text-green-700'
            }`}>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                <span className="text-sm">{exportSuccess}</span>
              </div>
            </div>
          )}

          {/* Playlist Stats */}
          {!isLoading && (
            <div className={`p-4 rounded-xl border transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
            }`}>
              <h4 className={`font-semibold mb-3 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                📊 Playlist-Statistiken
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    {requests.length}
                  </div>
                  <div className={`text-xs transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Songs
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`}>
                    {new Set(requests.map(r => r.requestedBy)).size}
                  </div>
                  <div className={`text-xs transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Gäste
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-pink-400' : 'text-pink-600'
                  }`}>
                    {requests.reduce((sum, r) => sum + r.votes, 0)}
                  </div>
                  <div className={`text-xs transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Votes
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-purple-400' : 'text-purple-600'
                  }`}>
                    {Math.floor(requests.reduce((sum, r) => sum + (r.duration || 0), 0) / 60000)}
                  </div>
                  <div className={`text-xs transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Minuten
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Export Options */}
          {currentUser && (
            <div className={`p-4 rounded-xl border transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
            }`}>
              <h4 className={`font-semibold mb-3 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                📤 Export-Optionen
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => handleExport('json')}
                  disabled={isExporting || requests.length === 0}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors duration-300 ${
                    isExporting || requests.length === 0
                      ? 'cursor-not-allowed opacity-50'
                      : isDarkMode
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  <Download className="w-5 h-5" />
                  <span>Als JSON exportieren</span>
                </button>
                <button
                  onClick={() => handleExport('m3u')}
                  disabled={isExporting || requests.length === 0}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors duration-300 ${
                    isExporting || requests.length === 0
                      ? 'cursor-not-allowed opacity-50'
                      : isDarkMode
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <span>Als M3U Playlist exportieren</span>
                </button>
                <button
                  onClick={() => handleExport('clipboard')}
                  disabled={isExporting || requests.length === 0}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors duration-300 ${
                    isExporting || requests.length === 0
                      ? 'cursor-not-allowed opacity-50'
                      : isDarkMode
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-purple-500 hover:bg-purple-600 text-white'
                  }`}
                >
                  <Copy className="w-5 h-5" />
                  <span>{copySuccess ? 'Kopiert!' : 'In Zwischenablage kopieren'}</span>
                </button>
                <button
                  onClick={() => handleExport('open')}
                  disabled={isExporting}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors duration-300 ${
                    isExporting
                      ? 'cursor-not-allowed opacity-50'
                      : isDarkMode
                        ? 'bg-pink-600 hover:bg-pink-700 text-white'
                        : 'bg-pink-500 hover:bg-pink-600 text-white'
                  }`}
                >
                  <Play className="w-5 h-5" />
                  <span>In Spotify öffnen</span>
                </button>
              </div>
            </div>
          )}

          {/* Playlist URL */}
          <div className={`p-4 rounded-xl border transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
          }`}>
            <h4 className={`font-semibold mb-3 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              🔗 Playlist-Link
            </h4>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={getWeddingPlaylistUrl()}
                readOnly
                className={`flex-1 px-3 py-2 rounded-lg border transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-gray-300' 
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              />
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(getWeddingPlaylistUrl());
                  setCopySuccess(true);
                  setTimeout(() => setCopySuccess(false), 2000);
                }}
                className={`p-2 rounded-lg transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
                title="Link kopieren"
              >
                {copySuccess ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
              <a
                href={getWeddingPlaylistUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2 rounded-lg transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
                title="In Spotify öffnen"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Admin Actions */}
          {isAdmin && (
            <div className={`p-4 rounded-xl border transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
            }`}>
              <h4 className={`font-semibold mb-3 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                🔐 Admin-Aktionen
              </h4>
              <div className="space-y-3">
                <button
                  onClick={initiateAdminSpotifySetup}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                      : 'bg-purple-500 hover:bg-purple-600 text-white'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  Spotify-Integration neu einrichten
                </button>
                {currentUser && (
                  <button
                    onClick={handleLogout}
                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                  >
                    <LogOut className="w-5 h-5" />
                    Von Spotify abmelden
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center">
                <Loader className="w-8 h-8 animate-spin text-green-500 mb-4" />
                <p className={`text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Lade Playlist-Daten...
                </p>
              </div>
            </div>
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