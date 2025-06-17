import React, { useEffect, useState } from 'react';
import { Music, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { exchangeCodeForTokens } from '../services/spotifyService';

interface SpotifyCallbackProps {
  isDarkMode: boolean;
}

export const SpotifyCallback: React.FC<SpotifyCallbackProps> = ({ isDarkMode }) => {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing Spotify authentication...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get code and state from URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        
        if (error) {
          setStatus('error');
          setMessage(`Spotify authentication failed: ${error}`);
          return;
        }
        
        if (!code || !state) {
          setStatus('error');
          setMessage('Invalid callback parameters');
          return;
        }
        
        // Exchange code for tokens
        await exchangeCodeForTokens(code, state);
        
        setStatus('success');
        setMessage('Spotify connected successfully! Redirecting...');
        
        // Redirect after success
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } catch (error) {
        console.error('Spotify callback error:', error);
        
        setStatus('error');
        setMessage(`Authentication failed: ${error.message || 'Unknown error'}`);
        setError(error.message || 'Unknown error');
        
        // Redirect after error
        setTimeout(() => {
          window.location.href = '/';
        }, 5000);
      }
    };

    handleCallback();
  }, []);

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

        {/* Error Details */}
        {status === 'error' && error && (
          <div className={`mb-6 p-4 rounded-xl text-left transition-colors duration-300 ${
            isDarkMode ? 'bg-red-900/20 border border-red-700/30' : 'bg-red-50 border border-red-200'
          }`}>
            <h4 className={`font-semibold mb-2 transition-colors duration-300 ${
              isDarkMode ? 'text-red-300' : 'text-red-800'
            }`}>
              Error details:
            </h4>
            <p className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-red-200' : 'text-red-700'
            }`}>
              {error}
            </p>
          </div>
        )}

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