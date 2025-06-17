import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Heart, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Save, 
  Image as ImageIcon,
  Camera
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';

interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
  imageUrl?: string;
  mediaType: 'image' | 'none'; // Ensure this is always defined
  createdAt: string;
  order: number;
}

interface WeddingTimelineProps {
  isAdmin: boolean;
  isDarkMode: boolean;
}

export const WeddingTimeline: React.FC<WeddingTimelineProps> = ({ isAdmin, isDarkMode }) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Load timeline events
  useEffect(() => {
    const q = query(collection(db, 'weddingTimeline'), orderBy('order', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const timelineEvents = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as TimelineEvent[];
        
        setEvents(timelineEvents);
        setIsLoading(false);
        setError(null);
      } catch (err) {
        console.error('Error loading timeline events:', err);
        setError('Fehler beim Laden der Zeitleiste');
        setIsLoading(false);
      }
    }, (err) => {
      console.error('Timeline snapshot error:', err);
      setError('Fehler beim Laden der Zeitleiste');
      setIsLoading(false);
    });
    
    return unsubscribe;
  }, []);
  
  // Reset form
  const resetForm = () => {
    setTitle('');
    setDate('');
    setTime('');
    setLocation('');
    setDescription('');
    setImageFile(null);
  };
  
  // Add event
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !date) {
      alert('Bitte gib mindestens einen Titel und ein Datum ein.');
      return;
    }
    
    setIsUploading(true);
    
    try {
      let imageUrl = '';
      let mediaType: 'image' | 'none' = 'none'; // Default to 'none'
      
      // Upload image if selected
      if (imageFile) {
        const storageRef = ref(storage, `timeline/${Date.now()}-${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
        mediaType = 'image'; // Set to 'image' when we have an image
      }
      
      // Add event to Firestore
      await addDoc(collection(db, 'weddingTimeline'), {
        title,
        date,
        time: time || '',
        location: location || '',
        description: description || '',
        imageUrl,
        mediaType, // This will always be defined now
        createdAt: new Date().toISOString(),
        order: events.length // Add at the end
      });
      
      // Reset form and close
      resetForm();
      setShowAddForm(false);
      
    } catch (err) {
      console.error('Error adding timeline event:', err);
      setError('Fehler beim Hinzufügen des Ereignisses');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Edit event
  const handleEditEvent = async (e: React.FormEvent, eventId: string) => {
    e.preventDefault();
    
    if (!title || !date) {
      alert('Bitte gib mindestens einen Titel und ein Datum ein.');
      return;
    }
    
    setIsUploading(true);
    
    try {
      const eventToUpdate = events.find(event => event.id === eventId);
      if (!eventToUpdate) return;
      
      let imageUrl = eventToUpdate.imageUrl || '';
      let mediaType: 'image' | 'none' = eventToUpdate.mediaType || 'none';
      
      // Upload new image if selected
      if (imageFile) {
        const storageRef = ref(storage, `timeline/${Date.now()}-${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
        mediaType = 'image';
      }
      
      // Update event in Firestore
      await updateDoc(doc(db, 'weddingTimeline', eventId), {
        title,
        date,
        time: time || '',
        location: location || '',
        description: description || '',
        imageUrl,
        mediaType
      });
      
      // Reset form and close
      resetForm();
      setShowEditForm(null);
      
    } catch (err) {
      console.error('Error updating timeline event:', err);
      setError('Fehler beim Aktualisieren des Ereignisses');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Delete event
  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Möchtest du dieses Ereignis wirklich löschen?')) return;
    
    try {
      await deleteDoc(doc(db, 'weddingTimeline', eventId));
    } catch (err) {
      console.error('Error deleting timeline event:', err);
      setError('Fehler beim Löschen des Ereignisses');
    }
  };
  
  // Load event data for editing
  const loadEventForEdit = (event: TimelineEvent) => {
    setTitle(event.title);
    setDate(event.date);
    setTime(event.time || '');
    setLocation(event.location || '');
    setDescription(event.description || '');
    setShowEditForm(event.id);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (err) {
      return dateString;
    }
  };
  
  return (
    <div className={`max-w-4xl mx-auto p-4 transition-colors duration-300 ${
      isDarkMode ? 'text-white' : 'text-gray-800'
    }`}>
      <div className="flex items-center justify-between mb-8">
        <h2 className={`text-2xl font-bold transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          <Calendar className="inline-block mr-2 mb-1" />
          Unsere Hochzeits-Timeline
        </h2>
        
        {isAdmin && (
          <button
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-pink-600 hover:bg-pink-700 text-white' 
                : 'bg-pink-500 hover:bg-pink-600 text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Ereignis hinzufügen</span>
          </button>
        )}
      </div>
      
      {error && (
        <div className={`p-4 mb-6 rounded-lg transition-colors duration-300 ${
          isDarkMode ? 'bg-red-900/30 border border-red-800/30 text-red-200' : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <p>{error}</p>
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : events.length === 0 ? (
        <div className={`text-center py-16 rounded-xl transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'
        }`}>
          <Calendar className={`w-16 h-16 mx-auto mb-4 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <h3 className={`text-xl font-semibold mb-2 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Noch keine Ereignisse
          </h3>
          <p className={`text-sm max-w-md mx-auto transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {isAdmin 
              ? 'Füge das erste Ereignis zur Hochzeits-Timeline hinzu!' 
              : 'Die Hochzeits-Timeline wird bald verfügbar sein.'}
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className={`absolute left-4 top-0 bottom-0 w-0.5 transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
          }`}></div>
          
          {/* Timeline events */}
          <div className="space-y-12">
            {events.map((event, index) => (
              <div key={event.id} className="relative">
                {/* Timeline dot */}
                <div className={`absolute left-4 w-8 h-8 -ml-4 rounded-full z-10 flex items-center justify-center transition-colors duration-300 ${
                  isDarkMode ? 'bg-pink-600 text-white' : 'bg-pink-500 text-white'
                }`}>
                  <Heart className="w-4 h-4" />
                </div>
                
                {/* Event card */}
                <div className={`ml-12 rounded-xl overflow-hidden transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-800/50 border border-gray-700 hover:bg-gray-800' 
                    : 'bg-white border border-gray-200 hover:shadow-md'
                }`}>
                  {/* Event image (if available) */}
                  {event.imageUrl && (
                    <div className="w-full h-48 overflow-hidden">
                      <img 
                        src={event.imageUrl} 
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Event content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <h3 className={`text-xl font-semibold mb-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {event.title}
                      </h3>
                      
                      {/* Admin actions */}
                      {isAdmin && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => loadEventForEdit(event)}
                            className={`p-1 rounded transition-colors duration-300 ${
                              isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                            }`}
                            title="Bearbeiten"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className={`p-1 rounded transition-colors duration-300 ${
                              isDarkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-100 text-red-600'
                            }`}
                            title="Löschen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Event details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className={`w-4 h-4 flex-shrink-0 transition-colors duration-300 ${
                          isDarkMode ? 'text-pink-400' : 'text-pink-600'
                        }`} />
                        <span>{formatDate(event.date)}</span>
                      </div>
                      
                      {event.time && (
                        <div className="flex items-center gap-2">
                          <Clock className={`w-4 h-4 flex-shrink-0 transition-colors duration-300 ${
                            isDarkMode ? 'text-pink-400' : 'text-pink-600'
                          }`} />
                          <span>{event.time}</span>
                        </div>
                      )}
                      
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className={`w-4 h-4 flex-shrink-0 transition-colors duration-300 ${
                            isDarkMode ? 'text-pink-400' : 'text-pink-600'
                          }`} />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Event description */}
                    {event.description && (
                      <p className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Add Event Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-semibold transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Neues Ereignis hinzufügen
                </h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className={`p-2 rounded-full transition-colors duration-300 ${
                    isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleAddEvent} className="space-y-4">
                {/* Title */}
                <div>
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Titel *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className={`w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-pink-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-pink-500'
                    }`}
                  />
                </div>
                
                {/* Date */}
                <div>
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Datum *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className={`w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-pink-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-pink-500'
                    }`}
                  />
                </div>
                
                {/* Time */}
                <div>
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Uhrzeit
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-pink-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-pink-500'
                    }`}
                  />
                </div>
                
                {/* Location */}
                <div>
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Ort
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-pink-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-pink-500'
                    }`}
                  />
                </div>
                
                {/* Description */}
                <div>
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Beschreibung
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-pink-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-pink-500'
                    }`}
                  />
                </div>
                
                {/* Image Upload */}
                <div>
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Bild (optional)
                  </label>
                  <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors duration-300 ${
                    isDarkMode 
                      ? 'border-gray-600 hover:border-gray-500' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer block">
                      {imageFile ? (
                        <div className="flex items-center justify-center gap-2">
                          <ImageIcon className={`w-5 h-5 transition-colors duration-300 ${
                            isDarkMode ? 'text-pink-400' : 'text-pink-500'
                          }`} />
                          <span className={`text-sm transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {imageFile.name}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Camera className={`w-8 h-8 transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`} />
                          <span className={`text-sm transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Klicke zum Hochladen eines Bildes
                          </span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
                
                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className={`flex-1 py-2 px-4 rounded-lg transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    }`}
                    disabled={isUploading}
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-2 px-4 rounded-lg transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-pink-600 hover:bg-pink-700 text-white' 
                        : 'bg-pink-500 hover:bg-pink-600 text-white'
                    }`}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Speichern...
                      </span>
                    ) : (
                      'Speichern'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Event Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-semibold transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Ereignis bearbeiten
                </h3>
                <button
                  onClick={() => setShowEditForm(null)}
                  className={`p-2 rounded-full transition-colors duration-300 ${
                    isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={(e) => handleEditEvent(e, showEditForm)} className="space-y-4">
                {/* Title */}
                <div>
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Titel *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className={`w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-pink-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-pink-500'
                    }`}
                  />
                </div>
                
                {/* Date */}
                <div>
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Datum *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className={`w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-pink-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-pink-500'
                    }`}
                  />
                </div>
                
                {/* Time */}
                <div>
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Uhrzeit
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-pink-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-pink-500'
                    }`}
                  />
                </div>
                
                {/* Location */}
                <div>
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Ort
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-pink-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-pink-500'
                    }`}
                  />
                </div>
                
                {/* Description */}
                <div>
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Beschreibung
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-pink-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-pink-500'
                    }`}
                  />
                </div>
                
                {/* Image Upload */}
                <div>
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Neues Bild (optional)
                  </label>
                  <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors duration-300 ${
                    isDarkMode 
                      ? 'border-gray-600 hover:border-gray-500' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="image-upload-edit"
                    />
                    <label htmlFor="image-upload-edit" className="cursor-pointer block">
                      {imageFile ? (
                        <div className="flex items-center justify-center gap-2">
                          <ImageIcon className={`w-5 h-5 transition-colors duration-300 ${
                            isDarkMode ? 'text-pink-400' : 'text-pink-500'
                          }`} />
                          <span className={`text-sm transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {imageFile.name}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Camera className={`w-8 h-8 transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`} />
                          <span className={`text-sm transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Klicke zum Hochladen eines neuen Bildes
                          </span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
                
                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditForm(null)}
                    className={`flex-1 py-2 px-4 rounded-lg transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    }`}
                    disabled={isUploading}
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-2 px-4 rounded-lg transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-pink-600 hover:bg-pink-700 text-white' 
                        : 'bg-pink-500 hover:bg-pink-600 text-white'
                    }`}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Speichern...
                      </span>
                    ) : (
                      'Speichern'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};