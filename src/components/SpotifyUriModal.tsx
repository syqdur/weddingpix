import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Settings } from 'lucide-react';

interface SpotifyUriModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

export const SpotifyUriModal: React.FC<SpotifyUriModalProps> = ({
  isOpen,
  onClose,
  isDarkMode
}) => {
  const [copiedUri, setCopiedUri] = useState<string | null>(null);

  const uris = [
    {
      name: 'Lokale Entwicklung',
      uri: 'http://localhost:5173/',
      description: 'Für Tests auf deinem Computer'
    },
    {
      name: 'Production (Netlify)',
      uri: 'https://kristinundmauro.netlify.app/',
      description: 'Für die Live-Website'
    },
    {
      name: 'Production (Custom Domain)',
      uri: 'https://kristinundmauro.de/',
      description: 'Falls du eine eigene Domain hast'
    }
  ];

  const handleCopy = async (uri: string) => {
    try {
      await navigator.clipboard.writeText(uri);
      setCopiedUri(uri);
      setTimeout(() => setCopiedUri(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      // Fallback: Select text
      const textArea = document.createElement('textarea');
      textArea.value = uri;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedUri(uri);
      setTimeout(() => setCopiedUri(null), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-300 ${
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
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className={`text-xl font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                🔗 Spotify Redirect URIs
              </h3>
              <p className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Kopiere diese URIs in deine Spotify App
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

        <div className="p-6">
          {/* Instructions */}
          <div className={`p-4 rounded-xl mb-6 transition-colors duration-300 ${
            isDarkMode ? 'bg-blue-900/20 border border-blue-700/30' : 'bg-blue-50 border border-blue-200'
          }`}>
            <h4 className={`font-semibold mb-2 transition-colors duration-300 ${
              isDarkMode ? 'text-blue-300' : 'text-blue-800'
            }`}>
              📋 Anleitung:
            </h4>
            <ol className={`text-sm space-y-1 transition-colors duration-300 ${
              isDarkMode ? 'text-blue-200' : 'text-blue-700'
            }`}>
              <li>1. Gehe zu <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline">Spotify Developer Dashboard</a></li>
              <li>2. Öffne deine App "WeddingPix Musikwünsche"</li>
              <li>3. Klicke auf "Edit Settings"</li>
              <li>4. Scrolle zu "Redirect URIs"</li>
              <li>5. Kopiere die URIs unten und füge sie hinzu</li>
              <li>6. Klicke "Save"</li>
            </ol>
          </div>

          {/* URIs */}
          <div className="space-y-4">
            {uris.map((item, index) => (
              <div key={index} className={`p-4 rounded-xl border transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h5 className={`font-semibold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {item.name}
                  </h5>
                  <button
                    onClick={() => handleCopy(item.uri)}
                    className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-all duration-300 ${
                      copiedUri === item.uri
                        ? 'bg-green-600 text-white'
                        : isDarkMode
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    {copiedUri === item.uri ? (
                      <>
                        <Check className="w-4 h-4" />
                        Kopiert!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Kopieren
                      </>
                    )}
                  </button>
                </div>
                
                <div className={`p-3 rounded-lg font-mono text-sm break-all transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-800 text-green-400' : 'bg-white text-green-700'
                }`}>
                  {item.uri}
                </div>
                
                <p className={`text-xs mt-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          {/* Playlist Info */}
          <div className={`mt-6 p-4 rounded-xl transition-colors duration-300 ${
            isDarkMode ? 'bg-pink-900/20 border border-pink-700/30' : 'bg-pink-50 border border-pink-200'
          }`}>
            <h4 className={`font-semibold mb-2 transition-colors duration-300 ${
              isDarkMode ? 'text-pink-300' : 'text-pink-800'
            }`}>
              🎵 Deine Hochzeits-Playlist:
            </h4>
            
            <div className="flex items-center justify-between">
              <div className={`font-mono text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-pink-200' : 'text-pink-700'
              }`}>
                https://open.spotify.com/playlist/5IkTeF1ydIrwQ4VZxkCtdO
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopy('https://open.spotify.com/playlist/5IkTeF1ydIrwQ4VZxkCtdO')}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode ? 'bg-pink-600 hover:bg-pink-700' : 'bg-pink-500 hover:bg-pink-600'
                  } text-white`}
                >
                  <Copy className="w-4 h-4" />
                </button>
                <a
                  href="https://open.spotify.com/playlist/5IkTeF1ydIrwQ4VZxkCtdO"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode ? 'bg-pink-600 hover:bg-pink-700' : 'bg-pink-500 hover:bg-pink-600'
                  } text-white`}
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className={`mt-6 p-4 rounded-xl transition-colors duration-300 ${
            isDarkMode ? 'bg-yellow-900/20 border border-yellow-700/30' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <h4 className={`font-semibold mb-2 transition-colors duration-300 ${
              isDarkMode ? 'text-yellow-300' : 'text-yellow-800'
            }`}>
              ⚠️ Wichtige Hinweise:
            </h4>
            <ul className={`text-sm space-y-1 transition-colors duration-300 ${
              isDarkMode ? 'text-yellow-200' : 'text-yellow-700'
            }`}>
              <li>• Die URIs müssen EXAKT so eingetragen werden (mit / am Ende)</li>
              <li>• Du kannst alle URIs gleichzeitig hinzufügen</li>
              <li>• Nach dem Speichern dauert es ~5 Minuten bis die Änderungen aktiv sind</li>
              <li>• Teste zuerst mit der localhost URI</li>
            </ul>
          </div>

          {/* Close Button */}
          <div className="mt-6 text-center">
            <button
              onClick={onClose}
              className={`py-3 px-6 rounded-xl transition-colors duration-300 ${
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
    </div>
  );
};