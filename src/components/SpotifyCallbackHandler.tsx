import React, { useEffect, useState } from 'react';
import { Music, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { handleCallbackIfPresent, SpotifyAuthError, SpotifyAPIError } from '../services/spotifyAuthService';

interface SpotifyCallbackHandlerProps {
  isDarkMode: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const SpotifyCallbackHandler: React.FC<SpotifyCallbackHandlerProps> = ({
  isDarkMode,
  onSuccess,
  onError
}) => {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Verarbeite Spotify-Authentifizierung...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setStatus('processing');
        setMessage('Verarbeite Spotify-Authentifizierung...');

        const success = await handleCallbackIfPresent();
        
        if (success) {
          setStatus('success');
          setMessage('Spotify erfolgreich verbunden! Du wirst weitergeleitet...');
          
          // Redirect after success
          setTimeout(() => {
            onSuccess?.();
            window.location.href = '/';
          }, 2000);
        } else {
          throw new Error('Kein gültiger Authentifizierungscode gefunden');
        }
        
      } catch (error) {
        console.error('❌ Spotify callback error:', error);
        
        let errorMessage = 'Unbekannter Fehler bei der Spotify-Authentifizierung';
        
        if (error instanceof SpotifyAuthError) {
          errorMessage = error.message;
        } else if (error instanceof SpotifyAPIError) {
          errorMessage = `Spotify API Fehler: ${error.message}`;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
        
        setStatus('error');
        setMessage(errorMessage);
        onError?.(errorMessage);
        
        // Redirect to main page after error
        setTimeout(() => {
          window.location.href = '/';
        }, 5000);
      }
    };

    handleCallback();
  }, [onSuccess, onError]);

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader className="w-8 h-8 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-8 h-8 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return isDarkMode ? 'text-blue-400' : 'text-blue-600';
      case 'success':
        return isDarkMode ? 'text-green-400' : 'text-green-600';
      case 'error':
        return isDarkMode ? 'text-red-400' : 'text-red-600';
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className={`max-w-md w-full text-center p-8 rounded-2xl transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-lg'
      }`}>
        {/* Spotify Logo */}
        <div className="mb-6">
          <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center transition-colors duration-300 ${
            isDarkMode ? 'bg-green-600' : 'bg-green-500'
          }`}>
            <Music className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Status Icon */}
        <div className="mb-4 flex justify-center">
          {getStatusIcon()}
        </div>

        {/* Status Message */}
        <h2 className={`text-xl font-semibold mb-4 transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Spotify Integration
        </h2>

        <p className={`text-base mb-6 transition-colors duration-300 ${getStatusColor()}`}>
          {message}
        </p>

        {/* Progress Indicator */}
        {status === 'processing' && (
          <div className={`w-full h-2 rounded-full overflow-hidden transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <div className="w-full h-full bg-gradient-to-r from-green-500 to-blue-500 animate-pulse"></div>
          </div>
        )}

        {/* Success Actions */}
        {status === 'success' && (
          <div className={`p-4 rounded-xl transition-colors duration-300 ${
            isDarkMode ? 'bg-green-900/20 border border-green-700/30' : 'bg-green-50 border border-green-200'
          }`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className={`font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-green-300' : 'text-green-800'
              }`}>
                Erfolgreich verbunden!
              </span>
            </div>
            <p className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-green-200' : 'text-green-700'
            }`}>
              Du kannst jetzt Songs zur Hochzeits-Playlist hinzufügen
            </p>
          </div>
        )}

        {/* Error Actions */}
        {status === 'error' && (
          <div className={`p-4 rounded-xl transition-colors duration-300 ${
            isDarkMode ? 'bg-red-900/20 border border-red-700/30' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className={`font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-red-300' : 'text-red-800'
              }`}>
                Verbindung fehlgeschlagen
              </span>
            </div>
            <p className={`text-sm mb-4 transition-colors duration-300 ${
              isDarkMode ? 'text-red-200' : 'text-red-700'
            }`}>
              Du wirst zur Hauptseite weitergeleitet...
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDarkMode 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              Jetzt zur Hauptseite
            </button>
          </div>
        )}

        {/* Footer */}
        <div className={`mt-6 text-xs transition-colors duration-300 ${
          isDarkMode ? 'text-gray-500' : 'text-gray-400'
        }`}>
          Sichere Authentifizierung mit Spotify PKCE
        </div>
      </div>
    </div>
  );
};