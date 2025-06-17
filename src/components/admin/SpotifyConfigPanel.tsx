import React, { useState, useEffect } from 'react';
import { Music, RefreshCw, Save, CheckCircle, AlertCircle, Loader, Shield, Key, Lock } from 'lucide-react';
import { 
  getSpotifyConfig, 
  updateSpotifyConfig, 
  getUserPlaylists,
  setActivePlaylist,
  syncDatabaseWithSpotify
} from '../../services/spotifyIntegration';

interface SpotifyConfigPanelProps {
  isDarkMode: boolean;
  adminName: string;
}

export const SpotifyConfigPanel: React.FC<SpotifyConfigPanelProps> = ({ 
  isDarkMode,
  adminName
}) => {
  const [config, setConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [showRefreshToken, setShowRefreshToken] = useState(false);

  // Load configuration on mount
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const spotifyConfig = await getSpotifyConfig();
      setConfig(spotifyConfig || {
        clientId: '',
        clientSecret: '',
        refreshToken: '',
        accessToken: '',
        tokenExpiresAt: 0,
        activePlaylistId: '',
        activePlaylistName: '',
        lastSyncTimestamp: 0,
        lastSyncStatus: 'success'
      });
      
      // Load playlists if we have tokens
      if (spotifyConfig?.accessToken) {
        loadPlaylists();
      }
    } catch (error) {
      console.error('Error loading Spotify config:', error);
      setError('Fehler beim Laden der Spotify-Konfiguration');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlaylists = async () => {
    setIsLoadingPlaylists(true);
    setError(null);
    
    try {
      const userPlaylists = await getUserPlaylists();
      setPlaylists(userPlaylists);
    } catch (error) {
      console.error('Error loading playlists:', error);
      setError('Fehler beim Laden der Playlists');
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      await updateSpotifyConfig({
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        refreshToken: config.refreshToken
      }, adminName);
      
      setSuccess('Spotify-Konfiguration erfolgreich gespeichert');
      
      // Reload config to get updated values
      await loadConfig();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error saving Spotify config:', error);
      setError('Fehler beim Speichern der Spotify-Konfiguration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectPlaylist = async (playlistId: string, playlistName: string) => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      await setActivePlaylist(playlistId, playlistName, adminName);
      
      setSuccess(`Playlist "${playlistName}" erfolgreich als aktive Playlist gesetzt`);
      
      // Reload config to get updated values
      await loadConfig();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error setting active playlist:', error);
      setError('Fehler beim Setzen der aktiven Playlist');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncWithSpotify = async () => {
    setIsSyncing(true);
    setError(null);
    setSuccess(null);
    
    try {
      await syncDatabaseWithSpotify(adminName);
      
      setSuccess('Datenbank erfolgreich mit Spotify synchronisiert');
      
      // Reload config to get updated values
      await loadConfig();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error syncing with Spotify:', error);
      setError('Fehler bei der Synchronisierung mit Spotify');
    } finally {
      setIsSyncing(false);
    }
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'Nie';
    return new Date(timestamp).toLocaleString('de-DE');
  };

  const formatTimeRemaining = (expiresAt: number) => {
    if (!expiresAt) return 'Abgelaufen';
    
    const now = Date.now();
    const remaining = expiresAt - now;
    
    if (remaining <= 0) return 'Abgelaufen';
    
    const minutes = Math.floor(remaining / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else {
      return `${minutes}m`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center">
          <Loader className="w-8 h-8 animate-spin text-green-500 mb-4" />
          <p className={`text-sm transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Lade Spotify-Konfiguration...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
              Spotify-Konfiguration
            </h3>
            <p className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Verwalte die Spotify-Integration für Musikwünsche
            </p>
          </div>
        </div>
        
        <button
          onClick={handleSyncWithSpotify}
          disabled={isSyncing || !config.activePlaylistId}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isSyncing || !config.activePlaylistId
              ? 'cursor-not-allowed opacity-50'
              : isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
          title="Datenbank mit Spotify synchronisieren"
        >
          {isSyncing ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              <span>Synchronisiere...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              <span>Synchronisieren</span>
            </>
          )}
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className={`p-4 rounded-xl border transition-colors duration-300 ${
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
      
      {success && (
        <div className={`p-4 rounded-xl border transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-green-900/20 border-green-700/30 text-green-300' 
            : 'bg-green-50 border-green-200 text-green-700'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span>{success}</span>
          </div>
        </div>
      )}

      {/* API Credentials */}
      <div className={`p-6 rounded-xl border transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
      }`}>
        <h4 className={`font-semibold mb-4 flex items-center gap-2 transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          <Key className="w-5 h-5" />
          API-Zugangsdaten
        </h4>
        
        <div className="space-y-4">
          {/* Client ID */}
          <div>
            <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Client ID
            </label>
            <input
              type="text"
              value={config.clientId || ''}
              onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="Spotify Client ID"
            />
          </div>
          
          {/* Client Secret */}
          <div>
            <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Client Secret
            </label>
            <div className="relative">
              <input
                type={showClientSecret ? 'text' : 'password'}
                value={config.clientSecret || ''}
                onChange={(e) => setConfig({ ...config, clientSecret: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Spotify Client Secret"
              />
              <button
                type="button"
                onClick={() => setShowClientSecret(!showClientSecret)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                <Eye className={`w-4 h-4 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
              </button>
            </div>
          </div>
          
          {/* Refresh Token */}
          <div>
            <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Refresh Token
            </label>
            <div className="relative">
              <input
                type={showRefreshToken ? 'text' : 'password'}
                value={config.refreshToken || ''}
                onChange={(e) => setConfig({ ...config, refreshToken: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Spotify Refresh Token"
              />
              <button
                type="button"
                onClick={() => setShowRefreshToken(!showRefreshToken)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                <Eye className={`w-4 h-4 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
              </button>
            </div>
          </div>
          
          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveConfig}
              disabled={isSaving}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isSaving
                  ? 'cursor-not-allowed opacity-50'
                  : isDarkMode
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Speichern...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Speichern</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Token Status */}
      <div className={`p-6 rounded-xl border transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
      }`}>
        <h4 className={`font-semibold mb-4 flex items-center gap-2 transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          <Shield className="w-5 h-5" />
          Token-Status
        </h4>
        
        <div className="space-y-4">
          <div className={`p-4 rounded-lg transition-colors duration-300 ${
            config.accessToken
              ? config.tokenExpiresAt > Date.now()
                ? isDarkMode ? 'bg-green-900/20 border border-green-700/30' : 'bg-green-50 border border-green-200'
                : isDarkMode ? 'bg-red-900/20 border border-red-700/30' : 'bg-red-50 border border-red-200'
              : isDarkMode ? 'bg-gray-700/50 border border-gray-600' : 'bg-gray-50 border border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {config.accessToken ? (
                  config.tokenExpiresAt > Date.now() ? (
                    <CheckCircle className={`w-5 h-5 ${
                      isDarkMode ? 'text-green-400' : 'text-green-500'
                    }`} />
                  ) : (
                    <AlertCircle className={`w-5 h-5 ${
                      isDarkMode ? 'text-red-400' : 'text-red-500'
                    }`} />
                  )
                ) : (
                  <Lock className={`w-5 h-5 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                )}
                <span className={`font-medium transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {config.accessToken
                    ? config.tokenExpiresAt > Date.now()
                      ? 'Access Token gültig'
                      : 'Access Token abgelaufen'
                    : 'Kein Access Token'
                  }
                </span>
              </div>
              
              {config.accessToken && config.tokenExpiresAt > Date.now() && (
                <span className={`text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-green-300' : 'text-green-600'
                }`}>
                  Läuft ab in: {formatTimeRemaining(config.tokenExpiresAt)}
                </span>
              )}
            </div>
            
            {config.accessToken && (
              <div className={`mt-2 text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Letztes Update: {formatDate(config.updatedAt)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Playlist */}
      <div className={`p-6 rounded-xl border transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
      }`}>
        <h4 className={`font-semibold mb-4 flex items-center gap-2 transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          <Music className="w-5 h-5" />
          Aktive Playlist
        </h4>
        
        {config.activePlaylistId ? (
          <div className={`p-4 rounded-lg transition-colors duration-300 ${
            isDarkMode ? 'bg-green-900/20 border border-green-700/30' : 'bg-green-50 border border-green-200'
          }`}>
            <div className="flex items-center gap-3">
              <CheckCircle className={`w-5 h-5 ${
                isDarkMode ? 'text-green-400' : 'text-green-500'
              }`} />
              <div>
                <div className={`font-medium transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {config.activePlaylistName || 'Unbenannte Playlist'}
                </div>
                <div className={`text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  ID: {config.activePlaylistId}
                </div>
              </div>
            </div>
            
            <div className={`mt-2 text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-green-300' : 'text-green-600'
            }`}>
              Letzte Synchronisierung: {formatDate(config.lastSyncTimestamp)}
              {config.lastSyncStatus === 'failed' && (
                <span className={`ml-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-red-300' : 'text-red-600'
                }`}>
                  (Fehlgeschlagen: {config.lastSyncError})
                </span>
              )}
            </div>
            
            <div className="mt-3">
              <a
                href={`https://open.spotify.com/playlist/${config.activePlaylistId}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors ${
                  isDarkMode
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                <Music className="w-4 h-4" />
                <span>In Spotify öffnen</span>
              </a>
            </div>
          </div>
        ) : (
          <div className={`p-4 rounded-lg transition-colors duration-300 ${
            isDarkMode ? 'bg-yellow-900/20 border border-yellow-700/30' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-center gap-3">
              <AlertCircle className={`w-5 h-5 ${
                isDarkMode ? 'text-yellow-400' : 'text-yellow-500'
              }`} />
              <div className={`font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Keine aktive Playlist ausgewählt
              </div>
            </div>
            <div className={`mt-2 text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Wähle eine Playlist aus der Liste unten aus
            </div>
          </div>
        )}
        
        {/* Playlist Selection */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h5 className={`font-medium transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Verfügbare Playlists
            </h5>
            <button
              onClick={loadPlaylists}
              disabled={isLoadingPlaylists}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
                isLoadingPlaylists
                  ? 'cursor-not-allowed opacity-50'
                  : isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {isLoadingPlaylists ? (
                <>
                  <Loader className="w-3 h-3 animate-spin" />
                  <span>Laden...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3" />
                  <span>Aktualisieren</span>
                </>
              )}
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
                    config.activePlaylistId === playlist.id
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
                    
                    <button
                      onClick={() => handleSelectPlaylist(playlist.id, playlist.name)}
                      disabled={isSaving || config.activePlaylistId === playlist.id}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        isSaving || config.activePlaylistId === playlist.id
                          ? 'cursor-not-allowed opacity-50'
                          : isDarkMode
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      {config.activePlaylistId === playlist.id ? 'Aktiv' : 'Auswählen'}
                    </button>
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
              <p className="text-xs mt-1">
                Stelle sicher, dass die API-Zugangsdaten korrekt sind
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper components
const Eye: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);