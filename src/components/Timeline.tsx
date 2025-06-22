import React, { useState, useEffect, useRef } from 'react';
import { Heart, Calendar, MapPin, Camera, Plus, Edit3, Trash2, Save, X, Image, Video, Upload } from 'lucide-react';
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
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';

interface TimelineEvent {
  id: string;
  title: string;
  customEventName?: string; // For custom event types
  date: string;
  description: string;
  location?: string;
  type: 'first_date' | 'first_kiss' | 'first_vacation' | 'engagement' | 'moving_together' | 'anniversary' | 'custom' | 'other';
  createdBy: string;
  createdAt: string;
  mediaUrls?: string[]; // Array of media URLs
  mediaTypes?: string[]; // Array of media types ('image' or 'video')
  mediaFileNames?: string[]; // For deletion from storage
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
  { value: 'engagement', label: '💍 Verlobung', icon: '💍', color: 'purple' },
  { value: 'moving_together', label: '🏡 Zusammenzug', icon: '🏡', color: 'green' },
  { value: 'anniversary', label: '🥂 Jahrestag', icon: '🥂', color: 'gold' },
  { value: 'custom', label: '✨ Benutzerdefiniert', icon: '✨', color: 'indigo' },
  { value: 'other', label: '💡 Sonstiges', icon: '💡', color: 'gray' },
];

