import React, { useState, useEffect } from 'react';
import { Heart, Camera, Download, Mail, Share2, BarChart3, Users, Calendar, MapPin, MessageSquare, Star, ArrowLeft, Plus, Edit3, Trash2, Send, Eye, ThumbsUp, X, Image, Video, FileText, Gift, Sparkles, Crown, Award } from 'lucide-react';
import { MediaItem } from '../types';

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
  const [showCardForm, setShowCardForm] = useState(false);
  const [newCard, setNewCard] = useState({
    recipientName: '',
    recipientEmail: '',
    message: '',
    selectedMoments: [] as string[]
  });

  // Check admin status from localStorage as well
  const [actualIsAdmin, setActualIsAdmin] = useState(false);

  useEffect(() => {
    // Check both props and localStorage for admin status
    const storedAdminStatus = localStorage.getItem('admin_status');
    const adminFromStorage = storedAdminStatus === 'true';
    
    console.log('Admin status check:', {
      propsIsAdmin: isAdmin,
      storageIsAdmin: adminFromStorage,
      userName
    });
    
    setActualIsAdmin(isAdmin || adminFromStorage);
  }, [isAdmin, userName]);

  // Initialize with sample data
  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      // Create sample moments from media items
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
      
      // Sample analytics
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
      
      // Sample thank you cards
      setThankYouCards([
        {
          id: '1',
          recipientName: 'Familie Schmidt',
          recipientEmail: 'schmidt@example.com',
          message: 'Liebe Familie Schmidt, vielen Dank für eure Teilnahme an unserem besonderen Tag...',
          template: 'elegant',
          selectedMoments: ['1', '2'],
          status: 'sent',
          sentAt: '2025-07-15T10:00:00Z'
        }
      ]);
      
      setIsLoading(false);
    }, 1000);
  }, [mediaItems]);

  const handleCreateMoment = () => {
    setShowCreateMoment(true);
  };

  const handleCreateCard = () => {
    setShowCardForm(true);
  };

  const handleSendCard = () => {
    if (!newCard.recipientName || !newCard.recipientEmail || !newCard.message) {
      alert('Bitte alle Felder ausfüllen.');
      return;
    }

    // Generate unique link for this recipient
    const guestId = Math.random().toString(36).substring(2, 15);
    const recapLink = `${window.location.origin}/recap?for=${encodeURIComponent(newCard.recipientName)}&id=${guestId}`;
    
    // Create the card
    const card: ThankYouCard = {
      id: Date.now().toString(),
      recipientName: newCard.recipientName,
      recipientEmail: newCard.recipientEmail,
      message: newCard.message,
      template: 'elegant',
      selectedMoments: newCard.selectedMoments,
      status: 'draft'
    };

    setThankYouCards(prev => [...prev, card]);
    
    // Show the generated link
    alert(`Dankeskarte erstellt! 

Individueller Link für ${newCard.recipientName}:
${recapLink}

Kopiere diesen Link und sende ihn per E-Mail, WhatsApp oder einem anderen Kanal an ${newCard.recipientName}.

Der Link führt zu einer personalisierten Recap-Seite mit animierter Slideshow und Musik.`);
    
    // Reset form
    setNewCard({
      recipientName: '',
      recipientEmail: '',
      message: '',
      selectedMoments: []
    });
    setShowCardForm(false);
  };

  const handleShareRecap = () => {
    // Implement sharing functionality
    const shareUrl = `${window.location.origin}/recap`;
    navigator.clipboard.writeText(shareUrl);
    alert('Allgemeiner Recap-Link wurde in die Zwischenablage kopiert!\n\nFür personalisierte Links erstelle individuelle Dankeskarten.');
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

  // Show access denied if not admin
  if (!actualIsAdmin) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className={`text-2xl font-bold mb-2 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Zugriff verweigert
          </h1>
          <p className={`transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Diese Seite ist nur für Administratoren zugänglich.
          </p>
          <p className={`text-sm mt-2 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-500' : 'text-gray-500'
          }`}>
            Debug: isAdmin={isAdmin ? 'true' : 'false'}, localStorage={localStorage.getItem('admin_status')}, userName={userName}
          </p>
          <button
            onClick={() => window.close()}
            className="mt-4 px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl transition-colors"
          >
            Schließen
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
              {/* Existing Thank You Cards */}
              {thankYouCards.map(card => (
                <div key={card.id} className={`rounded-2xl border p-6 transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-200 shadow-lg'
                }`}>
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
                    {card.message.length > 100 ? card.message.substring(0, 100) + '...' : card.message}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className={`w-4 h-4 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <span className={`transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {card.status === 'sent' 
                        ? `Versendet am ${new Date(card.sentAt || '').toLocaleDateString('de-DE')}`
                        : card.recipientEmail}
                    </span>
                  </div>
                  
                  {/* Preview Link */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Individueller Link:
                      </span>
                      <button
                        onClick={() => {
                          const recapLink = `${window.location.origin}/recap?for=${encodeURIComponent(card.recipientName)}&id=${card.id}`;
                          navigator.clipboard.writeText(recapLink);
                          alert(`Link für ${card.recipientName} in die Zwischenablage kopiert!`);
                        }}
                        className={`text-xs px-2 py-1 rounded transition-colors duration-300 ${
                          isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        Link kopieren
                      </button>
                    </div>
                  </div>
                </div>
              ))}

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
            
            {/* Card Creation Form */}
            {showCardForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className={`rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-xl font-semibold transition-colors duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Neue Dankeskarte erstellen
                    </h3>
                    <button
                      onClick={() => setShowCardForm(false)}
                      className={`p-2 rounded-full transition-colors duration-300 ${
                        isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Empfänger Name
                      </label>
                      <input
                        type="text"
                        value={newCard.recipientName}
                        onChange={(e) => setNewCard({...newCard, recipientName: e.target.value})}
                        className={`w-full px-4 py-2 border rounded-lg transition-colors duration-300 ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="z.B. Familie Müller"
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        E-Mail Adresse
                      </label>
                      <input
                        type="email"
                        value={newCard.recipientEmail}
                        onChange={(e) => setNewCard({...newCard, recipientEmail: e.target.value})}
                        className={`w-full px-4 py-2 border rounded-lg transition-colors duration-300 ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="email@beispiel.de"
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Nachricht
                      </label>
                      <textarea
                        value={newCard.message}
                        onChange={(e) => setNewCard({...newCard, message: e.target.value})}
                        rows={4}
                        className={`w-full px-4 py-2 border rounded-lg transition-colors duration-300 ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="Liebe Familie Müller, vielen Dank für eure Teilnahme an unserem besonderen Tag..."
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Momente auswählen
                      </label>
                      <div className={`p-4 border rounded-lg transition-colors duration-300 ${
                        isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'
                      }`}>
                        {moments.map(moment => (
                          <div key={moment.id} className="flex items-center mb-2">
                            <input
                              type="checkbox"
                              id={`moment-${moment.id}`}
                              checked={newCard.selectedMoments.includes(moment.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewCard({
                                    ...newCard, 
                                    selectedMoments: [...newCard.selectedMoments, moment.id]
                                  });
                                } else {
                                  setNewCard({
                                    ...newCard, 
                                    selectedMoments: newCard.selectedMoments.filter(id => id !== moment.id)
                                  });
                                }
                              }}
                              className="mr-2"
                            />
                            <label 
                              htmlFor={`moment-${moment.id}`}
                              className={`transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}
                            >
                              {moment.title} ({moment.mediaItems.length} Medien)
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className={`p-4 rounded-lg transition-colors duration-300 ${
                      isDarkMode ? 'bg-blue-900/20 border border-blue-700/30' : 'bg-blue-50 border border-blue-200'
                    }`}>
                      <h4 className={`font-semibold mb-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-blue-300' : 'text-blue-800'
                      }`}>
                        So funktioniert's:
                      </h4>
                      <ol className={`text-sm space-y-1 list-decimal pl-4 transition-colors duration-300 ${
                        isDarkMode ? 'text-blue-200' : 'text-blue-700'
                      }`}>
                        <li>Erstelle eine personalisierte Dankeskarte</li>
                        <li>Kopiere den generierten Link</li>
                        <li>Sende den Link per E-Mail oder Messenger an den Empfänger</li>
                        <li>Der Empfänger erhält Zugang zu einer personalisierten Recap-Seite mit Slideshow und Musik</li>
                      </ol>
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => setShowCardForm(false)}
                        className={`flex-1 py-2 px-4 rounded-lg transition-colors duration-300 ${
                          isDarkMode 
                            ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' 
                            : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                        }`}
                      >
                        Abbrechen
                      </button>
                      <button
                        onClick={handleSendCard}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors"
                      >
                        <Send className="w-4 h-4" />
                        Dankeskarte erstellen
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                      <div className="font-semibold">Allgemeiner Link</div>
                      <div className="text-sm opacity-90">Link kopieren und teilen</div>
                    </div>
                  </button>

                  <button 
                    onClick={handleCreateCard}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    <Mail className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-semibold">Personalisierte Links</div>
                      <div className="text-sm opacity-90">Individuelle Dankeskarten erstellen</div>
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
                
                <div className="mt-4">
                  <a 
                    href="/recap" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-pink-600 hover:bg-pink-700 text-white' 
                        : 'bg-pink-500 hover:bg-pink-600 text-white'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    Vorschau öffnen
                  </a>
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