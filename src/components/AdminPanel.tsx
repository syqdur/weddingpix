import React, { useState } from 'react';
import { Lock, Unlock, Settings, Download, AlertTriangle, Power, PowerOff } from 'lucide-react';
import { MediaItem } from '../types';
import { downloadAllMedia } from '../services/downloadService';

interface AdminPanelProps {
  isDarkMode: boolean;
  isAdmin: boolean;
  onToggleAdmin: (isAdmin: boolean) => void;
  mediaItems?: MediaItem[];
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  isDarkMode, 
  isAdmin, 
  onToggleAdmin,
  mediaItems = []
}) => {
  const [showPinInput, setShowPinInput] = useState(false);
  const [pin, setPin] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDownloadWarning, setShowDownloadWarning] = useState(false);

  const correctPIN = "2407";

  const handleAdminToggle = () => {
    if (isAdmin) {
      onToggleAdmin(false);
    } else {
      setShowPinInput(true);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === correctPIN) {
      onToggleAdmin(true);
      setShowPinInput(false);
      setPin('');
    } else {
      alert('Falscher Code!');
      setPin('');
    }
  };

  const toggleUnderConstruction = () => {
    const currentStatus = localStorage.getItem('wedding_under_construction');
    const newStatus = currentStatus === 'false' ? 'true' : 'false';
    localStorage.setItem('wedding_under_construction', newStatus);
    
    if (newStatus === 'true') {
      alert('Under Construction aktiviert! Die Seite wird neu geladen.');
    } else {
      alert('Under Construction deaktiviert! Die Seite wird neu geladen.');
    }
    
    window.location.reload();
  };

  const permanentlyDisableUnderConstruction = () => {
    if (window.confirm('Under Construction permanent deaktivieren?\n\nDie Seite wird für alle Besucher dauerhaft verfügbar sein, bis du sie wieder manuell aktivierst.')) {
      localStorage.setItem('wedding_under_construction', 'false');
      localStorage.setItem('wedding_under_construction_permanent', 'true');
      alert('✅ Under Construction wurde permanent deaktiviert!\n\nDie Website ist jetzt dauerhaft für alle Besucher verfügbar.');
      window.location.reload();
    }
  };

  const handleDownloadAll = async () => {
    const downloadableItems = mediaItems.filter(item => item.type !== 'note');
    
    if (downloadableItems.length === 0) {
      alert('Keine Medien zum Herunterladen vorhanden.');
      return;
    }

    setShowDownloadWarning(true);
  };

  const confirmDownload = async () => {
    setShowDownloadWarning(false);
    setIsDownloading(true);
    
    try {
      await downloadAllMedia(mediaItems);
      
      const downloadableItems = mediaItems.filter(item => item.type !== 'note');
      alert(`✅ Download erfolgreich abgeschlossen!\n\n📊 Heruntergeladen:\n- ${mediaItems.filter(item => item.type === 'image').length} Bilder\n- ${mediaItems.filter(item => item.type === 'video').length} Videos\n- ${mediaItems.filter(item => item.type === 'note').length} Notizen\n\n💡 Tipp: Überprüfe die Übersichtsdatei in der ZIP für Details.`);
    } catch (error) {
      console.error('Download error:', error);
      
      // Check if it's a partial success
      if (error.toString().includes('teilweise erfolgreich')) {
        alert(`⚠️ ${error}\n\n💡 Die ZIP-Datei enthält:\n- Erfolgreich heruntergeladene Dateien\n- Fehlerbericht für nicht verfügbare Dateien\n- Detaillierte Anleitung zur Fehlerbehebung`);
      } else {
        alert(`❌ Fehler beim Herunterladen:\n${error}\n\n🔧 Lösungsvorschläge:\n- Versuche es mit einem anderen Browser\n- Überprüfe deine Internetverbindung\n- Deaktiviere temporär Adblocker\n- Verwende den Inkognito-Modus`);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const isUnderConstructionActive = () => {
    const status = localStorage.getItem('wedding_under_construction');
    return status !== 'false';
  };

  const isPermanentlyDisabled = () => {
    return localStorage.getItem('wedding_under_construction_permanent') === 'true';
  };

  const getDownloadButtonText = () => {
    const imageCount = mediaItems.filter(item => item.type === 'image').length;
    const videoCount = mediaItems.filter(item => item.type === 'video').length;
    const noteCount = mediaItems.filter(item => item.type === 'note').length;
    
    if (mediaItems.length === 0) return 'Keine Medien';
    
    const parts = [];
    if (imageCount > 0) parts.push(`${imageCount} Bild${imageCount > 1 ? 'er' : ''}`);
    if (videoCount > 0) parts.push(`${videoCount} Video${videoCount > 1 ? 's' : ''}`);
    if (noteCount > 0) parts.push(`${noteCount} Notiz${noteCount > 1 ? 'en' : ''}`);
    
    return parts.join(', ') + ' als ZIP herunterladen';
  };

  return (
    <>
      <button
        onClick={handleAdminToggle}
        className={`fixed bottom-4 left-4 p-3 rounded-full shadow-lg transition-colors duration-300 ${
          isDarkMode
            ? isAdmin
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            : isAdmin
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
        }`}
        title={isAdmin ? "Admin-Modus verlassen" : "Admin-Modus"}
      >
        {isAdmin ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
      </button>

      {/* Admin Controls */}
      {isAdmin && (
        <div className="fixed bottom-20 left-4 space-y-2">
          <button
            onClick={toggleUnderConstruction}
            className={`p-3 rounded-full shadow-lg transition-colors duration-300 ${
              isUnderConstructionActive()
                ? isDarkMode
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
                : isDarkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
            title={isUnderConstructionActive() ? "Under Construction deaktivieren" : "Under Construction aktivieren"}
          >
            <Settings className="w-6 h-6" />
          </button>

          {/* Permanent Under Construction Toggle */}
          <button
            onClick={permanentlyDisableUnderConstruction}
            className={`p-3 rounded-full shadow-lg transition-all duration-300 ${
              isPermanentlyDisabled()
                ? isDarkMode
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
                : isDarkMode
                  ? 'bg-orange-600 hover:bg-orange-700 text-white hover:scale-110'
                  : 'bg-orange-500 hover:bg-orange-600 text-white hover:scale-110'
            }`}
            title={isPermanentlyDisabled() ? "Under Construction ist permanent deaktiviert" : "Under Construction permanent deaktivieren"}
          >
            {isPermanentlyDisabled() ? <Power className="w-6 h-6" /> : <PowerOff className="w-6 h-6" />}
          </button>
          
          <button
            onClick={handleDownloadAll}
            disabled={isDownloading || mediaItems.length === 0}
            className={`p-3 rounded-full shadow-lg transition-all duration-300 ${
              isDownloading || mediaItems.length === 0
                ? isDarkMode
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : isDarkMode
                  ? 'bg-purple-600 hover:bg-purple-700 text-white hover:scale-110'
                  : 'bg-purple-500 hover:bg-purple-600 text-white hover:scale-110'
            }`}
            title={getDownloadButtonText()}
          >
            <Download className={`w-6 h-6 ${isDownloading ? 'animate-bounce' : ''}`} />
          </button>
        </div>
      )}

      {showPinInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl p-6 max-w-sm w-full transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Admin-Code eingeben
            </h3>
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="PIN eingeben..."
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPinInput(false);
                    setPin('');
                  }}
                  className={`flex-1 py-2 px-4 rounded-xl transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' 
                      : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                  }`}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded-xl transition-colors"
                >
                  Bestätigen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Download Warning Modal */}
      {showDownloadWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl p-6 max-w-md w-full transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
              <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Medien herunterladen
              </h3>
            </div>
            
            <div className={`mb-6 space-y-3 text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              <p>
                <strong>Was wird heruntergeladen:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>{mediaItems.filter(item => item.type === 'image').length} Bilder</li>
                <li>{mediaItems.filter(item => item.type === 'video').length} Videos</li>
                <li>{mediaItems.filter(item => item.type === 'note').length} Notizen (als Textdatei)</li>
              </ul>
              
              <div className={`p-3 rounded-lg mt-4 transition-colors duration-300 ${
                isDarkMode ? 'bg-yellow-900/30 border border-yellow-700/50' : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <p className="text-xs">
                  <strong>⚠️ Wichtiger Hinweis:</strong><br/>
                  Der Download kann mehrere Minuten dauern. Einige Dateien könnten aufgrund von Browser-Sicherheitsrichtlinien nicht heruntergeladen werden können. In diesem Fall erhältst du eine detaillierte Fehlermeldung mit Lösungsvorschlägen.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDownloadWarning(false)}
                className={`flex-1 py-3 px-4 rounded-xl transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' 
                    : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                }`}
              >
                Abbrechen
              </button>
              <button
                onClick={confirmDownload}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-xl transition-colors"
              >
                Download starten
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};