import React, { useState, useEffect } from 'react';
import { Heart, Camera, Download, Mail, Share2, BarChart3, Users, Calendar, MapPin, MessageSquare, Star, ArrowLeft, Plus, Edit3, Trash2, Save, X, Image, Video, FileText, Gift, Sparkles, Crown, Award, Send } from 'lucide-react';
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
  uniqueId?: string; // Unique identifier for personalized links
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
  const [editingCard, setEditingCard] = useState<ThankYouCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [baseUrl, setBaseUrl] = useState('');

  // Initialize with sample data
  useEffect(() => {
    // Set base URL for personalized links
    setBaseUrl(window.location.origin);
    
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
      
      // Sample thank you cards with unique IDs
      const sampleCards: ThankYouCard[] = [
        {
          id: '1',
          recipientName: 'Familie Schmidt',
          recipientEmail: 'schmidt@example.com',
          message: 'Liebe Familie Schmidt,\n\nvielen Dank für eure Teilnahme an unserem besonderen Tag! Es war wunderschön, euch dabei zu haben.\n\nMit liebsten Grüßen,\nKristin & Maurizio',
          template: 'elegant',
          selectedMoments: ['1', '2'],
          status: 'draft',
          uniqueId: 'schmidt-' + Math.random().toString(36).substring(2, 10)
        },
        {
          id: '2',
          recipientName: 'Anna und Peter',
          recipientEmail: 'anna.peter@example.com',
          message: 'Liebe Anna und Peter,\n\nherzlichen Dank für euer Kommen und die wunderschönen Geschenke! Wir freuen uns schon auf unser nächstes Treffen.\n\nAlles Liebe,\nKristin & Maurizio',
          template: 'modern',
          selectedMoments: ['1', '3'],
          status: 'sent',
          sentAt: '2025-07-15T10:30:00Z',
          uniqueId: 'anna-peter-' + Math.random().toString(36).substring(2, 10)
        }
      ];

      setThankYouCards(sampleCards);
      
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
      
      setIsLoading(false);
    }, 1000);
  }, [mediaItems]);

  const handleCreateMoment = () => {
    setShowCreateMoment(true);
  };

  const handleCreateCard = () => {
    setShowCreateCard(true);
    setEditingCard(null);
  };

  const handleEditCard = (card: ThankYouCard) => {
    setEditingCard(card);
    setShowCreateCard(true);
  };

  const handleDeleteCard = (cardId: string) => {
    if (window.confirm('Dankeskarte wirklich löschen?')) {
      setThankYouCards(prev => prev.filter(card => card.id !== cardId));
    }
  };

  const handleSaveCard = (cardData: Partial<ThankYouCard>) => {
    if (editingCard) {
      // Update existing card
      setThankYouCards(prev => prev.map(card => 
        card.id === editingCard.id 
          ? { ...card, ...cardData }
          : card
      ));
    } else {
      // Create new card with unique ID
      const uniqueId = cardData.recipientName 
        ? cardData.recipientName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(2, 10)
        : 'guest-' + Math.random().toString(36).substring(2, 10);
        
      const newCard: ThankYouCard = {
        id: Date.now().toString(),
        recipientName: cardData.recipientName || '',
        recipientEmail: cardData.recipientEmail || '',
        message: cardData.message || '',
        template: cardData.template || 'elegant',
        selectedMoments: cardData.selectedMoments || [],
        status: 'draft',
        uniqueId
      };
      setThankYouCards(prev => [...prev, newCard]);
    }
    setShowCreateCard(false);
    setEditingCard(null);
  };

  const handleSendCard = (card: ThankYouCard) => {
    // Generate personalized link
    const personalizedLink = `${baseUrl}/recap?for=${encodeURIComponent(card.recipientName)}&id=${card.uniqueId}`;
    
    // Generate mailto link
    const subject = encodeURIComponent('Dankeschön für unsere Hochzeit 💕');
    const body = encodeURIComponent(
      `${card.message}\n\n` +
      `Schau dir auch unsere Hochzeits-Erinnerungen an (mit persönlicher Slideshow):\n` +
      `${personalizedLink}\n\n` +
      `Mit liebsten Grüßen,\n` +
      `Kristin & Maurizio`
    );
    
    const mailtoLink = `mailto:${card.recipientEmail}?subject=${subject}&body=${body}`;
    
    // Open email client
    window.open(mailtoLink);
    
    // Mark as sent
    setThankYouCards(prev => prev.map(c => 
      c.id === card.id 
        ? { ...c, status: 'sent' as const, sentAt: new Date().toISOString() }
        : c
    ));
  };

  const handleShareRecap = () => {
    const shareUrl = `${baseUrl}/recap`;
    navigator.clipboard.writeText(shareUrl);
    alert('Link zur öffentlichen Zusammenfassung wurde in die Zwischenablage kopiert!\n\nDiesen Link können eure Gäste verwenden: ' + shareUrl);
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

  // Generate personalized link for a card
  const getPersonalizedLink = (card: ThankYouCard) => {
    return `${baseUrl}/recap?for=${encodeURIComponent(card.recipientName)}&id=${card.uniqueId}`;
  };

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
                Öffentlichen Link teilen
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
                  Erstelle und versende persönliche Dankeskarten für eure Gäste
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

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {thankYouCards.map((card) => (
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
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs transition-colors duration-300 ${
                        card.status === 'sent'
                          ? isDarkMode ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'
                          : isDarkMode ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {card.status === 'sent' ? 'Versendet' : 'Entwurf'}
                      </span>
                      <button
                        onClick={() => handleEditCard(card)}
                        className={`p-1 rounded transition-colors duration-300 ${
                          isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                        }`}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className={`p-1 rounded transition-colors duration-300 ${
                          isDarkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-red-50 text-red-600'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <p className={`text-sm mb-4 line-clamp-3 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {card.message}
                  </p>
                  
                  <div className="flex items-center gap-2 text-sm mb-4">
                    <Mail className={`w-4 h-4 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <span className={`transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {card.recipientEmail}
                    </span>
                  </div>
                  
                  {/* Personalized Link */}
                  <div className={`mb-4 p-3 rounded-lg transition-colors duration-300 ${
                    isDarkMode ? 'bg-blue-900/20 border border-blue-700/30' : 'bg-blue-50 border border-blue-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`text-sm font-medium transition-colors duration-300 ${
                        isDarkMode ? 'text-blue-300' : 'text-blue-800'
                      }`}>
                        Persönlicher Link
                      </h4>
                      <button
                        onClick={() => {
                          const link = getPersonalizedLink(card);
                          navigator.clipboard.writeText(link);
                          alert(`Persönlicher Link für ${card.recipientName} wurde in die Zwischenablage kopiert!`);
                        }}
                        className={`p-1 rounded transition-colors duration-300 ${
                          isDarkMode ? 'hover:bg-blue-800 text-blue-300' : 'hover:bg-blue-100 text-blue-600'
                        }`}
                      >
                        <Share2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className={`text-xs truncate transition-colors duration-300 ${
                      isDarkMode ? 'text-blue-200' : 'text-blue-700'
                    }`}>
                      {getPersonalizedLink(card)}
                    </p>
                  </div>
                  
                  {card.status === 'sent' && card.sentAt && (
                    <div className="flex items-center gap-2 text-sm mb-4">
                      <Calendar className={`w-4 h-4 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                      <span className={`transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Versendet am {formatDate(card.sentAt)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    {card.status === 'draft' ? (
                      <button
                        onClick={() => handleSendCard(card)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-300 ${
                          isDarkMode 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                      >
                        <Send className="w-4 h-4" />
                        E-Mail senden
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSendCard(card)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-300 ${
                          isDarkMode 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                      >
                        <Send className="w-4 h-4" />
                        Erneut senden
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        const personalizedLink = getPersonalizedLink(card);
                        navigator.clipboard.writeText(personalizedLink);
                        alert(`Persönlicher Link für ${card.recipientName} wurde in die Zwischenablage kopiert!`);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-300 ${
                        isDarkMode 
                          ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' 
                          : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                      }`}
                    >
                      <Share2 className="w-4 h-4" />
                      Link kopieren
                    </button>
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
                      <div className="font-semibold">Öffentlicher Link</div>
                      <div className="text-sm opacity-90">Link kopieren und teilen</div>
                    </div>
                  </button>

                  <button 
                    onClick={() => {
                      const subject = encodeURIComponent('Unsere Hochzeits-Erinnerungen 💕');
                      const body = encodeURIComponent(
                        `Liebe Gäste,\n\n` +
                        `wir möchten euch herzlich für eure Teilnahme an unserer Hochzeit danken!\n\n` +
                        `Hier findet ihr eine Zusammenfassung mit allen schönen Momenten:\n` +
                        `${baseUrl}/recap\n\n` +
                        `Mit liebsten Grüßen,\n` +
                        `Kristin & Maurizio`
                      );
                      
                      window.open(`mailto:?subject=${subject}&body=${body}`);
                    }}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    <Mail className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-semibold">Gruppen-E-Mail</div>
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
                  Personalisierte Links
                </h3>
                
                <div className={`p-4 rounded-lg transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">🔗</div>
                    <h4 className={`font-semibold mb-2 transition-colors duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Individuelle Erinnerungen
                    </h4>
                    <p className={`text-sm transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Jeder Gast erhält einen personalisierten Link mit individueller Begrüßung und Slideshow
                    </p>
                  </div>
                  
                  <div className={`p-3 rounded-lg border transition-colors duration-300 ${
                    isDarkMode ? 'bg-blue-900/20 border-blue-700/30' : 'bg-blue-50 border-blue-200'
                  }`}>
                    <h4 className={`text-sm font-medium mb-2 transition-colors duration-300 ${
                      isDarkMode ? 'text-blue-300' : 'text-blue-800'
                    }`}>
                      Beispiel-Link für Familie Schmidt:
                    </h4>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={thankYouCards.length > 0 ? getPersonalizedLink(thankYouCards[0]) : `${baseUrl}/recap?for=Familie%20Schmidt`}
                        readOnly
                        className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors duration-300 ${
                          isDarkMode 
                            ? 'bg-gray-700 border border-gray-600 text-white' 
                            : 'bg-white border border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                    isDarkMode ? 'bg-pink-900/20 border-pink-700/30' : 'bg-pink-50 border-pink-200'
                  }`}>
                    <h4 className={`font-semibold mb-2 transition-colors duration-300 ${
                      isDarkMode ? 'text-pink-300' : 'text-pink-800'
                    }`}>
                      Funktionen der personalisierten Links:
                    </h4>
                    <ul className={`text-sm space-y-2 transition-colors duration-300 ${
                      isDarkMode ? 'text-pink-200' : 'text-pink-700'
                    }`}>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div>
                        <span>Persönliche Begrüßung mit Namen des Gastes</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div>
                        <span>Automatische Slideshow mit Hintergrundmusik</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div>
                        <span>Individuelle Auswahl von Momenten je nach Gast</span>
                      </li>
                    </ul>
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
                  <Star className="w-5 h-5 text-yellow-500" />
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

      {/* Create/Edit Card Modal */}
      {showCreateCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {editingCard ? 'Dankeskarte bearbeiten' : 'Neue Dankeskarte erstellen'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateCard(false);
                  setEditingCard(null);
                }}
                className={`p-2 rounded-full transition-colors duration-300 ${
                  isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <CardForm 
              initialData={editingCard}
              moments={moments}
              onSave={handleSaveCard}
              onCancel={() => {
                setShowCreateCard(false);
                setEditingCard(null);
              }}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Card Form Component
interface CardFormProps {
  initialData: ThankYouCard | null;
  moments: Moment[];
  onSave: (data: Partial<ThankYouCard>) => void;
  onCancel: () => void;
  isDarkMode: boolean;
}

const CardForm: React.FC<CardFormProps> = ({ initialData, moments, onSave, onCancel, isDarkMode }) => {
  const [formData, setFormData] = useState<Partial<ThankYouCard>>({
    recipientName: initialData?.recipientName || '',
    recipientEmail: initialData?.recipientEmail || '',
    message: initialData?.message || 'Liebe/r [Name],\n\nvielen Dank für deine Teilnahme an unserer Hochzeit! Es war wunderschön, dich dabei zu haben.\n\nMit liebsten Grüßen,\nKristin & Maurizio',
    template: initialData?.template || 'elegant',
    selectedMoments: initialData?.selectedMoments || []
  });

  const templates = [
    { id: 'elegant', name: 'Elegant', color: 'bg-pink-500' },
    { id: 'modern', name: 'Modern', color: 'bg-blue-500' },
    { id: 'rustic', name: 'Rustikal', color: 'bg-yellow-500' },
    { id: 'minimal', name: 'Minimalistisch', color: 'bg-gray-500' }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMomentToggle = (momentId: string) => {
    setFormData(prev => {
      const selectedMoments = prev.selectedMoments || [];
      if (selectedMoments.includes(momentId)) {
        return { ...prev, selectedMoments: selectedMoments.filter(id => id !== momentId) };
      } else {
        return { ...prev, selectedMoments: [...selectedMoments, momentId] };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Recipient Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Empfänger Name *
          </label>
          <input
            type="text"
            name="recipientName"
            value={formData.recipientName}
            onChange={handleChange}
            required
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-colors duration-300 ${
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
            E-Mail Adresse *
          </label>
          <input
            type="email"
            name="recipientEmail"
            value={formData.recipientEmail}
            onChange={handleChange}
            required
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            placeholder="email@beispiel.de"
          />
        </div>
      </div>

      {/* Message */}
      <div>
        <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Nachricht *
        </label>
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          rows={6}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none resize-none transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600 text-white' 
              : 'bg-white border-gray-300 text-gray-900'
          }`}
          placeholder="Deine persönliche Nachricht..."
        />
        <p className={`text-xs mt-1 transition-colors duration-300 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          Tipp: Personalisiere deine Nachricht für jeden Empfänger.
        </p>
      </div>

      {/* Template Selection */}
      <div>
        <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Design-Vorlage
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {templates.map(template => (
            <div
              key={template.id}
              onClick={() => setFormData(prev => ({ ...prev, template: template.id }))}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                formData.template === template.id
                  ? `${template.color} border-transparent text-white scale-105`
                  : isDarkMode
                    ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">
                  {template.id === 'elegant' ? '✨' : 
                   template.id === 'modern' ? '🔷' : 
                   template.id === 'rustic' ? '🌿' : '◻️'}
                </div>
                <div className={`text-sm font-medium ${
                  formData.template === template.id
                    ? 'text-white'
                    : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {template.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Moment Selection */}
      <div>
        <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Momente auswählen
        </label>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {moments.map(moment => (
            <div
              key={moment.id}
              onClick={() => handleMomentToggle(moment.id)}
              className={`p-3 rounded-lg border flex items-center gap-3 cursor-pointer transition-all duration-300 ${
                (formData.selectedMoments || []).includes(moment.id)
                  ? isDarkMode
                    ? 'bg-pink-900/30 border-pink-700/50 ring-1 ring-pink-500'
                    : 'bg-pink-50 border-pink-200 ring-1 ring-pink-500'
                  : isDarkMode
                    ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className={`w-6 h-6 rounded flex items-center justify-center transition-colors duration-300 ${
                (formData.selectedMoments || []).includes(moment.id)
                  ? 'bg-pink-500 text-white'
                  : isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
              }`}>
                {(formData.selectedMoments || []).includes(moment.id) ? '✓' : ''}
              </div>
              <div>
                <h4 className={`font-medium transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {moment.title}
                </h4>
                <p className={`text-xs transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {moment.mediaItems.length} Medien • {moment.location || 'Kein Ort'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className={`flex-1 py-3 px-4 rounded-lg transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' 
              : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
          }`}
        >
          Abbrechen
        </button>
        <button
          type="submit"
          className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-3 px-4 rounded-lg transition-colors"
        >
          {initialData ? 'Speichern' : 'Erstellen'}
        </button>
      </div>
    </form>
  );
};