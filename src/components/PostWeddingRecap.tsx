import React, { useState, useEffect } from 'react';
import { Heart, Camera, Download, Mail, Share2, BarChart3, Users, Calendar, MapPin, MessageSquare, Star, ArrowLeft, Plus, Edit3, Trash2, Send, Eye, ThumbsUp, X, Image, Video, FileText, Gift, Sparkles, Crown, Award } from 'lucide-react';
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
  getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';

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
  mediaItems: MediaItem[];
  category: 'ceremony' | 'reception' | 'party' | 'special' | 'custom';
  timestamp: string;
  location?: string;
  tags: string[];
}

interface ThankYouCard {
  id: string;
  recipientName: string;
  recipientEmail: string;
  message: string;
  template: string;
  selectedMoments: string[];
  status: 'draft' | 'sent';
  sentAt?: string;
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
  const [showCreateMoment, setShowCreateMoment] = useState(false);
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [selectedMoment, setSelectedMoment] = useState<Moment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize with data from Firebase
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Load moments from Firestore
      const loadMoments = async () => {
        console.log('🔄 Loading moments from Firestore...');
        
        try {
          const q = query(collection(db, 'moments'), orderBy('timestamp', 'desc'));
          
          const unsubscribe = onSnapshot(q, 
            (snapshot) => {
              console.log(`📋 Moments loaded: ${snapshot.docs.length}`);
              
              // Process moments and attach media items
              const processedMoments: Moment[] = [];
              
              snapshot.docs.forEach(doc => {
                try {
                  const momentData = doc.data();
                  
                  // Find media items for this moment
                  const momentMediaItems: MediaItem[] = [];
                  
                  if (momentData.mediaIds && Array.isArray(momentData.mediaIds)) {
                    momentData.mediaIds.forEach((mediaId: string) => {
                      const mediaItem = mediaItems.find(item => item.id === mediaId);
                      if (mediaItem) {
                        momentMediaItems.push(mediaItem);
                      }
                    });
                  }
                  
                  // Create moment object
                  const moment: Moment = {
                    id: doc.id,
                    title: momentData.title || 'Untitled Moment',
                    description: momentData.description || '',
                    mediaItems: momentMediaItems,
                    category: momentData.category || 'custom',
                    timestamp: momentData.timestamp || new Date().toISOString(),
                    location: momentData.location,
                    tags: momentData.tags || []
                  };
                  
                  processedMoments.push(moment);
                } catch (docError) {
                  console.error('Error processing moment document:', docError);
                }
              });
              
              setMoments(processedMoments);
              setIsLoading(false);
              setError(null);
            },
            (error) => {
              console.error('Error loading moments:', error);
              setError('Fehler beim Laden der Momente: ' + error.message);
              setIsLoading(false);
              
              // Create sample moments as fallback
              createSampleMoments();
            }
          );
          
          return unsubscribe;
        } catch (error: any) {
          console.error('Error setting up moments listener:', error);
          setError('Fehler beim Einrichten des Moment-Listeners: ' + error.message);
          setIsLoading(false);
          
          // Create sample moments as fallback
          createSampleMoments();
          return () => {};
        }
      };
      
