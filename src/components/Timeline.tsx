import React, { useState, useEffect } from 'react';
import { Heart, Calendar, MapPin, Camera, Plus, Edit3, Trash2, Save, X } from 'lucide-react';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../config/firebase';

interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  location?: string;
  type: 'first_date' | 'first_kiss' | 'first_vacation' | 'engagement' | 'moving_together' | 'anniversary' | 'other';
  createdBy: string;
  createdAt: string;
}

interface TimelineProps {
  isDarkMode: boolean;
  userName: string;
  isAdmin: boolean;
}

const eventTypes = [
  { value: 'first_date', label: '💕 Erstes Date', icon: '💕', color: 'pink' },
  { value: 'first_kiss', label: '💋 Erster Kuss', icon: '💋', color: 'red' },
  { value: 'first_vacation', label: '✈️ Erster Urlaub', icon: '✈️', color: 'blue' },
  { value: 'moving_together', label: '🏠 Zusammengezogen', icon: '🏠', color: 'green' },
  { value: 'engagement', label: '💍 Verlobung', icon: '💍', color: 'yellow' },
  { value: 'anniversary', label: '🎉 Jahrestag', icon: '🎉', color: 'purple' },
  { value: 'other', label: '❤️ Sonstiges', icon: '❤️', color: 'gray' }
];

