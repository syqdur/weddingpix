import React, { useState, useRef, useEffect } from 'react';
import { X, Calendar, Upload, Trash2, Image, Video, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { TimelineEvent } from '../types';
import { addTimelineEvent, updateTimelineEvent, deleteTimelineEvent } from '../services/timelineService';

interface TimelineEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: TimelineEvent | null; // null for new event, TimelineEvent for editing
  onSuccess: (message: string) => void;
  isDarkMode: boolean;
  userName: string;
}

export const TimelineEventModal: React.FC<TimelineEventModalProps> = ({
  isOpen,
  onClose,
  event,
  onSuccess,
  isDarkMode,
  userName
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize form with event data when editing
  useEffect(() => {
    if (event) {
      setTitle(event.title);
      // Format date for input (YYYY-MM-DD)
      const eventDate = new Date(event.date);
      setDate(eventDate.toISOString().split('T')[0]);
      setDescription(event.description);
      setPreviewUrl(event.imageUrl || null);
    } else {
      // Default values for new event
      setTitle('');
      setDate('');
      setDescription('');
      setImageFile(null);
      setPreviewUrl(null);
    }
    
    // Reset states
    setError(null);
    setShowDeleteConfirm(false);
    setIsSubmitting(false);
    setIsDeleting(false);
  }, [event, isOpen]);
  
  // Clean up preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, []);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setError('Bitte wähle ein Bild oder Video aus.');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Die Datei ist zu groß. Maximale Größe: 10MB.');
      return;
    }
    
    setImageFile(file);
    
    // Create preview URL
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    
    const newPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(newPreviewUrl);
    setError(null);
  };
  
  const handleRemoveImage = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setImageFile(null);
    setPreviewUrl(null);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !date || !description.trim()) {
      setError('Bitte fülle alle Pflichtfelder aus.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const mediaType = imageFile?.type.startsWith('video/') ? 'video' : 'image';
      
      if (event) {
        // Update existing event
        await updateTimelineEvent(
          event.id,
          {
            title,
            date: new Date(date).toISOString(),
            description,
            mediaType: imageFile ? mediaType : event.mediaType,
            // Only include imageUrl if we're not uploading a new file and there's an existing URL
            ...((!imageFile && event.imageUrl) ? { imageUrl: event.imageUrl } : {})
          },
          imageFile || undefined
        );
        
        onSuccess('Ereignis erfolgreich aktualisiert!');
      } else {
        // Add new event
        await addTimelineEvent(
          {
            title,
            date: new Date(date).toISOString(),
            description,
            mediaType: imageFile ? mediaType : undefined,
            uploadedBy: userName
          },
          imageFile || undefined
        );
        
        onSuccess('Ereignis erfolgreich hinzugefügt!');
      }
    } catch (error) {
      console.error('Error submitting timeline event:', error);
      setError(`Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async () => {
    if (!event) return;
    
    setIsDeleting(true);
    setError(null);
    
    try {
      await deleteTimelineEvent(event.id);
      onSuccess('Ereignis erfolgreich gelöscht!');
    } catch (error) {
      console.error('Error deleting timeline event:', error);
      setError(`Fehler beim Löschen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b transition-colors duration-300 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full transition-colors duration-300 ${
              isDarkMode ? 'bg-pink-600' : 'bg-pink-500'
            }`}>
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className={`text-xl font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {event ? 'Ereignis bearbeiten' : 'Neues Ereignis hinzufügen'}
              </h3>
              <p className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {event ? 'Aktualisiere die Details dieses Ereignisses' : 'Füge einen neuen Meilenstein zur Timeline hinzu'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting || isDeleting}
            className={`p-2 rounded-full transition-colors duration-300 ${
              (isSubmitting || isDeleting)
                ? 'cursor-not-allowed opacity-50'
                : isDarkMode 
                  ? 'hover:bg-gray-700 text-gray-400' 
                  : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error Message */}
          {error && (
            <div className={`mb-6 p-4 rounded-xl border transition-colors duration-300 ${
              isDarkMode ? 'bg-red-900/20 border-red-700/30' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                <AlertCircle className={`w-5 h-5 transition-colors duration-300 ${
                  isDarkMode ? 'text-red-400' : 'text-red-600'
                }`} />
                <p className={`text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-red-300' : 'text-red-700'
                }`}>
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className={`mb-6 p-4 rounded-xl border transition-colors duration-300 ${
              isDarkMode ? 'bg-yellow-900/20 border-yellow-700/30' : 'bg-yellow-50 border-yellow-200'
            }`}>
              <h4 className={`font-semibold mb-2 transition-colors duration-300 ${
                isDarkMode ? 'text-yellow-300' : 'text-yellow-800'
              }`}>
                Ereignis wirklich löschen?
              </h4>
              <p className={`text-sm mb-4 transition-colors duration-300 ${
                isDarkMode ? 'text-yellow-200' : 'text-yellow-700'
              }`}>
                Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors duration-300 ${
                    isDeleting
                      ? 'cursor-not-allowed opacity-50'
                      : isDarkMode 
                        ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                        : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                  }`}
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors duration-300 ${
                    isDeleting
                      ? 'cursor-not-allowed opacity-50'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {isDeleting ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Löschen...</span>
                    </div>
                  ) : (
                    'Ja, löschen'
                  )}
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Titel*
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="z.B. Unser erstes Date"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                required
              />
            </div>

            {/* Date */}
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Datum*
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Beschreibung*
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Beschreibe diesen besonderen Moment..."
                rows={4}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none resize-none transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                required
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Bild oder Video (optional)
              </label>
              
              {previewUrl ? (
                <div className="relative rounded-xl overflow-hidden border transition-colors duration-300">
                  {imageFile?.type.startsWith('video/') || (event?.mediaType === 'video' && !imageFile) ? (
                    <video 
                      src={previewUrl} 
                      className="w-full h-48 object-cover"
                      controls
                    />
                  ) : (
                    <img 
                      src={previewUrl} 
                      alt="Vorschau" 
                      className="w-full h-48 object-cover"
                    />
                  )}
                  
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-1 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
                    title="Bild entfernen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors duration-300 ${
                    isDarkMode 
                      ? 'border-gray-600 hover:border-gray-500 text-gray-400' 
                      : 'border-gray-300 hover:border-gray-400 text-gray-500'
                  }`}
                >
                  <Upload className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Klicke zum Hochladen oder ziehe eine Datei hierher</p>
                  <p className="text-xs mt-1 opacity-70">JPG, PNG, GIF oder MP4 (max. 10MB)</p>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {event && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isSubmitting || isDeleting}
                  className={`px-4 py-3 rounded-xl text-sm transition-colors duration-300 ${
                    (isSubmitting || isDeleting)
                      ? 'cursor-not-allowed opacity-50'
                      : isDarkMode 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  <Trash2 className="w-4 h-4 inline-block mr-2" />
                  Löschen
                </button>
              )}
              
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting || isDeleting}
                className={`flex-1 px-4 py-3 rounded-xl text-sm transition-colors duration-300 ${
                  (isSubmitting || isDeleting)
                    ? 'cursor-not-allowed opacity-50'
                    : isDarkMode 
                      ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' 
                      : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                }`}
              >
                Abbrechen
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting || isDeleting}
                className={`flex-1 px-4 py-3 rounded-xl text-sm transition-colors duration-300 ${
                  (isSubmitting || isDeleting)
                    ? 'cursor-not-allowed opacity-50'
                    : isDarkMode 
                      ? 'bg-pink-600 hover:bg-pink-700 text-white' 
                      : 'bg-pink-500 hover:bg-pink-600 text-white'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>{event ? 'Aktualisieren...' : 'Hinzufügen...'}</span>
                  </div>
                ) : (
                  event ? 'Aktualisieren' : 'Hinzufügen'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};