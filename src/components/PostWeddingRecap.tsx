import React, { useState, useEffect, useRef } from 'react';
import { Heart, Camera, Download, Mail, Share2, BarChart3, Users, Calendar, MapPin, MessageSquare, Star, ArrowLeft, Plus, Edit3, Trash2, Send, Eye, ThumbsUp, X, Image, Video, FileText, Gift, Sparkles, Crown, Award, AlertCircle, Check, Save } from 'lucide-react';
import { MediaItem } from '../types';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  updateDoc,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';

interface PostWeddingRecapProps {
  isDarkMode: boolean;
  mediaItems: MediaItem[];
  isAdmin: boolean;
  userName: string;
}

interface Moment {
  id: string;
  title: string;
  description: string;
  mediaItemIds: string[]; // IDs of media items
  category: 'ceremony' | 'reception' | 'party' | 'special' | 'custom';
  timestamp: string;
  location?: string;
  tags: string[];
  createdBy: string;
  createdAt: string;
}

interface ThankYouCard {
  id: string;
  recipientName: string;
  recipientEmail: string;
  message: string;
  template: string;
  selectedMomentIds: string[];
  status: 'draft' | 'sent';
  sentAt?: string;
  createdBy: string;
  createdAt: string;
}

interface Analytics {
  totalViews: number;
  uniqueVisitors: number;
  averageTimeSpent: string;
  mostViewedMoments: string[];
  feedback: Array<{
    id: string;
    rating: number;
    comment: string;
    timestamp: string;
  }>;
}