export const Timeline: React.FC<TimelineProps> = ({ isDarkMode, userName, isAdmin }) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    description: '',
    location: '',
    type: 'other' as TimelineEvent['type']
  });

  // Load timeline events
  useEffect(() => {
    const q = query(collection(db, 'timeline'), orderBy('date', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const timelineEvents: TimelineEvent[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TimelineEvent));
      
      setEvents(timelineEvents);
      setIsLoading(false);
    }, (error) => {
      console.error('Error loading timeline events:', error);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const resetForm = () => {
    setFormData({
      title: '',
      date: '',
      description: '',
      location: '',
      type: 'other'
    });
    setShowAddForm(false);
    setEditingEvent(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.date) {
      alert('Bitte fülle mindestens Titel und Datum aus.');
      return;
    }

    try {
      if (editingEvent) {
        // Update existing event
        await updateDoc(doc(db, 'timeline', editingEvent.id), {
          title: formData.title.trim(),
          date: formData.date,
          description: formData.description.trim(),
          location: formData.location.trim(),
          type: formData.type
        });
      } else {
        // Add new event
        await addDoc(collection(db, 'timeline'), {
          title: formData.title.trim(),
          date: formData.date,
          description: formData.description.trim(),
          location: formData.location.trim(),
          type: formData.type,
          createdBy: userName,
          createdAt: new Date().toISOString()
        });
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving timeline event:', error);
      alert('Fehler beim Speichern des Events. Bitte versuche es erneut.');
    }
  };

  const handleEdit = (event: TimelineEvent) => {
    setFormData({
      title: event.title,
      date: event.date,
      description: event.description,
      location: event.location || '',
      type: event.type
    });
    setEditingEvent(event);
    setShowAddForm(true);
  };

  const handleDelete = async (event: TimelineEvent) => {
    if (!window.confirm(`Event "${event.title}" wirklich löschen?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'timeline', event.id));
    } catch (error) {
      console.error('Error deleting timeline event:', error);
      alert('Fehler beim Löschen des Events.');
    }
  };

  const getEventTypeInfo = (type: string) => {
    return eventTypes.find(t => t.value === type) || eventTypes[eventTypes.length - 1];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Heute';
    if (diffInDays === 1) return 'Gestern';
    if (diffInDays < 30) return `vor ${diffInDays} Tagen`;
    if (diffInDays < 365) return `vor ${Math.floor(diffInDays / 30)} Monaten`;
    return `vor ${Math.floor(diffInDays / 365)} Jahren`;
  };

  if (isLoading) {
    return (
      <div className={`p-6 transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <div className={`p-6 border-b transition-colors duration-300 ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full transition-colors duration-300 ${
              isDarkMode ? 'bg-pink-600' : 'bg-pink-500'
            }`}>
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className={`text-2xl font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                💕 Unsere Geschichte
              </h2>
              <p className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Die wichtigsten Momente unserer Beziehung
              </p>
            </div>
          </div>
          
          {isAdmin && (
            <button
              onClick={() => setShowAddForm(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 ${
                isDarkMode 
                  ? 'bg-pink-600 hover:bg-pink-700 text-white' 
                  : 'bg-pink-500 hover:bg-pink-600 text-white'
              }`}
            >
              <Plus className="w-4 h-4" />
              Event hinzufügen
            </button>
          )}
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {editingEvent ? 'Event bearbeiten' : 'Neues Event hinzufügen'}
              </h3>
              <button
                onClick={resetForm}
                className={`p-2 rounded-full transition-colors duration-300 ${
                  isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Event Type */}
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Event-Typ
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as TimelineEvent['type'] })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  {eventTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Titel *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="z.B. Unser erstes Date"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-colors duration-300 ${
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
                  Datum *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                />
              </div>

              {/* Location */}
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Ort
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="z.B. Restaurant Zur Sonne"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>

              {/* Description */}
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Beschreibung
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Erzähle von diesem besonderen Moment..."
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none resize-none transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className={`flex-1 py-2 px-4 rounded-lg transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' 
                      : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                  }`}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {editingEvent ? 'Speichern' : 'Hinzufügen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Timeline Content */}
      <div className="p-6">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <Heart className={`w-8 h-8 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`} />
            </div>
            <h3 className={`text-xl font-light mb-2 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Noch keine Events
            </h3>
            <p className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {isAdmin ? 'Füge das erste Event eurer Liebesgeschichte hinzu!' : 'Die Timeline wird bald mit besonderen Momenten gefüllt.'}
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className={`absolute left-8 top-0 bottom-0 w-0.5 transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
            }`}></div>

            {/* Timeline Events */}
            <div className="space-y-8">
              {events.map((event, index) => {
                const eventType = getEventTypeInfo(event.type);
                const canEdit = isAdmin || event.createdBy === userName;

                return (
                  <div key={event.id} className="relative flex items-start gap-6">
                    {/* Timeline Dot */}
                    <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-colors duration-300 ${
                      eventType.color === 'pink' ? 'bg-pink-500' :
                      eventType.color === 'red' ? 'bg-red-500' :
                      eventType.color === 'blue' ? 'bg-blue-500' :
                      eventType.color === 'green' ? 'bg-green-500' :
                      eventType.color === 'yellow' ? 'bg-yellow-500' :
                      eventType.color === 'purple' ? 'bg-purple-500' :
                      isDarkMode ? 'bg-gray-600' : 'bg-gray-400'
                    }`}>
                      {eventType.icon}
                    </div>

                    {/* Event Content */}
                    <div className={`flex-1 p-6 rounded-xl transition-colors duration-300 ${
                      isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'
                    }`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className={`text-lg font-semibold mb-1 transition-colors duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {event.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm">
                            <div className={`flex items-center gap-1 transition-colors duration-300 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(event.date)}</span>
                              <span className="text-xs opacity-75">({getTimeAgo(event.date)})</span>
                            </div>
                            {event.location && (
                              <div className={`flex items-center gap-1 transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                <MapPin className="w-4 h-4" />
                                <span>{event.location}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {canEdit && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEdit(event)}
                              className={`p-2 rounded-full transition-colors duration-300 ${
                                isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                              }`}
                              title="Event bearbeiten"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(event)}
                              className={`p-2 rounded-full transition-colors duration-300 ${
                                isDarkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-red-50 text-red-600'
                              }`}
                              title="Event löschen"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {event.description && (
                        <p className={`text-sm leading-relaxed transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {event.description}
                        </p>
                      )}

                      {/* Event metadata */}
                      <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs transition-colors duration-300 ${
                        isDarkMode ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-500'
                      }`}>
                        <span>Hinzugefügt von {event.createdBy}</span>
                        <span>{eventType.label}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};