import React, { useState } from 'react';
import { Download, FileText, Image, MessageSquare, Settings, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { MediaItem } from '../types';
import { generatePDFPhotobook } from '../services/pdfService';

interface PDFDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaItems: MediaItem[];
  isDarkMode: boolean;
}

interface PDFOptions {
  title: string;
  subtitle: string;
  includeNotes: boolean;
  layout: 'portrait' | 'landscape';
  quality: 'standard' | 'high';
}

export const PDFDownloadModal: React.FC<PDFDownloadModalProps> = ({
  isOpen,
  onClose,
  mediaItems,
  isDarkMode
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [options, setOptions] = useState<PDFOptions>({
    title: 'Kristin & Maurizio',
    subtitle: 'Unsere Hochzeit in Bildern\nDie schönsten Momente unseres besonderen Tages',
    includeNotes: true,
    layout: 'portrait',
    quality: 'high'
  });

  if (!isOpen) return null;

  const stats = {
    images: mediaItems.filter(item => item.type === 'image').length,
    videos: mediaItems.filter(item => item.type === 'video').length,
    notes: mediaItems.filter(item => item.type === 'note').length,
    total: mediaItems.length
  };

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    
    try {
      await generatePDFPhotobook(mediaItems, options);
      
      // Show success message
      alert(`✅ PDF-Fotobuch erfolgreich erstellt!\n\n📊 Inhalt:\n- Titelseite mit Hochzeitsdaten\n- Statistik-Übersicht\n- ${stats.images} Hochzeitsbilder\n${options.includeNotes ? `- ${stats.notes} Gästenachrichten\n` : ''}- Dankesseite\n\n💡 Das PDF wurde in deinen Downloads gespeichert.`);
      
      onClose();
    } catch (error) {
      console.error('PDF generation error:', error);
      alert(`❌ Fehler beim Erstellen des PDF-Fotobuchs:\n${error}\n\n🔧 Lösungsvorschläge:\n- Versuche es mit weniger Bildern\n- Wähle 'Standard' Qualität\n- Überprüfe deine Internetverbindung\n- Verwende einen anderen Browser`);
    } finally {
      setIsGenerating(false);
    }
  };

  const getEstimatedSize = () => {
    const baseSize = 2; // MB for cover, stats, notes pages
    const imageSize = stats.images * (options.quality === 'high' ? 0.8 : 0.4); // MB per image
    return Math.round(baseSize + imageSize);
  };

  const getEstimatedTime = () => {
    const baseTime = 10; // seconds for basic pages
    const imageTime = stats.images * (options.quality === 'high' ? 3 : 1.5); // seconds per image
    return Math.round((baseTime + imageTime) / 60) || 1; // minutes
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full transition-colors duration-300 ${
              isDarkMode ? 'bg-red-600' : 'bg-red-500'
            }`}>
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className={`text-xl font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                📖 PDF-Fotobuch erstellen
              </h3>
              <p className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Professionelles Hochzeitsfotobuch als PDF
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors duration-300 ${
              isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Overview */}
        <div className={`p-4 rounded-xl mb-6 transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-700/50 border border-gray-600' : 'bg-gray-50 border border-gray-200'
        }`}>
          <h4 className={`font-semibold mb-3 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            📊 Fotobuch-Inhalt:
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-blue-400' : 'text-blue-600'
              }`}>
                {stats.images}
              </div>
              <div className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                📸 Bilder
              </div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-green-400' : 'text-green-600'
              }`}>
                {stats.notes}
              </div>
              <div className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                💌 Notizen
              </div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-purple-400' : 'text-purple-600'
              }`}>
                ~{getEstimatedSize()}
              </div>
              <div className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                📁 MB
              </div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-orange-400' : 'text-orange-600'
              }`}>
                ~{getEstimatedTime()}
              </div>
              <div className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                ⏱️ Min
              </div>
            </div>
          </div>
        </div>

        {/* PDF Structure Preview */}
        <div className={`p-4 rounded-xl mb-6 transition-colors duration-300 ${
          isDarkMode ? 'bg-blue-900/20 border border-blue-700/30' : 'bg-blue-50 border border-blue-200'
        }`}>
          <h4 className={`font-semibold mb-3 flex items-center gap-2 transition-colors duration-300 ${
            isDarkMode ? 'text-blue-300' : 'text-blue-800'
          }`}>
            <FileText className="w-4 h-4" />
            📖 PDF-Struktur:
          </h4>
          
          <div className={`space-y-2 text-sm transition-colors duration-300 ${
            isDarkMode ? 'text-blue-200' : 'text-blue-700'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>1. Wunderschöne Titelseite mit Hochzeitsdaten</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>2. Detaillierte Statistik-Übersicht</span>
            </div>
            {options.includeNotes && stats.notes > 0 && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>3. Alle {stats.notes} Gästenachrichten</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>{options.includeNotes && stats.notes > 0 ? '4' : '3'}. {stats.images} Hochzeitsbilder (je eine Seite)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>{options.includeNotes && stats.notes > 0 ? '5' : '4'}. Dankesseite für alle Gäste</span>
            </div>
          </div>
        </div>

        {/* Basic Options */}
        <div className="space-y-4 mb-6">
          <div>
            <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              📝 Fotobuch-Titel:
            </label>
            <input
              type="text"
              value={options.title}
              onChange={(e) => setOptions(prev => ({ ...prev, title: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              📄 Untertitel:
            </label>
            <textarea
              value={options.subtitle}
              onChange={(e) => setOptions(prev => ({ ...prev, subtitle: e.target.value }))}
              rows={2}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="includeNotes"
              checked={options.includeNotes}
              onChange={(e) => setOptions(prev => ({ ...prev, includeNotes: e.target.checked }))}
              className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
            />
            <label htmlFor="includeNotes" className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              💌 Gästenachrichten einschließen ({stats.notes} verfügbar)
            </label>
          </div>
        </div>

        {/* Advanced Options */}
        <div className="mb-6">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-2 text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
            }`}
          >
            <Settings className="w-4 h-4" />
            Erweiterte Einstellungen {showAdvanced ? '▼' : '▶'}
          </button>

          {showAdvanced && (
            <div className={`mt-4 p-4 rounded-lg space-y-4 transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-700/30' : 'bg-gray-50'
            }`}>
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  📐 Layout:
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="layout"
                      value="portrait"
                      checked={options.layout === 'portrait'}
                      onChange={(e) => setOptions(prev => ({ ...prev, layout: e.target.value as 'portrait' | 'landscape' }))}
                      className="text-red-600"
                    />
                    <span className={`text-sm transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      📱 Hochformat
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="layout"
                      value="landscape"
                      checked={options.layout === 'landscape'}
                      onChange={(e) => setOptions(prev => ({ ...prev, layout: e.target.value as 'portrait' | 'landscape' }))}
                      className="text-red-600"
                    />
                    <span className={`text-sm transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      🖥️ Querformat
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  🎨 Bildqualität:
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="quality"
                      value="standard"
                      checked={options.quality === 'standard'}
                      onChange={(e) => setOptions(prev => ({ ...prev, quality: e.target.value as 'standard' | 'high' }))}
                      className="text-red-600"
                    />
                    <span className={`text-sm transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      ⚡ Standard (schneller)
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="quality"
                      value="high"
                      checked={options.quality === 'high'}
                      onChange={(e) => setOptions(prev => ({ ...prev, quality: e.target.value as 'standard' | 'high' }))}
                      className="text-red-600"
                    />
                    <span className={`text-sm transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      ✨ Hoch (bessere Qualität)
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Warning for large files */}
        {stats.images > 20 && (
          <div className={`p-4 rounded-lg mb-6 transition-colors duration-300 ${
            isDarkMode ? 'bg-yellow-900/30 border border-yellow-700/50' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className={`font-semibold text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-yellow-300' : 'text-yellow-800'
                }`}>
                  ⚠️ Großes Fotobuch
                </h4>
                <p className={`text-sm mt-1 transition-colors duration-300 ${
                  isDarkMode ? 'text-yellow-200' : 'text-yellow-700'
                }`}>
                  Mit {stats.images} Bildern wird das PDF etwa {getEstimatedSize()} MB groß und benötigt ca. {getEstimatedTime()} Minuten zum Erstellen. 
                  Für schnellere Erstellung wähle "Standard" Qualität.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className={`flex-1 py-3 px-4 rounded-xl transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' 
                : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
            }`}
          >
            Abbrechen
          </button>
          <button
            onClick={handleGeneratePDF}
            disabled={isGenerating || stats.images === 0}
            className={`flex-1 py-3 px-4 rounded-xl transition-all duration-300 ${
              isGenerating || stats.images === 0
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white hover:scale-105'
            }`}
          >
            {isGenerating ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                PDF wird erstellt...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                📖 Fotobuch erstellen
              </div>
            )}
          </button>
        </div>

        {/* Generation Progress */}
        {isGenerating && (
          <div className={`mt-4 p-4 rounded-lg transition-colors duration-300 ${
            isDarkMode ? 'bg-blue-900/20 border border-blue-700/30' : 'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className={`font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-blue-300' : 'text-blue-800'
              }`}>
                PDF-Fotobuch wird erstellt...
              </span>
            </div>
            <p className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-blue-200' : 'text-blue-700'
            }`}>
              Bitte warten Sie, während Ihr persönliches Hochzeitsfotobuch zusammengestellt wird. 
              Dies kann einige Minuten dauern.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};