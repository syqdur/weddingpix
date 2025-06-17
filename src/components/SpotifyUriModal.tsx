import React, { useState, useRef } from 'react';
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
  const textRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const uris = [
    {
      name: 'Production (kristinundmauro.de)',
      uri: 'https://kristinundmauro.de/',
      description: 'Für die Live-Website (EMPFOHLEN)',
      recommended: true
    },
    {
      name: 'Production (Netlify Backup)',
      uri: 'https://kristinundmauro.netlify.app/',
      description: 'Backup URL falls die Hauptdomain nicht funktioniert'
    },
    {
      name: 'Lokale Entwicklung (FUNKTIONIERT NICHT)',
      uri: 'http://localhost:5173/',
      description: 'Funktioniert NICHT - Spotify blockiert localhost',
      disabled: true
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

  const handleTextClick = (uri: string) => {
    const textElement = textRefs.current[uri];
    if (textElement) {
      // Select all text in the element
      const range = document.createRange();
      range.selectNodeContents(textElement);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
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
          {/* Problem Explanation */}
          <div className={`p-4 rounded-xl mb-6 transition-colors duration-300 ${
            isDarkMode ? 'bg-red-900/20 border border-red-700/30' : 'bg-red-50 border border-red-200'
          }`}>
            <h4 className={`font-semibold mb-2 transition-colors duration-300 ${
              isDarkMode ? 'text-red-300' : 'text-red-800'
            }`}>
              ❌ Problem: "Invalid authorization code"
            </h4>
            <p className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-red-200' : 'text-red-700'
            }`}>
              Die Spotify-Integration funktioniert nicht, weil die Redirect URIs nicht exakt übereinstimmen.
            </p>
          </div>

          {/* Instructions */}
          <div className={`p-4 rounded-xl mb-6 transition-colors duration-300 ${
            isDarkMode ? 'bg-blue-900/20 border border-blue-700/30' : 'bg-blue-50 border border-blue-200'
          }`}>
            <h4 className={`font-semibold mb-2 transition-colors duration-300 ${
              isDarkMode ? 'text-blue-300' : 'text-blue-800'
            }`}>
              📋 Lösung - Schritt für Schritt:
            </h4>
            <ol className={`text-sm space-y-1 transition-colors duration-300 ${
              isDarkMode ? 'text-blue-200' : 'text-blue-700'
            }`}>
              <li>1. Gehe zu <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline">Spotify Developer Dashboard</a></li>
              <li>2. Öffne deine App "WeddingPix Musikwünsche"</li>
              <li>3. Klicke auf "Edit Settings"</li>
              <li>4. Scrolle zu "Redirect URIs"</li>
              <li>5. <strong>LÖSCHE alle vorhandenen URIs</strong></li>
              <li>6. Füge <strong>exakt</strong> die Production URI unten hinzu (mit / am Ende)</li>
              <li>7. Klicke "Save"</li>
              <li>8. Warte 5 Minuten und teste erneut</li>
            </ol>
          </div>

          {/* URIs */}
          <div className="space-y-4">
            {uris.map((item, index) => (
              <div key={index} className={`p-4 rounded-xl border transition-colors duration-300 ${
                item.disabled 
                  ? isDarkMode ? 'bg-red-900/20 border-red-700/30' : 'bg-red-50 border-red-200'
                  : item.recommended
                    ? isDarkMode ? 'bg-green-900/20 border-green-700/30' : 'bg-green-50 border-green-200'
                    : isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h5 className={`font-semibold transition-colors duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {item.name}
                    </h5>
                    {item.recommended && (
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold transition-colors duration-300 ${
                        isDarkMode ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'
                      }`}>
                        EMPFOHLEN
                      </span>
                    )}
                    {item.disabled && (
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold transition-colors duration-300 ${
                        isDarkMode ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800'
                      }`}>
                        NICHT VERWENDEN
                      </span>
                    )}
                  </div>
                  {!item.disabled && (
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
                  )}
                </div>
                
                <div 
                  ref={(el) => textRefs.current[item.uri] = el}
                  onClick={() => !item.disabled && handleTextClick(item.uri)}
                  className={`p-3 rounded-lg font-mono text-sm break-all transition-all duration-300 ${
                    item.disabled
                      ? 'cursor-not-allowed opacity-50'
                      : 'cursor-pointer select-all hover:ring-2 hover:ring-blue-500'
                  } ${
                    isDarkMode 
                      ? item.disabled
                        ? 'bg-gray-800 text-red-400'
                        : 'bg-gray-800 text-green-400 hover:bg-gray-750'
                      : item.disabled
                        ? 'bg-white text-red-700'
                        : 'bg-white text-green-700 hover:bg-gray-50'
                  }`}
                  title={item.disabled ? "Diese URI nicht verwenden!" : "Klicken zum Auswählen des Textes"}
                >
                  {item.uri}
                </div>
                
                <p className={`text-xs mt-2 transition-colors duration-300 ${
                  item.disabled
                    ? isDarkMode ? 'text-red-400' : 'text-red-600'
                    : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {item.description}
                  {!item.disabled && <span className="italic"> • Klicke auf die URI um sie auszuwählen</span>}
                </p>
              </div>
            ))}
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
              <li>• <strong>EXAKTE ÜBEREINSTIMMUNG:</strong> Die URI muss <strong>genau</strong> mit dem übereinstimmen, was in der App verwendet wird</li>
              <li>• <strong>SLASH AM ENDE:</strong> Achte auf den Slash (/) am Ende der URI - er ist wichtig!</li>
              <li>• <strong>HTTPS:</strong> Verwende nur die HTTPS-Version der URI</li>
              <li>• <strong>WARTEN:</strong> Nach dem Speichern dauert es ~5 Minuten bis die Änderungen aktiv sind</li>
              <li>• <strong>CACHE LEEREN:</strong> Leere den Browser-Cache oder verwende ein Inkognito-Fenster für Tests</li>
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