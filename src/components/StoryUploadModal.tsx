import React, { useState, useRef } from 'react';
import { X, Camera, Image, Video, AlertCircle } from 'lucide-react';
import { VideoRecorder } from './VideoRecorder';

interface StoryUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  isDarkMode: boolean;
}

export const StoryUploadModal: React.FC<StoryUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  isDarkMode
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Log file info for debugging
    const fileSizeKB = (file.size / 1024).toFixed(1);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    console.log(`📤 Story Upload Debug:`);
    console.log(`   📁 Name: ${file.name}`);
    console.log(`   📊 Größe: ${file.size} bytes (${fileSizeKB} KB / ${fileSizeMB} MB)`);
    console.log(`   📁 Typ: ${file.type}`);
    console.log(`   📅 Letzte Änderung: ${new Date(file.lastModified).toISOString()}`);

    // Validate file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      const errorMsg = `❌ Ungültiger Dateityp: ${file.type}\n\n✅ Erlaubt: Bilder (JPG, PNG, GIF) und Videos (MP4, WebM, MOV)`;
      setUploadError(errorMsg);
      alert(errorMsg);
      return;
    }

    // Validate file size (max 100MB for stories - reduced from 200MB)
    const maxSize = 100 * 1024 * 1024; // 100MB in bytes
    if (file.size > maxSize) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const errorMsg = `📁 Datei ist zu groß (${fileSizeMB}MB)\n\n⚠️ Maximum für Stories: 100MB\n\n💡 Tipp: Komprimiere das Bild/Video oder wähle eine kleinere Datei.`;
      setUploadError(errorMsg);
      alert(errorMsg);
      return;
    }

    // Show warning for large files
    if (file.size > 20 * 1024 * 1024) { // 20MB+
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const proceed = window.confirm(`📁 Große Datei erkannt (${fileSizeMB}MB)\n\n⏳ Upload kann länger dauern.\n\n✅ Trotzdem hochladen?`);
      if (!proceed) return;
    }

    setIsUploading(true);
    console.log(`🚀 Starting story upload process...`);
    
    try {
      await onUpload(file);
      console.log(`✅ Story upload completed successfully!`);
      onClose();
    } catch (error) {
      console.error('❌ Story upload error:', error);
      
      let errorMessage = 'Unbekannter Fehler beim Hochladen der Story.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // More specific error handling
      if (errorMessage.includes('storage/unauthorized')) {
        errorMessage = '🔒 Keine Berechtigung zum Hochladen.\n\n💡 Versuche die Seite neu zu laden.';
      } else if (errorMessage.includes('storage/quota-exceeded')) {
        errorMessage = '💾 Speicherplatz voll.\n\n📞 Bitte kontaktiere Kristin oder Maurizio.';
      } else if (errorMessage.includes('storage/canceled')) {
        errorMessage = '⏹️ Upload wurde abgebrochen.\n\n🔄 Versuche es erneut.';
      } else if (errorMessage.includes('network')) {
        errorMessage = '📶 Netzwerkfehler.\n\n💡 Prüfe deine Internetverbindung und versuche es erneut.';
      } else if (errorMessage.includes('Firebase')) {
        errorMessage = '☁️ Server-Fehler.\n\n⏳ Versuche es in wenigen Sekunden erneut.';
      }
      
      setUploadError(errorMessage);
      alert(`❌ Fehler beim Hochladen der Story:\n\n${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleVideoRecorded = async (videoBlob: Blob) => {
    setShowVideoRecorder(false);
    setUploadError(null);
    setIsUploading(true);
    
    try {
      // Convert blob to file for upload
      const file = new File([videoBlob], `story-${Date.now()}.webm`, { type: 'video/webm' });
      
      // Log video info for debugging
      const fileSizeKB = (file.size / 1024).toFixed(1);
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      console.log(`📤 Story Video Upload Debug:`);
      console.log(`   📁 Name: ${file.name}`);
      console.log(`   📊 Größe: ${file.size} bytes (${fileSizeKB} KB / ${fileSizeMB} MB)`);
      console.log(`   📁 Typ: ${file.type}`);
      
      await onUpload(file);
      onClose();
    } catch (error) {
      console.error('Story video upload error:', error);
      
      let errorMessage = 'Unbekannter Fehler beim Hochladen des Videos.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setUploadError(errorMessage);
      alert(`❌ Fehler beim Hochladen des Videos:\n\n${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className={`rounded-2xl p-6 max-w-sm w-full transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-semibold transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              ⚡ Story hinzufügen
            </h3>
            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-colors duration-300 ${
                isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className={`mb-6 p-4 rounded-xl transition-colors duration-300 ${
            isDarkMode ? 'bg-blue-900/20 border border-blue-700/30' : 'bg-blue-50 border border-blue-200'
          }`}>
            <h4 className={`font-semibold mb-2 transition-colors duration-300 ${
              isDarkMode ? 'text-blue-300' : 'text-blue-800'
            }`}>
              ⚡ Stories verschwinden nach 24h
            </h4>
            <p className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-blue-200' : 'text-blue-700'
            }`}>
              Perfekt für spontane Momente während der Hochzeit!
            </p>
            <div className={`text-xs mt-3 space-y-1 transition-colors duration-300 ${
              isDarkMode ? 'text-blue-300' : 'text-blue-600'
            }`}>
              <div className="flex items-center gap-2">
                <span>📁</span>
                <span>Max. Dateigröße: 100MB</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🎥</span>
                <span>Live-Aufnahme: max. 10 Sekunden</span>
              </div>
              <div className="flex items-center gap-2">
                <span>📱</span>
                <span>Unterstützt: JPG, PNG, MP4, WebM</span>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {uploadError && (
            <div className={`mb-4 p-3 rounded-xl border transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-red-900/20 border-red-700/30 text-red-300' 
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-semibold mb-1">Upload-Fehler:</div>
                  <div className="whitespace-pre-line">{uploadError}</div>
                </div>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="space-y-3">
            {/* Gallery Upload */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-300 ${
                isUploading
                  ? isDarkMode
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 border border-gray-600' 
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <div className={`p-3 rounded-full transition-colors duration-300 ${
                isDarkMode ? 'bg-blue-600' : 'bg-blue-500'
              }`}>
                <Image className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <h4 className={`font-semibold transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  📸 Foto oder Video
                </h4>
                <p className={`text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Aus der Galerie auswählen (max. 100MB)
                </p>
              </div>
            </button>

            {/* Live Camera Recording */}
            <button
              onClick={() => setShowVideoRecorder(true)}
              disabled={isUploading}
              className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-300 ${
                isUploading
                  ? isDarkMode
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 border border-gray-600' 
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <div className={`p-3 rounded-full transition-colors duration-300 ${
                isDarkMode ? 'bg-red-600' : 'bg-red-500'
              }`}>
                <Video className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <h4 className={`font-semibold transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  🎥 Live aufnehmen
                </h4>
                <p className={`text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Direkt mit der Kamera (max. 10s)
                </p>
              </div>
            </button>
          </div>

          {isUploading && (
            <div className="mt-4 text-center">
              <div className="w-8 h-8 mx-auto border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Story wird hochgeladen...
              </p>
              <p className={`text-xs mt-1 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-500'
              }`}>
                Bei großen Dateien kann dies länger dauern
              </p>
            </div>
          )}

          <button
            onClick={onClose}
            disabled={isUploading}
            className={`w-full mt-4 py-3 px-4 rounded-xl transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' 
                : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
            }`}
          >
            Abbrechen
          </button>
        </div>
      </div>

      {/* Video Recorder for Stories */}
      {showVideoRecorder && (
        <VideoRecorder
          onVideoRecorded={handleVideoRecorded}
          onClose={() => setShowVideoRecorder(false)}
          isDarkMode={isDarkMode}
          maxDuration={10} // 10 seconds for stories
        />
      )}
    </>
  );
};