export const PostWeddingRecap: React.FC<PostWeddingRecapProps> = ({
  isDarkMode,
  mediaItems,
  isAdmin,
  userName
}) => {
  const [activeSection, setActiveSection] = useState<'moments' | 'cards' | 'share' | 'analytics'>('moments');
  const [moments, setMoments] = useState<Moment[]>([]);
  const [thankYouCards, setThankYouCards] = useState<ThankYouCard[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    totalViews: 0,
    uniqueVisitors: 0,
    averageTimeSpent: '0:00',
    mostViewedMoments: [],
    feedback: []
  });
  
  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState('Lade Daten...');
  const [error, setError] = useState<string | null>(null);
  
  // Form States
  const [showCreateMoment, setShowCreateMoment] = useState(false);
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [selectedMoment, setSelectedMoment] = useState<Moment | null>(null);
  const [editingMoment, setEditingMoment] = useState<Moment | null>(null);
  const [selectedMediaItems, setSelectedMediaItems] = useState<MediaItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form Data
  const [momentForm, setMomentForm] = useState({
    title: '',
    description: '',
    category: 'ceremony' as Moment['category'],
    location: '',
    timestamp: new Date().toISOString().split('T')[0],
    tags: ''
  });
  
  const [cardForm, setCardForm] = useState({
    recipientName: '',
    recipientEmail: '',
    message: '',
    template: 'classic',
    selectedMomentIds: [] as string[]
  });

  // Load data from Firestore
  useEffect(() => {
    if (!isAdmin) return;
    
    setIsLoading(true);
    setError(null);
    setLoadingStatus('Lade Daten...');
    
    try {
      // Load moments
      setLoadingStatus('Lade Momente...');
      const momentsQuery = query(collection(db, 'moments'), orderBy('timestamp', 'desc'));
      
      const unsubscribeMoments = onSnapshot(momentsQuery, (snapshot) => {
        try {
          const loadedMoments: Moment[] = [];
          
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            loadedMoments.push({
              id: doc.id,
              title: data.title || '',
              description: data.description || '',
              mediaItemIds: data.mediaItemIds || [],
              category: data.category || 'custom',
              timestamp: data.timestamp || new Date().toISOString(),
              location: data.location || '',
              tags: data.tags || [],
              createdBy: data.createdBy || userName,
              createdAt: data.createdAt || new Date().toISOString()
            });
          });
          
          setMoments(loadedMoments);
          console.log(`Loaded ${loadedMoments.length} moments`);
          
          // Load thank you cards
          setLoadingStatus('Lade Dankeskarten...');
          const cardsQuery = query(collection(db, 'thankYouCards'), orderBy('createdAt', 'desc'));
          
          const unsubscribeCards = onSnapshot(cardsQuery, (snapshot) => {
            try {
              const loadedCards: ThankYouCard[] = [];
              
              snapshot.docs.forEach(doc => {
                const data = doc.data();
                loadedCards.push({
                  id: doc.id,
                  recipientName: data.recipientName || '',
                  recipientEmail: data.recipientEmail || '',
                  message: data.message || '',
                  template: data.template || 'classic',
                  selectedMomentIds: data.selectedMomentIds || [],
                  status: data.status || 'draft',
                  sentAt: data.sentAt,
                  createdBy: data.createdBy || userName,
                  createdAt: data.createdAt || new Date().toISOString()
                });
              });
              
              setThankYouCards(loadedCards);
              console.log(`Loaded ${loadedCards.length} thank you cards`);
              
              // Set sample analytics data
              setAnalytics({
                totalViews: 1247,
                uniqueVisitors: 89,
                averageTimeSpent: '4:32',
                mostViewedMoments: loadedMoments.length > 0 ? [loadedMoments[0].title, loadedMoments.length > 1 ? loadedMoments[1].title : ''] : [],
                feedback: [
                  {
                    id: '1',
                    rating: 5,
                    comment: 'Wunderschöne Zusammenfassung! Vielen Dank für die tollen Erinnerungen.',
                    timestamp: '2025-07-15T10:30:00Z'
                  },
                  {
                    id: '2',
                    rating: 5,
                    comment: 'Es war ein magischer Tag. Danke, dass wir dabei sein durften!',
                    timestamp: '2025-07-14T16:45:00Z'
                  }
                ]
              });
              
              setIsLoading(false);
              setError(null);
            } catch (cardsError: any) {
              console.error('Error processing cards:', cardsError);
              setError(`Fehler beim Laden der Dankeskarten: ${cardsError.message}`);
              setIsLoading(false);
            }
          }, (cardsError: any) => {
            console.error('Error loading cards:', cardsError);
            setError(`Fehler beim Laden der Dankeskarten: ${cardsError.message}`);
            setIsLoading(false);
          });
          
          return () => {
            unsubscribeCards();
          };
          
        } catch (momentsError: any) {
          console.error('Error processing moments:', momentsError);
          setError(`Fehler beim Laden der Momente: ${momentsError.message}`);
          setIsLoading(false);
        }
      }, (momentsError: any) => {
        console.error('Error loading moments:', momentsError);
        setError(`Fehler beim Laden der Momente: ${momentsError.message}`);
        setIsLoading(false);
      });
      
      return () => {
        unsubscribeMoments();
      };
      
    } catch (error: any) {
      console.error('Error in PostWeddingRecap initialization:', error);
      setError(`Fehler beim Laden der Daten: ${error.message}`);
      setIsLoading(false);
    }
  }, [isAdmin, userName, mediaItems]);

  // Reset form when closing modals
  useEffect(() => {
    if (!showCreateMoment) {
      setMomentForm({
        title: '',
        description: '',
        category: 'ceremony',
        location: '',
        timestamp: new Date().toISOString().split('T')[0],
        tags: ''
      });
      setSelectedMediaItems([]);
      setEditingMoment(null);
    }
  }, [showCreateMoment]);

  useEffect(() => {
    if (!showCreateCard) {
      setCardForm({
        recipientName: '',
        recipientEmail: '',
        message: '',
        template: 'classic',
        selectedMomentIds: []
      });
    }
  }, [showCreateCard]);

  // Create a new moment
  const handleCreateMoment = async () => {
    if (!isAdmin) return;
    
    if (editingMoment) {
      setEditingMoment(null);
    }
    
    setMomentForm({
      title: '',
      description: '',
      category: 'ceremony',
      location: '',
      timestamp: new Date().toISOString().split('T')[0],
      tags: ''
    });
    setSelectedMediaItems([]);
    setShowCreateMoment(true);
  };

  // Edit an existing moment
  const handleEditMoment = (moment: Moment) => {
    if (!isAdmin) return;
    
    // Find media items for this moment
    const momentMediaItems = mediaItems.filter(item => 
      moment.mediaItemIds.includes(item.id)
    );
    
    setEditingMoment(moment);
    setMomentForm({
      title: moment.title,
      description: moment.description,
      category: moment.category,
      location: moment.location || '',
      timestamp: new Date(moment.timestamp).toISOString().split('T')[0],
      tags: moment.tags.join(', ')
    });
    setSelectedMediaItems(momentMediaItems);
    setShowCreateMoment(true);
  };

  // Delete a moment
  const handleDeleteMoment = async (moment: Moment) => {
    if (!isAdmin) return;
    
    if (!window.confirm(`Moment "${moment.title}" wirklich löschen?`)) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Delete the moment from Firestore
      await deleteDoc(doc(db, 'moments', moment.id));
      
      // Update any thank you cards that reference this moment
      const cardsQuery = query(
        collection(db, 'thankYouCards'), 
        where('selectedMomentIds', 'array-contains', moment.id)
      );
      
      const cardsSnapshot = await getDocs(cardsQuery);
      
      const updatePromises = cardsSnapshot.docs.map(cardDoc => {
        const card = cardDoc.data() as ThankYouCard;
        const updatedMomentIds = card.selectedMomentIds.filter(id => id !== moment.id);
        
        return updateDoc(doc(db, 'thankYouCards', cardDoc.id), {
          selectedMomentIds: updatedMomentIds
        });
      });
      
      await Promise.all(updatePromises);
      
      setIsSubmitting(false);
      alert(`Moment "${moment.title}" wurde erfolgreich gelöscht.`);
      
    } catch (error: any) {
      console.error('Error deleting moment:', error);
      setIsSubmitting(false);
      alert(`Fehler beim Löschen des Moments: ${error.message}`);
    }
  };

  // Save a moment (create or update)
  const handleSaveMoment = async () => {
    if (!isAdmin) return;
    
    // Validate form
    if (!momentForm.title.trim()) {
      alert('Bitte gib einen Titel ein.');
      return;
    }
    
    if (!momentForm.timestamp) {
      alert('Bitte wähle ein Datum aus.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Process tags
      const tags = momentForm.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      // Get media item IDs
      const mediaItemIds = selectedMediaItems.map(item => item.id);
      
      // Create moment data
      const momentData = {
        title: momentForm.title.trim(),
        description: momentForm.description.trim(),
        category: momentForm.category,
        location: momentForm.location.trim(),
        timestamp: new Date(momentForm.timestamp).toISOString(),
        tags,
        mediaItemIds,
        updatedAt: new Date().toISOString()
      };
      
      if (editingMoment) {
        // Update existing moment
        await updateDoc(doc(db, 'moments', editingMoment.id), momentData);
        alert(`Moment "${momentForm.title}" wurde aktualisiert.`);
      } else {
        // Create new moment
        const newMomentData = {
          ...momentData,
          createdBy: userName,
          createdAt: new Date().toISOString()
        };
        
        await addDoc(collection(db, 'moments'), newMomentData);
        alert(`Moment "${momentForm.title}" wurde erstellt.`);
      }
      
      // Reset form and close modal
      setShowCreateMoment(false);
      setEditingMoment(null);
      setMomentForm({
        title: '',
        description: '',
        category: 'ceremony',
        location: '',
        timestamp: new Date().toISOString().split('T')[0],
        tags: ''
      });
      setSelectedMediaItems([]);
      
    } catch (error: any) {
      console.error('Error saving moment:', error);
      alert(`Fehler beim Speichern des Moments: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create a new thank you card
  const handleCreateCard = () => {
    if (!isAdmin) return;
    
    setCardForm({
      recipientName: '',
      recipientEmail: '',
      message: '',
      template: 'classic',
      selectedMomentIds: []
    });
    setShowCreateCard(true);
  };

  // Save a thank you card
  const handleSaveCard = async () => {
    if (!isAdmin) return;
    
    // Validate form
    if (!cardForm.recipientName.trim()) {
      alert('Bitte gib einen Empfängernamen ein.');
      return;
    }
    
    if (!cardForm.message.trim()) {
      alert('Bitte gib eine Nachricht ein.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create card data
      const cardData = {
        recipientName: cardForm.recipientName.trim(),
        recipientEmail: cardForm.recipientEmail.trim(),
        message: cardForm.message.trim(),
        template: cardForm.template,
        selectedMomentIds: cardForm.selectedMomentIds,
        status: 'draft' as const,
        createdBy: userName,
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'thankYouCards'), cardData);
      
      alert(`Dankeskarte für ${cardForm.recipientName} wurde erstellt.`);
      
      // Reset form and close modal
      setShowCreateCard(false);
      setCardForm({
        recipientName: '',
        recipientEmail: '',
        message: '',
        template: 'classic',
        selectedMomentIds: []
      });
      
    } catch (error: any) {
      console.error('Error saving card:', error);
      alert(`Fehler beim Speichern der Dankeskarte: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle media item selection
  const toggleMediaItemSelection = (item: MediaItem) => {
    if (selectedMediaItems.some(selected => selected.id === item.id)) {
      setSelectedMediaItems(prev => prev.filter(selected => selected.id !== item.id));
    } else {
      setSelectedMediaItems(prev => [...prev, item]);
    }
  };

  // Toggle moment selection for thank you cards
  const toggleMomentSelection = (momentId: string) => {
    if (cardForm.selectedMomentIds.includes(momentId)) {
      setCardForm(prev => ({
        ...prev,
        selectedMomentIds: prev.selectedMomentIds.filter(id => id !== momentId)
      }));
    } else {
      setCardForm(prev => ({
        ...prev,
        selectedMomentIds: [...prev.selectedMomentIds, momentId]
      }));
    }
  };

  // Share recap
  const handleShareRecap = () => {
    // Generate a unique link for sharing
    const shareUrl = `${window.location.origin}/recap`;
    
    // Try to use the Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: 'Kristin & Maurizio - Hochzeits-Erinnerungen',
        text: 'Schaut euch unsere wunderschönen Hochzeits-Erinnerungen an!',
        url: shareUrl
      }).catch(err => {
        console.log('Error sharing:', err);
        // Fallback to clipboard
        navigator.clipboard.writeText(shareUrl);
        alert('Link zur Zusammenfassung wurde in die Zwischenablage kopiert!');
      });
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(shareUrl);
      alert('Link zur Zusammenfassung wurde in die Zwischenablage kopiert!');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Ungültiges Datum';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ceremony': return <Heart className="w-5 h-5" />;
      case 'reception': return <Users className="w-5 h-5" />;
      case 'party': return <Sparkles className="w-5 h-5" />;
      case 'special': return <Star className="w-5 h-5" />;
      default: return <Camera className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ceremony': return 'bg-pink-500';
      case 'reception': return 'bg-blue-500';
      case 'party': return 'bg-purple-500';
      case 'special': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  // Error handling
  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">
            <AlertCircle className={`w-8 h-8 transition-colors duration-300 ${
              isDarkMode ? 'text-red-400' : 'text-red-500'
            }`} />
          </div>
          <h3 className={`text-xl font-semibold mb-4 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Fehler beim Laden der Daten
          </h3>
          <p className={`mb-6 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className={`px-6 py-3 rounded-xl transition-colors duration-300 ${
              isDarkMode ? 'bg-pink-600 hover:bg-pink-700 text-white' : 'bg-pink-500 hover:bg-pink-600 text-white'
            }`}
          >
            Seite neu laden
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          <p className={`text-lg transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {loadingStatus}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <div className={`border-b transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className={`p-2 rounded-full transition-colors duration-300 ${
                  isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full transition-colors duration-300 ${
                  isDarkMode ? 'bg-pink-600' : 'bg-pink-500'
                }`}>
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className={`text-3xl font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    💕 Post-Hochzeits-Zusammenfassung
                  </h1>
                  <p className={`text-lg transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Kristin & Maurizio • 12. Juli 2025
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleShareRecap}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                <Share2 className="w-4 h-4" />
                Teilen
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className={`border-b transition-colors duration-300 ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {[
              { id: 'moments', label: 'Momente sammeln', icon: <Camera className="w-4 h-4" /> },
              { id: 'cards', label: 'Dankeskarten', icon: <Mail className="w-4 h-4" /> },
              { id: 'share', label: 'Teilen & Verteilen', icon: <Share2 className="w-4 h-4" /> },
              { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium transition-all duration-300 ${
                  activeSection === tab.id
                    ? isDarkMode
                      ? 'border-pink-400 text-pink-400'
                      : 'border-pink-600 text-pink-600'
                    : isDarkMode
                      ? 'border-transparent text-gray-400 hover:text-gray-200'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeSection === 'moments' && (
          <div>
            {/* Moments Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className={`text-2xl font-bold mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  📸 Momente sammeln
                </h2>
                <p className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Wähle und organisiere die schönsten Erinnerungen von eurer Hochzeit
                </p>
              </div>
              <button
                onClick={handleCreateMoment}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors duration-300 ${
                  isSubmitting
                    ? 'cursor-not-allowed opacity-70'
                    : ''
                } ${
                  isDarkMode 
                    ? 'bg-pink-600 hover:bg-pink-700 text-white' 
                    : 'bg-pink-500 hover:bg-pink-600 text-white'
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Moment hinzufügen
              </button>
            </div>

            {/* Moments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {moments.length > 0 ? moments.map((moment) => {
                // Find media items for this moment
                const momentMediaItems = mediaItems.filter(item => 
                  moment.mediaItemIds && moment.mediaItemIds.includes(item.id)
                );
                
                return (
                  <div
                    key={moment.id}
                    className={`rounded-2xl border transition-all duration-300 hover:scale-105 cursor-pointer ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
                        : 'bg-white border-gray-200 hover:bg-gray-50 shadow-lg'
                    }`}
                    onClick={() => setSelectedMoment(moment)}
                  >
                    {/* Moment Header */}
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full text-white ${getCategoryColor(moment.category)}`}>
                            {getCategoryIcon(moment.category)}
                          </div>
                          <div>
                            <h3 className={`font-semibold transition-colors duration-300 ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {moment.title}
                            </h3>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className={`w-3 h-3 transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }`} />
                              <span className={`transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                {formatDate(moment.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditMoment(moment);
                            }}
                            className={`p-2 rounded-full transition-colors duration-300 ${
                              isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                            }`}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMoment(moment);
                            }}
                            className={`p-2 rounded-full transition-colors duration-300 ${
                              isDarkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-red-50 text-red-600'
                            }`}
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <p className={`text-sm mb-4 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {moment.description}
                      </p>

                      {/* Media Preview */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {momentMediaItems.slice(0, 3).map((media, index) => (
                          <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-200">
                            {media.type === 'image' && media.url ? (
                              <img
                                src={media.url}
                                alt={media.name}
                                className="w-full h-full object-cover"
                              />
                            ) : media.type === 'video' && media.url ? (
                              <video
                                src={media.url}
                                className="w-full h-full object-cover"
                                muted
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                {media.type === 'note' ? (
                                  <MessageSquare className="w-6 h-6 text-gray-400" />
                                ) : (
                                  <Camera className="w-6 h-6 text-gray-400" />
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {momentMediaItems.length === 0 && (
                          <div className="col-span-3 aspect-video rounded-lg flex items-center justify-center bg-gray-100">
                            <div className="text-center">
                              <Camera className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-sm text-gray-500">Keine Medien</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        {moment.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className={`px-2 py-1 rounded-full text-xs transition-colors duration-300 ${
                              isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                        {moment.tags.length > 3 && (
                          <span className={`px-2 py-1 rounded-full text-xs transition-colors duration-300 ${
                            isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                          }`}>
                            +{moment.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Moment Footer */}
                    <div className={`px-6 py-4 border-t flex items-center justify-between transition-colors duration-300 ${
                      isDarkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Image className={`w-4 h-4 transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`} />
                          <span className={`transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {momentMediaItems.length}
                          </span>
                        </div>
                        {moment.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className={`w-4 h-4 transition-colors duration-300 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`} />
                            <span className={`transition-colors duration-300 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {moment.location}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="col-span-3 text-center py-12">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    <Camera className={`w-8 h-8 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`} />
                  </div>
                  <h3 className={`text-xl font-light mb-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Noch keine Momente
                  </h3>
                  <p className={`text-sm mb-6 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Erstelle deinen ersten Moment, um Erinnerungen zu sammeln
                  </p>
                  <button
                    onClick={handleCreateMoment}
                    className={`px-6 py-3 rounded-xl transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-pink-600 hover:bg-pink-700 text-white' 
                        : 'bg-pink-500 hover:bg-pink-600 text-white'
                    }`}
                  >
                    Ersten Moment erstellen
                  </button>
                </div>
              )}

              {/* Add Moment Card */}
              <div
                onClick={handleCreateMoment}
                className={`rounded-2xl border-2 border-dashed transition-all duration-300 hover:scale-105 cursor-pointer flex items-center justify-center min-h-[300px] ${
                  isDarkMode 
                    ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/50' 
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                <div className="text-center">
                  <Plus className={`w-12 h-12 mx-auto mb-4 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                  <h3 className={`text-lg font-semibold mb-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Neuen Moment hinzufügen
                  </h3>
                  <p className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    Sammle weitere Erinnerungen
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'cards' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className={`text-2xl font-bold mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  💌 Dankeskarten
                </h2>
                <p className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Erstelle persönliche Dankeskarten für eure Gäste
                </p>
              </div>
              <button
                onClick={handleCreateCard}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors duration-300 ${
                  isSubmitting
                    ? 'cursor-not-allowed opacity-70'
                    : ''
                } ${
                  isDarkMode 
                    ? 'bg-pink-600 hover:bg-pink-700 text-white' 
                    : 'bg-pink-500 hover:bg-pink-600 text-white'
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Dankeskarte erstellen
              </button>
            </div>

            {/* Cards Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {thankYouCards.length > 0 ? thankYouCards.map(card => (
                <div 
                  key={card.id}
                  className={`rounded-2xl border p-6 transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-700' 
                      : 'bg-white border-gray-200 shadow-lg'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`font-semibold transition-colors duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {card.recipientName}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs transition-colors duration-300 ${
                      card.status === 'sent'
                        ? isDarkMode ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'
                        : isDarkMode ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {card.status === 'sent' ? 'Versendet' : 'Entwurf'}
                    </span>
                  </div>
                  <p className={`text-sm mb-4 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {card.message.length > 100 
                      ? `${card.message.substring(0, 100)}...` 
                      : card.message}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className={`w-4 h-4 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <span className={`transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {card.status === 'sent' 
                        ? `Versendet am ${formatDate(card.sentAt || card.createdAt)}`
                        : `Erstellt am ${formatDate(card.createdAt)}`}
                    </span>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <button
                      className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm transition-colors duration-300 ${
                        isDarkMode 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      <Edit3 className="w-3 h-3" />
                      Bearbeiten
                    </button>
                    {card.status === 'draft' && (
                      <button
                        className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm transition-colors duration-300 ${
                          isDarkMode 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                      >
                        <Send className="w-3 h-3" />
                        Senden
                      </button>
                    )}
                  </div>
                </div>
              )) : (
                <div className="col-span-3 text-center py-12">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    <Mail className={`w-8 h-8 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`} />
                  </div>
                  <h3 className={`text-xl font-light mb-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Noch keine Dankeskarten
                  </h3>
                  <p className={`text-sm mb-6 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Erstelle deine erste Dankeskarte, um deinen Gästen zu danken
                  </p>
                  <button
                    onClick={handleCreateCard}
                    className={`px-6 py-3 rounded-xl transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-pink-600 hover:bg-pink-700 text-white' 
                        : 'bg-pink-500 hover:bg-pink-600 text-white'
                    }`}
                  >
                    Erste Dankeskarte erstellen
                  </button>
                </div>
              )}

              {/* Add Card */}
              <div
                onClick={handleCreateCard}
                className={`rounded-2xl border-2 border-dashed transition-all duration-300 hover:scale-105 cursor-pointer flex items-center justify-center min-h-[200px] ${
                  isDarkMode 
                    ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/50' 
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                <div className="text-center">
                  <Mail className={`w-8 h-8 mx-auto mb-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                  <p className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Neue Dankeskarte
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'share' && (
          <div>
            <h2 className={`text-2xl font-bold mb-8 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              🌐 Teilen & Verteilen
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Share Options */}
              <div className={`p-6 rounded-xl transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-lg'
              }`}>
                <h3 className={`text-xl font-bold mb-4 transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Freigabe-Optionen
                </h3>
                
                <div className="space-y-4">
                  <button
                    onClick={handleShareRecap}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    <Share2 className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-semibold">Direkter Link</div>
                      <div className="text-sm opacity-90">Link kopieren und teilen</div>
                    </div>
                  </button>

                  <button className={`w-full flex items-center gap-3 p-4 rounded-xl transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}>
                    <Mail className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-semibold">E-Mail versenden</div>
                      <div className="text-sm opacity-90">An alle Gäste senden</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Share Preview */}
              <div className={`rounded-xl border p-6 transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200 shadow-lg'
              }`}>
                <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Vorschau
                </h3>
                
                <div className={`p-4 rounded-lg transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <div className="text-center">
                    <div className="text-4xl mb-2">💕</div>
                    <h4 className={`font-semibold mb-2 transition-colors duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Kristin & Maurizio
                    </h4>
                    <p className={`text-sm transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Unsere Hochzeits-Zusammenfassung
                    </p>
                    <p className={`text-xs mt-2 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      12. Juli 2025
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'analytics' && (
          <div>
            <h2 className={`text-2xl font-bold mb-8 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              📊 Analytics & Einblicke
            </h2>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className={`rounded-2xl border p-6 transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200 shadow-lg'
              }`}>
                <div className="flex items-center gap-3 mb-2">
                  <Eye className="w-5 h-5 text-blue-500" />
                  <span className={`font-semibold text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Aufrufe
                  </span>
                </div>
                <div className={`text-3xl font-bold transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {analytics.totalViews.toLocaleString()}
                </div>
              </div>

              <div className={`rounded-2xl border p-6 transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200 shadow-lg'
              }`}>
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-green-500" />
                  <span className={`font-semibold text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Besucher
                  </span>
                </div>
                <div className={`text-3xl font-bold transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {analytics.uniqueVisitors}
                </div>
              </div>

              <div className={`rounded-2xl border p-6 transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200 shadow-lg'
              }`}>
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-5 h-5 text-purple-500" />
                  <span className={`font-semibold text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Verweildauer
                  </span>
                </div>
                <div className={`text-3xl font-bold transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {analytics.averageTimeSpent}
                </div>
              </div>

              <div className={`rounded-2xl border p-6 transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200 shadow-lg'
              }`}>
                <div className="flex items-center gap-3 mb-2">
                  <ThumbsUp className="w-5 h-5 text-yellow-500" />
                  <span className={`font-semibold text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Bewertung
                  </span>
                </div>
                <div className={`text-3xl font-bold transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  4.9/5
                </div>
              </div>
            </div>

            {/* Feedback */}
            <div className={`rounded-2xl border p-6 transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200 shadow-lg'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                💬 Gäste-Feedback
              </h3>
              
              <div className="space-y-4">
                {analytics.feedback.length > 0 ? (
                  analytics.feedback.map((feedback) => (
                    <div key={feedback.id} className={`p-4 rounded-lg transition-colors duration-300 ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < feedback.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className={`text-sm transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {formatDate(feedback.timestamp)}
                        </span>
                      </div>
                      <p className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        "{feedback.comment}"
                      </p>
                    </div>
                  ))
                ) : (
                  <div className={`p-8 text-center transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Noch kein Feedback vorhanden</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Moment Modal */}
      {showCreateMoment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {editingMoment ? 'Moment bearbeiten' : 'Neuen Moment erstellen'}
              </h3>
              <button
                onClick={() => setShowCreateMoment(false)}
                className={`p-2 rounded-full transition-colors duration-300 ${
                  isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Titel *
                  </label>
                  <input
                    type="text"
                    value={momentForm.title}
                    onChange={(e) => setMomentForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="z.B. Die Zeremonie"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-colors duration-300 ${
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
                    Beschreibung
                  </label>
                  <textarea
                    value={momentForm.description}
                    onChange={(e) => setMomentForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Beschreibe diesen besonderen Moment..."
                    rows={3}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none resize-none transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>

                {/* Category */}
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Kategorie
                  </label>
                  <select
                    value={momentForm.category}
                    onChange={(e) => setMomentForm(prev => ({ ...prev, category: e.target.value as Moment['category'] }))}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="ceremony">💕 Zeremonie</option>
                    <option value="reception">🎉 Feier</option>
                    <option value="party">💃 Party</option>
                    <option value="special">⭐ Besondere Momente</option>
                    <option value="custom">✨ Eigene Kategorie</option>
                  </select>
                </div>

                {/* Date & Location */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Datum *
                    </label>
                    <input
                      type="date"
                      value={momentForm.timestamp}
                      onChange={(e) => setMomentForm(prev => ({ ...prev, timestamp: e.target.value }))}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-colors duration-300 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Ort
                    </label>
                    <input
                      type="text"
                      value={momentForm.location}
                      onChange={(e) => setMomentForm(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="z.B. Kirche"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-colors duration-300 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Tags (durch Komma getrennt)
                  </label>
                  <input
                    type="text"
                    value={momentForm.tags}
                    onChange={(e) => setMomentForm(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="z.B. Zeremonie, Kirche, Emotionen"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <div className="mb-4">
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Medien auswählen
                  </label>
                  <div className={`p-4 border-2 border-dashed rounded-lg transition-colors duration-300 ${
                    isDarkMode 
                      ? 'border-gray-600 bg-gray-700/30' 
                      : 'border-gray-300 bg-gray-50'
                  }`}>
                    <div className="text-center mb-4">
                      <Camera className={`w-8 h-8 mx-auto mb-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                      <p className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        Wähle Bilder, Videos und Notizen aus der Galerie
                      </p>
                    </div>
                    
                    <div className={`text-xs mb-2 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {selectedMediaItems.length} von {mediaItems.length} Medien ausgewählt
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto">
                      <div className="grid grid-cols-3 gap-2">
                        {mediaItems.map(item => (
                          <div 
                            key={item.id}
                            onClick={() => toggleMediaItemSelection(item)}
                            className={`aspect-square rounded-lg overflow-hidden cursor-pointer relative transition-all duration-300 ${
                              selectedMediaItems.some(selected => selected.id === item.id)
                                ? 'ring-2 ring-pink-500 scale-95'
                                : 'hover:opacity-80'
                            }`}
                          >
                            {item.type === 'image' && item.url ? (
                              <img
                                src={item.url}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : item.type === 'video' && item.url ? (
                              <video
                                src={item.url}
                                className="w-full h-full object-cover"
                                muted
                              />
                            ) : item.type === 'note' ? (
                              <div className={`w-full h-full flex items-center justify-center p-2 transition-colors duration-300 ${
                                isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                              }`}>
                                <div className="text-center">
                                  <MessageSquare className={`w-4 h-4 mx-auto mb-1 transition-colors duration-300 ${
                                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                  }`} />
                                  <p className={`text-xs line-clamp-2 transition-colors duration-300 ${
                                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                  }`}>
                                    {item.noteText?.substring(0, 20)}...
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className={`w-full h-full flex items-center justify-center transition-colors duration-300 ${
                                isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                              }`}>
                                <Camera className={`w-6 h-6 transition-colors duration-300 ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`} />
                              </div>
                            )}
                            
                            {/* Selection indicator */}
                            {selectedMediaItems.some(selected => selected.id === item.id) && (
                              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                                <div className="bg-pink-500 rounded-full p-1">
                                  <Check className="w-4 h-4 text-white" />
                                </div>
                              </div>
                            )}
                            
                            {/* Type indicator */}
                            <div className="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1">
                              {item.type === 'image' ? (
                                <Image className="w-3 h-3 text-white" />
                              ) : item.type === 'video' ? (
                                <Video className="w-3 h-3 text-white" />
                              ) : (
                                <MessageSquare className="w-3 h-3 text-white" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Selected Media Preview */}
                {selectedMediaItems.length > 0 && (
                  <div className="mb-4">
                    <h4 className={`text-sm font-medium mb-2 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Ausgewählte Medien
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMediaItems.map(item => (
                        <div 
                          key={item.id}
                          className="relative"
                        >
                          <div className="w-16 h-16 rounded-lg overflow-hidden">
                            {item.type === 'image' && item.url ? (
                              <img
                                src={item.url}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : item.type === 'video' && item.url ? (
                              <video
                                src={item.url}
                                className="w-full h-full object-cover"
                                muted
                              />
                            ) : item.type === 'note' ? (
                              <div className={`w-full h-full flex items-center justify-center transition-colors duration-300 ${
                                isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                              }`}>
                                <MessageSquare className={`w-6 h-6 transition-colors duration-300 ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                }`} />
                              </div>
                            ) : (
                              <div className={`w-full h-full flex items-center justify-center transition-colors duration-300 ${
                                isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                              }`}>
                                <Camera className={`w-6 h-6 transition-colors duration-300 ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`} />
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => toggleMediaItemSelection(item)}
                            className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateMoment(false)}
                className={`px-4 py-2 rounded-lg transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' 
                    : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                }`}
                disabled={isSubmitting}
              >
                Abbrechen
              </button>
              <button
                onClick={handleSaveMoment}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-300 ${
                  isSubmitting
                    ? 'cursor-not-allowed opacity-70'
                    : ''
                } ${
                  isDarkMode 
                    ? 'bg-pink-600 hover:bg-pink-700 text-white' 
                    : 'bg-pink-500 hover:bg-pink-600 text-white'
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {editingMoment ? 'Speichern' : 'Erstellen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Thank You Card Modal */}
      {showCreateCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Neue Dankeskarte erstellen
              </h3>
              <button
                onClick={() => setShowCreateCard(false)}
                className={`p-2 rounded-full transition-colors duration-300 ${
                  isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {/* Recipient Name */}
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Empfänger Name *
                  </label>
                  <input
                    type="text"
                    value={cardForm.recipientName}
                    onChange={(e) => setCardForm(prev => ({ ...prev, recipientName: e.target.value }))}
                    placeholder="z.B. Familie Schmidt"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    required
                  />
                </div>

                {/* Recipient Email */}
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    E-Mail (optional)
                  </label>
                  <input
                    type="email"
                    value={cardForm.recipientEmail}
                    onChange={(e) => setCardForm(prev => ({ ...prev, recipientEmail: e.target.value }))}
                    placeholder="email@beispiel.de"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>

                {/* Message */}
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Nachricht *
                  </label>
                  <textarea
                    value={cardForm.message}
                    onChange={(e) => setCardForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Liebe Familie Schmidt, vielen Dank für eure Teilnahme an unserem besonderen Tag..."
                    rows={5}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none resize-none transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    required
                  />
                </div>

                {/* Template Selection */}
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Vorlage
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['classic', 'modern', 'elegant'].map(template => (
                      <div
                        key={template}
                        onClick={() => setCardForm(prev => ({ ...prev, template }))}
                        className={`aspect-video rounded-lg overflow-hidden cursor-pointer transition-all duration-300 ${
                          cardForm.template === template
                            ? 'ring-2 ring-pink-500 scale-95'
                            : 'hover:opacity-80'
                        }`}
                      >
                        <div className={`w-full h-full flex items-center justify-center transition-colors duration-300 ${
                          isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                        }`}>
                          <div className="text-center">
                            <p className={`font-medium capitalize transition-colors duration-300 ${
                              isDarkMode ? 'text-white' : 'text-gray-800'
                            }`}>
                              {template}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-4">
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Momente auswählen
                  </label>
                  <div className={`p-4 border-2 border-dashed rounded-lg transition-colors duration-300 ${
                    isDarkMode 
                      ? 'border-gray-600 bg-gray-700/30' 
                      : 'border-gray-300 bg-gray-50'
                  }`}>
                    <div className="text-center mb-4">
                      <Camera className={`w-8 h-8 mx-auto mb-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                      <p className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        Wähle Momente aus, die in der Dankeskarte erscheinen sollen
                      </p>
                    </div>
                    
                    <div className={`text-xs mb-2 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {cardForm.selectedMomentIds.length} von {moments.length} Momenten ausgewählt
                    </div>
                    
                    {moments.length > 0 ? (
                      <div className="max-h-64 overflow-y-auto">
                        <div className="space-y-2">
                          {moments.map(moment => {
                            const isSelected = cardForm.selectedMomentIds.includes(moment.id);
                            
                            return (
                              <div 
                                key={moment.id}
                                onClick={() => toggleMomentSelection(moment.id)}
                                className={`p-3 rounded-lg cursor-pointer transition-all duration-300 ${
                                  isSelected
                                    ? isDarkMode
                                      ? 'bg-pink-900/30 border border-pink-700/50'
                                      : 'bg-pink-50 border border-pink-200'
                                    : isDarkMode
                                      ? 'bg-gray-700 hover:bg-gray-600 border border-gray-600'
                                      : 'bg-white hover:bg-gray-50 border border-gray-200'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 transition-colors duration-300 ${
                                    isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                                  }`}>
                                    {/* Find first image for this moment */}
                                    {(() => {
                                      const momentMediaItems = mediaItems.filter(item => 
                                        moment.mediaItemIds && moment.mediaItemIds.includes(item.id)
                                      );
                                      
                                      const firstImage = momentMediaItems.find(item => item.type === 'image' && item.url);
                                      const firstVideo = momentMediaItems.find(item => item.type === 'video' && item.url);
                                      
                                      if (firstImage && firstImage.url) {
                                        return (
                                          <img
                                            src={firstImage.url}
                                            alt={moment.title}
                                            className="w-full h-full object-cover"
                                          />
                                        );
                                      } else if (firstVideo && firstVideo.url) {
                                        return (
                                          <video
                                            src={firstVideo.url}
                                            className="w-full h-full object-cover"
                                            muted
                                          />
                                        );
                                      } else {
                                        return (
                                          <div className="w-full h-full flex items-center justify-center">
                                            <Camera className={`w-5 h-5 transition-colors duration-300 ${
                                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                            }`} />
                                          </div>
                                        );
                                      }
                                    })()}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h4 className={`font-medium truncate transition-colors duration-300 ${
                                      isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                      {moment.title}
                                    </h4>
                                    <p className={`text-xs truncate transition-colors duration-300 ${
                                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                      {formatDate(moment.timestamp)}
                                      {moment.location ? ` • ${moment.location}` : ''}
                                    </p>
                                  </div>
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
                                    isSelected
                                      ? 'bg-pink-500 text-white'
                                      : isDarkMode
                                        ? 'bg-gray-600 text-gray-400'
                                        : 'bg-gray-200 text-gray-500'
                                  }`}>
                                    {isSelected && <Check className="w-3 h-3" />}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className={`text-center py-4 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <p>Keine Momente verfügbar</p>
                        <p className="text-xs mt-1">Erstelle zuerst Momente</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Card Preview */}
                <div>
                  <h4 className={`text-sm font-medium mb-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Vorschau
                  </h4>
                  <div className={`p-4 rounded-lg transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <div className="text-center">
                      <div className="text-4xl mb-2">💌</div>
                      <h4 className={`font-semibold mb-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {cardForm.recipientName || 'Empfänger'}
                      </h4>
                      <p className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {cardForm.message 
                          ? cardForm.message.length > 50 
                            ? `${cardForm.message.substring(0, 50)}...` 
                            : cardForm.message
                          : 'Deine Nachricht erscheint hier'}
                      </p>
                      <p className={`text-xs mt-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Vorlage: {cardForm.template}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateCard(false)}
                className={`px-4 py-2 rounded-lg transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' 
                    : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                }`}
                disabled={isSubmitting}
              >
                Abbrechen
              </button>
              <button
                onClick={handleSaveCard}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-300 ${
                  isSubmitting
                    ? 'cursor-not-allowed opacity-70'
                    : ''
                } ${
                  isDarkMode 
                    ? 'bg-pink-600 hover:bg-pink-700 text-white' 
                    : 'bg-pink-500 hover:bg-pink-600 text-white'
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Erstellen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Moment Modal */}
      {selectedMoment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-6 border-b transition-colors duration-300 ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full text-white ${getCategoryColor(selectedMoment.category)}`}>
                  {getCategoryIcon(selectedMoment.category)}
                </div>
                <div>
                  <h3 className={`text-xl font-semibold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {selectedMoment.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm">
                    <div className={`flex items-center gap-1 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(selectedMoment.timestamp)}</span>
                    </div>
                    {selectedMoment.location && (
                      <div className={`flex items-center gap-1 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        <MapPin className="w-4 h-4" />
                        <span>{selectedMoment.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditMoment(selectedMoment)}
                  className={`p-2 rounded-full transition-colors duration-300 ${
                    isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <Edit3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSelectedMoment(null)}
                  className={`p-2 rounded-full transition-colors duration-300 ${
                    isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <p className={`text-base mb-6 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {selectedMoment.description || 'Keine Beschreibung vorhanden.'}
              </p>

              {/* Media Grid */}
              <div className="mb-6">
                <h4 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Medien
                </h4>
                
                {(() => {
                  // Find media items for this moment
                  const momentMediaItems = mediaItems.filter(item => 
                    selectedMoment.mediaItemIds && selectedMoment.mediaItemIds.includes(item.id)
                  );
                  
                  if (momentMediaItems.length === 0) {
                    return (
                      <div className={`text-center py-8 rounded-lg transition-colors duration-300 ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                      }`}>
                        <Camera className={`w-12 h-12 mx-auto mb-3 transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-500' : 'text-gray-400'
                        }`} />
                        <p className={`transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          Keine Medien für diesen Moment
                        </p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {momentMediaItems.map((media, index) => (
                        <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-200 group">
                          {media.type === 'image' && media.url ? (
                            <img
                              src={media.url}
                              alt={media.name}
                              className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-110"
                              onClick={() => window.open(media.url, '_blank')}
                            />
                          ) : media.type === 'video' && media.url ? (
                            <video
                              src={media.url}
                              className="w-full h-full object-cover cursor-pointer"
                              controls
                              preload="metadata"
                            />
                          ) : media.type === 'note' ? (
                            <div className={`w-full h-full flex items-center justify-center p-4 transition-colors duration-300 ${
                              isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                            }`}>
                              <div className="text-center">
                                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-pink-500" />
                                <p className={`text-xs transition-colors duration-300 ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  "{media.noteText?.substring(0, 50)}..."
                                </p>
                                <p className={`text-xs mt-1 transition-colors duration-300 ${
                                  isDarkMode ? 'text-gray-500' : 'text-gray-500'
                                }`}>
                                  von {media.uploadedBy}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Camera className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          
                          {/* Media type indicator */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="bg-black/60 rounded-full p-1">
                              {media.type === 'video' ? (
                                <Video className="w-3 h-3 text-white" />
                              ) : media.type === 'image' ? (
                                <Camera className="w-3 h-3 text-white" />
                              ) : (
                                <MessageSquare className="w-3 h-3 text-white" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Tags */}
              {selectedMoment.tags && selectedMoment.tags.length > 0 && (
                <div className="mb-6">
                  <h4 className={`text-sm font-semibold mb-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMoment.tags.map((tag, index) => (
                      <span
                        key={index}
                        className={`px-3 py-1 rounded-full text-sm transition-colors duration-300 ${
                          isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setSelectedMoment(null)}
                  className={`px-4 py-2 rounded-lg transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' 
                      : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                  }`}
                >
                  Schließen
                </button>
                <button
                  onClick={() => handleEditMoment(selectedMoment)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  <Edit3 className="w-4 h-4" />
                  Bearbeiten
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};