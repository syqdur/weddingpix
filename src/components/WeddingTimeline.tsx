import React, { useState, useEffect } from 'react';
import { Calendar, Heart, Clock, Image, Video, Edit, Trash2, Plus, AlertCircle, CheckCircle } from 'lucide-react';
import { TimelineEvent } from '../types';
import { loadTimelineEvents } from '../services/timelineService';
import { TimelineEventModal } from './TimelineEventModal';

interface WeddingTimelineProps {
  isDarkMode: boolean;
  isAdmin: boolean;
  userName: string;
}

export const WeddingTimeline: React.FC<WeddingTimelineProps> = ({
  isDarkMode,
  isAdmin,
  userName
}) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<TimelineEvent | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load timeline events
  useEffect(() => {
    setIsLoading(true);
    
    const unsubscribe = loadTimelineEvents((loadedEvents) => {
      setEvents(loadedEvents);
      setIsLoading(false);
      setError(null);
    });
    
    return unsubscribe;
  }, []);

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Handle adding a new event
  const handleAddEvent = () => {
    setCurrentEvent(null);
    setShowEventModal(true);
  };

  // Handle editing an event
  const handleEditEvent = (event: TimelineEvent) => {
    setCurrentEvent(event);
    setShowEventModal(true);
  };

  // Handle successful event operation
  const handleEventSuccess = (message: string) => {
    setSuccess(message);
    setShowEventModal(false);
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccess(null);
    }, 3000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`text-lg transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Lade Timeline...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 rounded-xl border transition-colors duration-300 ${
        isDarkMode ? 'bg-red-900/20 border-red-700/30' : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center gap-3 mb-2">
          <AlertCircle className={`w-6 h-6 transition-colors duration-300 ${
            isDarkMode ? 'text-red-400' : 'text-red-600'
          }`} />
          <h3 className={`text-lg font-semibold transition-colors duration-300 ${
            isDarkMode ? 'text-red-300' : 'text-red-800'
          }`}>
            Fehler beim Laden der Timeline
          </h3>
        </div>
        <p className={`text-sm transition-colors duration-300 ${
          isDarkMode ? 'text-red-200' : 'text-red-700'
        }`}>
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-full transition-colors duration-300 ${
            isDarkMode ? 'bg-pink-600' : 'bg-pink-500'
          }`}>
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className={`text-xl font-semibold transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Unsere Geschichte
            </h2>
            <p className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Die wichtigsten Momente auf unserem gemeinsamen Weg
            </p>
          </div>
        </div>
        
        {/* Admin Add Button */}
        {isAdmin && (
          <button
            onClick={handleAddEvent}
            className={`p-2 rounded-full transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-pink-600 hover:bg-pink-700 text-white' 
                : 'bg-pink-500 hover:bg-pink-600 text-white'
            }`}
            title="Neues Ereignis hinzufügen"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Success Message */}
      {success && (
        <div className={`mb-6 p-4 rounded-xl border transition-colors duration-300 ${
          isDarkMode ? 'bg-green-900/20 border-green-700/30' : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center gap-3">
            <CheckCircle className={`w-5 h-5 transition-colors duration-300 ${
              isDarkMode ? 'text-green-400' : 'text-green-600'
            }`} />
            <p className={`text-sm font-medium transition-colors duration-300 ${
              isDarkMode ? 'text-green-300' : 'text-green-800'
            }`}>
              {success}
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {events.length === 0 && (
        <div className="text-center py-12">
          <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
          }`}>
            <Calendar className={`w-10 h-10 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-600' : 'text-gray-400'
            }`} />
          </div>
          <h3 className={`text-xl font-semibold mb-2 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Noch keine Ereignisse
          </h3>
          <p className={`text-sm mb-6 max-w-md mx-auto transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {isAdmin 
              ? 'Füge wichtige Meilensteine eurer Beziehung hinzu, um eure gemeinsame Geschichte zu erzählen.'
              : 'Hier werden bald wichtige Meilensteine der Beziehung von Kristin und Maurizio zu sehen sein.'}
          </p>
          
          {isAdmin && (
            <button
              onClick={handleAddEvent}
              className={`px-4 py-2 rounded-lg transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-pink-600 hover:bg-pink-700 text-white' 
                  : 'bg-pink-500 hover:bg-pink-600 text-white'
              }`}
            >
              <Plus className="w-4 h-4 inline-block mr-2" />
              Erstes Ereignis hinzufügen
            </button>
          )}
        </div>
      )}

      {/* Timeline */}
      {events.length > 0 && (
        <div className="relative">
          {/* Center Line */}
          <div className={`absolute left-1/2 transform -translate-x-1/2 top-0 bottom-0 w-1 transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
          }`}></div>
          
          {/* Events */}
          <div className="relative z-10">
            {events.map((event, index) => (
              <div 
                key={event.id} 
                className={`flex items-center mb-12 ${
                  event.position === 'left' ? 'flex-row' : 'flex-row-reverse'
                }`}
              >
                {/* Date Circle */}
                <div className="flex-shrink-0 w-24 text-center">
                  <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300 ${
                    isDarkMode ? 'bg-pink-600 text-white' : 'bg-pink-500 text-white'
                  }`}>
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className={`mt-2 text-xs font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {formatDate(event.date)}
                  </div>
                </div>
                
                {/* Connector Line */}
                <div className={`flex-grow h-0.5 transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}></div>
                
                {/* Event Card */}
                <div className={`w-full max-w-sm transition-all duration-300 hover:shadow-lg ${
                  event.position === 'left' ? 'ml-4' : 'mr-4'
                }`}>
                  <div className={`rounded-xl overflow-hidden border transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
                  }`}>
                    {/* Image/Video (if available) */}
                    {event.imageUrl && (
                      <div className="relative aspect-video overflow-hidden">
                        {event.mediaType === 'video' ? (
                          <video 
                            src={event.imageUrl} 
                            className="w-full h-full object-cover"
                            controls
                          />
                        ) : (
                          <img 
                            src={event.imageUrl} 
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                        
                        {/* Media Type Indicator */}
                        <div className={`absolute top-2 right-2 p-1 rounded-full transition-colors duration-300 ${
                          isDarkMode ? 'bg-black/60' : 'bg-black/40'
                        }`}>
                          {event.mediaType === 'video' ? (
                            <Video className="w-4 h-4 text-white" />
                          ) : (
                            <Image className="w-4 h-4 text-white" />
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Content */}
                    <div className="p-4">
                      <h3 className={`text-lg font-semibold mb-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {event.title}
                      </h3>
                      <p className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {event.description}
                      </p>
                      
                      {/* Admin Actions */}
                      {isAdmin && (
                        <div className="flex justify-end mt-4 gap-2">
                          <button
                            onClick={() => handleEditEvent(event)}
                            className={`p-2 rounded transition-colors duration-300 ${
                              isDarkMode ? 'hover:bg-gray-700 text-blue-400' : 'hover:bg-gray-100 text-blue-600'
                            }`}
                            title="Bearbeiten"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Timeline End */}
          <div className="flex justify-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300 ${
              isDarkMode ? 'bg-pink-600 text-white' : 'bg-pink-500 text-white'
            }`}>
              <Heart className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Event Modal */}
      <TimelineEventModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        event={currentEvent}
        onSuccess={handleEventSuccess}
        isDarkMode={isDarkMode}
        userName={userName}
      />
    </div>
  );
};