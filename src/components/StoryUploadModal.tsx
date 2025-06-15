import React, { useState, useRef } from 'react';
import { X, Camera, Image, Video } from 'lucide-react';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      alert('Bitte wähle ein Bild oder Video aus.');
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert('Datei ist zu groß. Maximum: 50MB');
      return;
    }

    setIsUploading(true);
    try {
      await onUpload(file);
      onClose();
    } catch (error) {
      console.error('Story upload error:', error);
      alert('Fehler beim Hochladen der Story. Bitte versuche es erneut.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
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
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="space-y-3">
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
              isDarkMode ? 'bg-pink-600' : 'bg-pink-500'
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
                Aus der Galerie auswählen
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
  );
};