import React, { useState, useEffect } from 'react';
import { Music, RefreshCw, Lock, CheckCircle, AlertCircle, Loader, ExternalLink } from 'lucide-react';
import { spotifyAuth, SpotifyAuthState } from '../../services/spotifyAuthService';

interface SpotifyAuthSetupProps {
  isDarkMode: boolean;
  onAuthSuccess?: () => void;
}

export const SpotifyAuthSetup: React.FC<SpotifyAuthSetupProps> = ({ 
  isDarkMode,
  onAuthSuccess
}) => {
  const [authState, setAuthState] = useState<SpotifyAuthState>({
    isAuthenticated: false,
    user: null,
    expiresAt: null,
    lastRefresh: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = spotifyAuth.onAuthStateChange(setAuthState);
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await spotifyAuth.initiateAuth();
    } catch (error) {
      console.error('Login failed:', error);
      setError(error instanceof Error ? error.message : 'Login fehlgeschlagen');
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await spotifyAuth.logout();
      setError(null);
    } catch (error) {
      console.error('Logout failed:', error);
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

  // Call onAuthSuccess when authentication is successful
  useEffect(() => {
    if (authState.isAuthenticated && onAuthSuccess) {
      onAuthSuccess();
    }
  }, [authState.isAuthenticated, onAuthSuccess]);

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
            Spotify Admin-Authentifizierung
          </h3>
          
          <p className={`text-sm mb-6 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Verbinde dein Spotify-Konto für die Playlist-Verwaltung
          </p>

          {/* Security Features */}
          <div className={`mb-6 p-4 rounded-lg transition-colors duration-300 ${
            isDarkMode ? 'bg-blue-900/20 border border-blue-700/30' : 'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Lock className={`w-4 h-4 transition-colors duration-300 ${
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
        
        <div className="flex items-center gap-2">
          <a
            href="https://developer.spotify.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Spotify Developer Dashboard"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          
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
      </div>

      {/* Status Info */}
      <div className={`p-4 rounded-lg transition-colors duration-300 ${
        isDarkMode ? 'bg-green-900/20 border border-green-700/30' : 'bg-green-50 border border-green-200'
      }`}>
        <div className="flex items-center gap-3">
          <CheckCircle className={`w-5 h-5 transition-colors duration-300 ${
            isDarkMode ? 'text-green-400' : 'text-green-500'
          }`} />
          <div>
            <div className={`font-medium transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Spotify-Authentifizierung erfolgreich
            </div>
            <p className={`text-sm mt-1 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Du kannst jetzt die Spotify-Integration konfigurieren und Playlists verwalten
            </p>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="mt-4">
        <h5 className={`font-medium mb-3 transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Nächste Schritte:
        </h5>
        <ol className={`list-decimal list-inside space-y-2 text-sm transition-colors duration-300 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          <li>Konfiguriere die Spotify API-Zugangsdaten</li>
          <li>Wähle eine aktive Playlist für Musikwünsche aus</li>
          <li>Verwalte eingehende Musikwünsche</li>
        </ol>
      </div>
    </div>
  );
};

// Helper components
const User: React.FC<{ className?: string }> = ({ className }) => (
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
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LogOut: React.FC<{ className?: string }> = ({ className }) => (
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
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);