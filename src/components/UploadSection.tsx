import React, { useState } from 'react';
import { Plus, Camera, MessageSquare } from 'lucide-react';

interface UploadSectionProps {
  onUpload: (files: FileList) => Promise<void>;
  onNoteSubmit: (note: string) => Promise<void>;
  isUploading: boolean;
  progress: number;
  isDarkMode: boolean;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onUpload,
  onNoteSubmit,
  isUploading,
  progress,
  isDarkMode
}) => {
  const [files, setFiles] = useState<FileList | null>(null);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
    }
  };

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (noteText.trim()) {
      await onNoteSubmit(noteText.trim());
      setNoteText('');
      setShowNoteInput(false);
    }
  };

  return (
    <div className={`p-4 border-b transition-colors duration-300 ${
      isDarkMode ? 'border-gray-700' : 'border-gray-100'
    }`}>
      <div className="flex items-center gap-4">
        <div className={`w-16 h-16 border-2 border-dashed rounded-lg flex items-center justify-center relative overflow-hidden transition-colors duration-300 ${
          isDarkMode ? 'border-gray-600' : 'border-gray-300'
        }`}>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Plus className={`w-6 h-6 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`} />
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold text-sm mb-1 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Neuer Beitrag
          </h3>
          <p className={`text-xs transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Teile deine schönsten Momente von der Hochzeit
          </p>
          {progress > 0 && (
            <div className={`w-full h-1 rounded-full mt-2 overflow-hidden transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <div 
                className="bg-blue-500 h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Camera className={`w-5 h-5 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`} />
          <button
            onClick={() => setShowNoteInput(true)}
            disabled={isUploading}
            className={`p-2 rounded-full transition-all duration-300 ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
            }`}
            title="Notiz hinterlassen"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Note Input Modal */}
      {showNoteInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl p-6 max-w-md w-full transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              💌 Notiz hinterlassen
            </h3>
            <form onSubmit={handleNoteSubmit} className="space-y-4">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Hinterlasse eine schöne Nachricht für das Brautpaar..."
                rows={4}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none resize-none transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                autoFocus
                maxLength={500}
              />
              <div className={`text-xs text-right transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {noteText.length}/500
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowNoteInput(false);
                    setNoteText('');
                  }}
                  className={`flex-1 py-3 px-4 rounded-xl transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' 
                      : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                  }`}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={!noteText.trim()}
                  className="flex-1 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl transition-colors"
                >
                  Senden
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};