      // Load thank you cards
      const loadThankYouCards = async () => {
        try {
          const q = query(collection(db, 'thankYouCards'), orderBy('createdAt', 'desc'));
          
          const unsubscribe = onSnapshot(q, 
            (snapshot) => {
              const cards = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              } as ThankYouCard));
              
              setThankYouCards(cards);
            },
            (error) => {
              console.error('Error loading thank you cards:', error);
              // Don't set error state here to avoid blocking the UI
            }
          );
          
          return unsubscribe;
        } catch (error) {
          console.error('Error setting up thank you cards listener:', error);
          return () => {};
        }
      };
      
      // Load analytics
      const loadAnalytics = async () => {
        try {
          // Get view counts
          const viewsQuery = query(collection(db, 'recapViews'));
          const viewsSnapshot = await getDocs(viewsQuery);
          const totalViews = viewsSnapshot.size;
          
          // Get unique visitors
          const visitorsQuery = query(collection(db, 'recapVisitors'));
          const visitorsSnapshot = await getDocs(visitorsQuery);
          const uniqueVisitors = visitorsSnapshot.size;
          
          // Get feedback
          const feedbackQuery = query(collection(db, 'recapFeedback'), orderBy('timestamp', 'desc'));
          const feedbackSnapshot = await getDocs(feedbackQuery);
          const feedback = feedbackSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Analytics['feedback'];
          
          // Calculate average time spent
          let totalTimeSpent = 0;
          let timeEntries = 0;
          
          const timeQuery = query(collection(db, 'recapTimeSpent'));
          const timeSnapshot = await getDocs(timeQuery);
          
          timeSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.duration) {
              totalTimeSpent += data.duration;
              timeEntries++;
            }
          });
          
          const avgTimeSeconds = timeEntries > 0 ? Math.floor(totalTimeSpent / timeEntries) : 0;
          const minutes = Math.floor(avgTimeSeconds / 60);
          const seconds = avgTimeSeconds % 60;
          const averageTimeSpent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
          
          // Get most viewed moments
          const momentViewsQuery = query(collection(db, 'momentViews'), orderBy('count', 'desc'), where('count', '>', 0));
          const momentViewsSnapshot = await getDocs(momentViewsQuery);
          const mostViewedMoments = momentViewsSnapshot.docs.slice(0, 5).map(doc => doc.data().title || doc.id);
          
          setAnalytics({
            totalViews,
            uniqueVisitors,
            averageTimeSpent,
            mostViewedMoments,
            feedback
          });
          
        } catch (error) {
          console.error('Error loading analytics:', error);
          // Use sample analytics as fallback
          setAnalytics({
            totalViews: 1247,
            uniqueVisitors: 89,
            averageTimeSpent: '4:32',
            mostViewedMoments: ['Die Zeremonie', 'Die Feier'],
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
        }
      };
      
      // Create sample moments from media items
      const createSampleMoments = () => {
        console.log('📝 Creating sample moments from media items');
        
        const sampleMoments: Moment[] = [
          {
            id: '1',
            title: 'Die Zeremonie',
            description: 'Der magische Moment unseres Ja-Worts in der wunderschönen Kirche.',
            mediaItems: mediaItems.filter(item => item.type === 'image').slice(0, 5),
            category: 'ceremony',
            timestamp: '2025-07-12T14:00:00Z',
            location: 'St. Marien Kirche',
            tags: ['Zeremonie', 'Ja-Wort', 'Kirche', 'Emotionen']
          },
          {
            id: '2',
            title: 'Die Feier',
            description: 'Ausgelassene Stimmung und unvergessliche Momente mit Familie und Freunden.',
            mediaItems: mediaItems.filter(item => item.type === 'video').slice(0, 3),
            category: 'reception',
            timestamp: '2025-07-12T18:00:00Z',
            location: 'Schloss Bellevue',
            tags: ['Feier', 'Tanz', 'Familie', 'Freunde']
          },
          {
            id: '3',
            title: 'Besondere Momente',
            description: 'Die kleinen, besonderen Augenblicke, die diesen Tag unvergesslich gemacht haben.',
            mediaItems: mediaItems.filter(item => item.type === 'note').slice(0, 4),
            category: 'special',
            timestamp: '2025-07-12T20:00:00Z',
            tags: ['Besonders', 'Erinnerungen', 'Liebe']
          }
        ];
        
        setMoments(sampleMoments);
      };
      
      // Set up listeners
      const unsubscribeMoments = loadMoments();
      const unsubscribeCards = loadThankYouCards();
      loadAnalytics();
      
      return () => {
        unsubscribeMoments();
        unsubscribeCards();
      };
    } catch (error: any) {
      console.error('Error in PostWeddingRecap setup:', error);
      setError('Fehler beim Laden der Daten: ' + error.message);
      setIsLoading(false);
    }
  }, [mediaItems]);

  const handleCreateMoment = () => {
    setShowCreateMoment(true);
  };

  const handleCreateCard = () => {
    setShowCreateCard(true);
  };

  const handleShareRecap = () => {
    // Generate a unique link for sharing
    const shareUrl = `${window.location.origin}/recap?for=${encodeURIComponent(userName)}`;
    
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
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            <Heart className={`w-8 h-8 transition-colors duration-300 ${
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
            Lade Post-Hochzeits-Zusammenfassung...
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
                onClick={() => window.close()}
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
                  isDarkMode 
                    ? 'bg-pink-600 hover:bg-pink-700 text-white' 
                    : 'bg-pink-500 hover:bg-pink-600 text-white'
                }`}
              >
                <Plus className="w-4 h-4" />
                Moment hinzufügen
              </button>
            </div>

            {/* Moments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {moments.map((moment) => (
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
                    <div className="flex items-center gap-3 mb-4">
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

                    <p className={`text-sm mb-4 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {moment.description}
                    </p>

                    {/* Media Preview */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {moment.mediaItems.slice(0, 3).map((media, index) => (
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
                          {moment.mediaItems.length}
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
              ))}

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
                  isDarkMode 
                    ? 'bg-pink-600 hover:bg-pink-700 text-white' 
                    : 'bg-pink-500 hover:bg-pink-600 text-white'
                }`}
              >
                <Plus className="w-4 h-4" />
                Dankeskarte erstellen
              </button>
            </div>

            {/* Cards Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Sample Thank You Cards */}
              <div className={`rounded-2xl border p-6 transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200 shadow-lg'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-semibold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Familie Schmidt
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs transition-colors duration-300 ${
                    isDarkMode ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'
                  }`}>
                    Versendet
                  </span>
                </div>
                <p className={`text-sm mb-4 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Liebe Familie Schmidt, vielen Dank für eure Teilnahme an unserem besonderen Tag...
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className={`w-4 h-4 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <span className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Versendet am 15. Juli 2025
                  </span>
                </div>
              </div>

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
              <div className={`rounded-2xl border p-6 transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200 shadow-lg'
              }`}>
                <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
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
              <div className={`rounded-2xl border p-6 transition-colors duration-300 ${
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
                  <span className={`text-sm font-medium transition-colors duration-300 ${
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
                  <span className={`text-sm font-medium transition-colors duration-300 ${
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
                  <span className={`text-sm font-medium transition-colors duration-300 ${
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
                  <span className={`text-sm font-medium transition-colors duration-300 ${
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
                {analytics.feedback.map((feedback) => (
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
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};