export const Timeline: React.FC<TimelineProps> = ({ isDarkMode, userName, isAdmin }) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<TimelineEvent | null>(null);
  const [formState, setFormState] = useState<Omit<TimelineEvent, 'id' | 'createdBy' | 'createdAt' | 'mediaUrls' | 'mediaTypes' | 'mediaFileNames'>>({
    title: '',
    date: '',
    description: '',
    location: '',
    type: 'first_date',
    customEventName: '',
  });
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'timelineEvents'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TimelineEvent[];
      setEvents(eventsData);
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prevState => ({ ...prevState, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(e.target.files);
    }
  };

  const uploadFiles = async (eventId: string): Promise<{ urls: string[], types: string[], fileNames: string[] }> => {
    if (!selectedFiles || selectedFiles.length === 0) return { urls: [], types: [], fileNames: [] };

    const urls: string[] = [];
    const types: string[] = [];
    const fileNames: string[] = [];
    const totalFiles = selectedFiles.length;
    let uploadedCount = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const fileId = `${eventId}_${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `timeline_media/${fileId}`);
      
      try {
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        urls.push(url);
        types.push(file.type.startsWith('image/') ? 'image' : 'video');
        fileNames.push(fileId);
        uploadedCount++;
        setUploadProgress(Math.round((uploadedCount / totalFiles) * 100));
      } catch (error) {
        console.error("Error uploading file:", file.name, error);
        // Optionally, handle individual file upload errors
      }
    }
    return { urls, types, fileNames };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title || !formState.date || !formState.description) {
      alert('Bitte fülle alle Pflichtfelder aus.');
      return;
    }

    try {
      const newEventRef = await addDoc(collection(db, 'timelineEvents'), {
        ...formState,
        createdBy: userName,
        createdAt: new Date().toISOString(),
        mediaUrls: [],
        mediaTypes: [],
        mediaFileNames: [],
      });

      const { urls, types, fileNames } = await uploadFiles(newEventRef.id);

      await updateDoc(newEventRef, {
        mediaUrls: urls,
        mediaTypes: types,
        mediaFileNames: fileNames,
      });

      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error("Error adding document or uploading files: ", error);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent) return;
    
    try {
      // Upload new files if any are selected
      const { urls: newMediaUrls, types: newMediaTypes, fileNames: newMediaFileNames } = await uploadFiles(currentEvent.id);

      // Combine existing and new media
      const updatedMediaUrls = [...(currentEvent.mediaUrls || []), ...newMediaUrls];
      const updatedMediaTypes = [...(currentEvent.mediaTypes || []), ...newMediaTypes];
      const updatedMediaFileNames = [...(currentEvent.mediaFileNames || []), ...newMediaFileNames];

      await updateDoc(doc(db, 'timelineEvents', currentEvent.id), {
        ...formState,
        mediaUrls: updatedMediaUrls,
        mediaTypes: updatedMediaTypes,
        mediaFileNames: updatedMediaFileNames,
      });
      setShowEditModal(false);
      resetForm();
    } catch (error) {
      console.error("Error updating document or uploading files: ", error);
    }
  };

  const handleDelete = async (id: string, mediaFileNames: string[] = []) => {
    if (window.confirm('Bist du sicher, dass du dieses Ereignis löschen möchtest?')) {
      try {
        // Delete media files from storage
        for (const fileName of mediaFileNames) {
          const fileRef = ref(storage, `timeline_media/${fileName}`);
          try {
            await deleteObject(fileRef);
          } catch (error) {
            console.warn(`Could not delete file ${fileName}:`, error);
          }
        }
        await deleteDoc(doc(db, 'timelineEvents', id));
      } catch (error) {
        console.error("Error removing document: ", error);
      }
    }
  };

  const handleDeleteMedia = async (event: TimelineEvent, mediaUrlToDelete: string) => {
    if (!event.mediaUrls || !event.mediaTypes || !event.mediaFileNames) return;

    if (window.confirm('Bist du sicher, dass du dieses Medium löschen möchtest?')) {
      try {
        const indexToDelete = event.mediaUrls.indexOf(mediaUrlToDelete);
        if (indexToDelete > -1) {
          const fileNameToDelete = event.mediaFileNames[indexToDelete];
          const fileRef = ref(storage, `timeline_media/${fileNameToDelete}`);
          await deleteObject(fileRef);

          const updatedMediaUrls = event.mediaUrls.filter((_, i) => i !== indexToDelete);
          const updatedMediaTypes = event.mediaTypes.filter((_, i) => i !== indexToDelete);
          const updatedMediaFileNames = event.mediaFileNames.filter((_, i) => i !== indexToDelete);

          await updateDoc(doc(db, 'timelineEvents', event.id), {
            mediaUrls: updatedMediaUrls,
            mediaTypes: updatedMediaTypes,
            mediaFileNames: updatedMediaFileNames,
          });

          // Update currentEvent if it's the one being edited
          if (currentEvent && currentEvent.id === event.id) {
            setCurrentEvent(prev => prev ? {
              ...prev,
              mediaUrls: updatedMediaUrls,
              mediaTypes: updatedMediaTypes,
              mediaFileNames: updatedMediaFileNames,
            } : null);
          }
        }
      } catch (error) {
        console.error("Error deleting media: ", error);
      }
    }
  };

  const resetForm = () => {
    setFormState({
      title: '',
      date: '',
      description: '',
      location: '',
      type: 'first_date',
      customEventName: '',
    });
    setSelectedFiles(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear file input
    }
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (event: TimelineEvent) => {
    setCurrentEvent(event);
    setFormState({
      title: event.title,
      date: event.date,
      description: event.description,
      location: event.location || '',
      type: event.type,
      customEventName: event.customEventName || '',
    });
    setSelectedFiles(null); // Clear selected files when opening edit modal
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear file input
    }
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    resetForm();
    setCurrentEvent(null);
  };

  const renderModal = (isEdit: boolean) => {
    const isCustomType = formState.type === 'custom';

    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors duration-300 ${
        isDarkMode ? 'bg-black bg-opacity-75' : 'bg-black bg-opacity-50'
      }`}>
        <div className={`relative w-full max-w-lg rounded-lg shadow-lg p-6 ${
          isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}>
          <h2 className="text-2xl font-bold mb-4">
            {isEdit ? 'Ereignis bearbeiten' : 'Neues Ereignis hinzufügen'}
          </h2>
          <form onSubmit={isEdit ? handleUpdate : handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">Titel</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formState.title}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
                required
              />
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium mb-1">Typ</label>
              <select
                id="type"
                name="type"
                value={formState.type}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
                required
              >
                {eventTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            {isCustomType && (
              <div>
                <label htmlFor="customEventName" className="block text-sm font-medium mb-1">Benutzerdefinierter Name</label>
                <input
                  type="text"
                  id="customEventName"
                  name="customEventName"
                  value={formState.customEventName}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                  required={isCustomType}
                />
              </div>
            )}
            <div>
              <label htmlFor="date" className="block text-sm font-medium mb-1">Datum</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formState.date}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">Beschreibung</label>
              <textarea
                id="description"
                name="description"
                value={formState.description}
                onChange={handleInputChange}
                rows={4}
                className={`w-full p-2 border rounded-md transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
                required
              />
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium mb-1">Ort (optional)</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formState.location}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <div>
              <label htmlFor="media" className="block text-sm font-medium mb-1">Medien hinzufügen (Bilder/Videos)</label>
              <input
                type="file"
                id="media"
                name="media"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                className={`w-full p-2 border rounded-md file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold ${isDarkMode ? 'file:bg-blue-600 file:text-white hover:file:bg-blue-700 text-white' : 'file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 text-gray-900'}`}
              />
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 dark:bg-gray-700">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                  <span className="text-xs text-gray-500 ml-2">{uploadProgress}%</span>
                </div>
              )}
            </div>

            {isEdit && currentEvent?.mediaUrls && currentEvent.mediaUrls.length > 0 && (
              <div className="mt-4">
                <h3 className="text-md font-medium mb-2">Bestehende Medien:</h3>
                <div className="grid grid-cols-3 gap-2">
                  {currentEvent.mediaUrls.map((mediaUrl, index) => (
                    <div key={index} className="relative w-full h-24 rounded-md overflow-hidden group">
                      {currentEvent.mediaTypes?.[index] === 'image' ? (
                        <img src={mediaUrl} alt={`Media ${index}`} className="w-full h-full object-cover" />
                      ) : (
                        <video src={mediaUrl} className="w-full h-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteMedia(currentEvent, mediaUrl)}
                        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Medium löschen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModals}
                className={`py-2 px-4 rounded-md font-semibold transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className={`py-2 px-4 rounded-md font-semibold flex items-center gap-2 transition-colors duration-300 ${
                  isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isEdit ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {isEdit ? 'Speichern' : 'Hinzufügen'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const getEventIcon = (type: string) => {
    const eventType = eventTypes.find(et => et.value === type);
    return eventType ? eventType.icon : '💡'; // Default to a lightbulb icon
  };

  const getEventLabel = (event: TimelineEvent) => {
    const eventType = eventTypes.find(et => et.value === event.type);
    if (event.type === 'custom' && event.customEventName) {
      return event.customEventName;
    }
    return eventType ? eventType.label : 'Sonstiges';
  };

  return (
    <div className={`min-h-screen p-8 transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-10">Unsere Zeitreise</h1>

        {/* Add Event Button */}
        {isAdmin && (
          <div className="flex justify-center mb-8">
            <button
              onClick={openAddModal}
              className={`py-3 px-6 rounded-full font-semibold flex items-center gap-2 shadow-lg transition-all duration-300 transform hover:scale-105 ${
                isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <Plus className="w-5 h-5" />
              Ereignis hinzufügen
            </button>
          </div>
        )}

        {showAddModal && renderModal(false)}
        {showEditModal && renderModal(true)}

        {events.length === 0 ? (
          <p className="text-center text-lg mt-10">Noch keine Ereignisse in der Zeitachse.</p>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className={`absolute left-1/2 -translate-x-1/2 w-0.5 h-full transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
            }`}></div>

            <div className="space-y-12">
              {events.map((event, index) => {
                const isEven = index % 2 === 0;
                const eventType = eventTypes.find(et => et.value === event.type) || eventTypes.find(et => et.value === 'other')!;

                return (
                  <div key={event.id} className={`flex items-center w-full ${isEven ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className="w-1/2 flex justify-center">
                      {/* Placeholder for left/right alignment */}
                    </div>
                    
                    {/* Event Card */}
                    <div className={`relative w-1/2 p-6 rounded-lg shadow-xl border transition-colors duration-300 ${
                      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}>
                      {/* Dot on the timeline line */}
                      <div className={`absolute w-4 h-4 rounded-full border-2 ${isEven ? '-left-2' : '-right-2'} top-1/2 -translate-y-1/2 transform translate-x-1/2 z-10 transition-colors duration-300 ${
                        isDarkMode ? 'bg-gray-900 border-blue-500' : 'bg-gray-50 border-blue-500'
                      }`}></div>

                      {isAdmin && (
                        <div className="absolute top-3 right-3 flex gap-2 z-10">
                          <button
                            onClick={() => openEditModal(event)}
                            className={`p-1 rounded-full transition-colors duration-300 ${
                              isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                            }`}
                            title="Bearbeiten"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(event.id, event.mediaFileNames)}
                            className={`p-1 rounded-full transition-colors duration-300 ${
                              isDarkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
                            }`}
                            title="Löschen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      <div className={`flex items-center gap-3 mb-3 ${isEven ? '' : 'justify-end text-right'}`}>
                        <span className="text-3xl">{getEventIcon(event.type)}</span>
                        <div>
                          <h3 className="text-xl font-semibold">{event.title}</h3>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <Calendar className="inline-block w-4 h-4 mr-1" />
                            {event.date}
                            {event.location && (
                              <>
                                <MapPin className="inline-block w-4 h-4 ml-3 mr-1" />
                                {event.location}
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      <p className={`mb-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {event.description}
                      </p>

                      {event.mediaUrls && event.mediaUrls.length > 0 && (
                        <div className="mt-4">
                          <div className={`grid ${event.mediaUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
                            {event.mediaUrls.slice(0, 3).map((mediaUrl, mediaIndex) => {
                              const isVideo = event.mediaTypes?.[mediaIndex] === 'video';
                              const Component = isVideo ? 'video' : 'img';
                              return (
                                <div key={mediaIndex} className={`relative rounded-md overflow-hidden ${
                                  event.mediaUrls.length === 1 ? 'h-60' : 'h-40'
                                } cursor-pointer`}
                                onClick={() => { /* Open modal logic */ }}>
                                  <Component
                                    src={mediaUrl}
                                    className="w-full h-full object-cover"
                                    controls={isVideo ? true : undefined}
                                    preload={isVideo ? "metadata" : undefined} // Or "none" to optimize initial load
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent modal from opening if clicked on controls
                                      // Logic to open MediaModal with this specific media item
                                      // You would need to pass event.mediaUrls, event.mediaTypes and the clicked index to the modal
                                    }}
                                  />
                                  {event.mediaUrls.length > 3 && mediaIndex === 2 && (
                                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-lg font-bold">
                                      +{event.mediaUrls.length - 3}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          
                          {event.mediaUrls.length > 3 && (
                            <p className={`text-xs mt-2 transition-colors duration-300 ${
                              isDarkMode ? 'text-gray-500' : 'text-gray-500'
                            }`}>
                              {event.mediaUrls.length} Medien • Klicke zum Vergrößern
                            </p>
                          )}
                        </div>
                      )}

                      {/* Event metadata */}
                      <div className={`pt-3 border-t flex items-center justify-between text-xs transition-colors duration-300 ${
                        isDarkMode ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-500'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span>{eventType.label}</span>
                          {event.mediaUrls && event.mediaUrls.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Camera className="w-3 h-3" />
                              {event.mediaUrls.length}
                            </span>
                          )}
                        </div>
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
