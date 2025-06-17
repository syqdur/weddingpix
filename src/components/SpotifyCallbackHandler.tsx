import React, { useEffect, useState } from 'react';
import { Music, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { processSpotifyCallback } from '../services/spotifyAuthService';

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

        const success = await processSpotifyCallback();
        
        if (success) {
          setStatus('success');
          setMessage('Spotify erfolgreich verbunden! Du wirst weitergeleitet...');
          
          // Redirect after success
          setTimeout(() => {
            onSuccess?.();
            window.location.href = '/';
          }, 2000);
        } else {
          throw new Error('Authentifizierung fehlgeschlagen');
        }
        
      } catch (error) {
        console.error('Spotify callback error:', error);
        
        setStatus('error');
        setMessage(`Fehler bei der Spotify-Authentifizierung: ${error.message || 'Unbekannter Fehler'}`);
        onError?.(error.message || 'Unbekannter Fehler');
        
        // Redirect to main page after error
        setTimeout(() => {
          window.location.href = '/';
        }, 5000);
      }
    };

    handleCallback();
  }, [onSuccess, onError]);

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className={`max-w-lg w-full text-center p-8 rounded-2xl transition-colors duration-300 ${
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
          {status === 'processing' && <Loader className="w-8 h-8 animate-spin text-blue-500" />}
          {status === 'success' && <CheckCircle className="w-8 h-8 text-green-500" />}
          {status === 'error' && <AlertCircle className="w-8 h-8 text-red-500" />}
        </div>

        {/* Status Message */}
        <h2 className={`text-xl font-semibold mb-4 transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Spotify Integration
        </h2>

        <p className={`text-base mb-6 transition-colors duration-300 ${
          status === 'processing' ? (isDarkMode ? 'text-blue-400' : 'text-blue-600') :
          status === 'success' ? (isDarkMode ? 'text-green-400' : 'text-green-600') :
          (isDarkMode ? 'text-red-400' : 'text-red-600')
        }`}>
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
      </div>
    </div>
  );
};