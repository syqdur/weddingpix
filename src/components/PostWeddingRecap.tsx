import React, { useState, useEffect } from 'react';
import { Heart, Camera, Download, Mail, Share2, BarChart3, Users, Calendar, MapPin, MessageSquare, Star, ArrowLeft, Plus, Edit3, Trash2, Send, Eye, ThumbsUp, X, Image, Video, FileText, Gift, Sparkles, Crown, Award, Copy, Check } from 'lucide-react';
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
  personalizedLink?: string;
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
  const [activeSection, setActiveSection] = useState<'moments' | 'cards' | 'share' | 'analytics'>('cards');
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
  const [newCard, setNewCard] = useState({
    recipientName: '',
    recipientEmail: '',
    message: '',
    template: 'elegant'
  });
  const [copiedLinks, setCopiedLinks] = useState<Set<string>>(new Set());

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
          mediaItems: mediaItems.filter(item => item.type === 'image').slice(0, 8),
          category: 'ceremony',
          timestamp: '2025-07-12T14:00:00Z',
          location: 'St. Marien Kirche',
          tags: ['Zeremonie', 'Ja-Wort', 'Kirche', 'Emotionen']
        },
        {
          id: '2',
          title: 'Die Feier',
          description: 'Ausgelassene Stimmung und unvergessliche Momente mit Familie und Freunden.',
          mediaItems: mediaItems.filter(item => item.type === 'video').slice(0, 5),
          category: 'reception',
          timestamp: '2025-07-12T18:00:00Z',
          location: 'Schloss Bellevue',
          tags: ['Feier', 'Tanz', 'Familie', 'Freunde']
        },
        {
          id: '3',
          title: 'Besondere Momente',
          description: 'Die kleinen, besonderen Augenblicke, die diesen Tag unvergesslich gemacht haben.',
          mediaItems: mediaItems.filter(item => item.type === 'note').slice(0, 6),
          category: 'special',
          timestamp: '2025-07-12T20:00:00Z',
          tags: ['Besonders', 'Erinnerungen', 'Liebe']
        },
        {
          id: '4',
          title: 'Alle Erinnerungen',
          description: 'Eine Sammlung aller wunderschönen Momente von unserem besonderen Tag.',
          mediaItems: mediaItems.slice(0, 20),
          category: 'custom',
          timestamp: '2025-07-12T22:00:00Z',
          tags: ['Alle', 'Sammlung', 'Erinnerungen']
        }
      ];

      // Sample thank you cards
      const sampleCards: ThankYouCard[] = [
        {
          id: 'card1',
          recipientName: 'Familie Schmidt',
          recipientEmail: 'schmidt@example.com',
          message: 'Liebe Familie Schmidt, vielen Dank für eure Teilnahme an unserem besonderen Tag. Eure Anwesenheit hat uns sehr viel bedeutet!',
          template: 'elegant',
          selectedMoments: ['1', '2'],
          status: 'sent',
          sentAt: '2025-07-15T10:30:00Z',
          personalizedLink: `/recap?for=Familie%20Schmidt&id=schmidt-abc123`
        },
        {
          id: 'card2',
          recipientName: 'Peter & Anna Müller',
          recipientEmail: 'mueller@example.com',
          message: 'Liebe Anna, lieber Peter, herzlichen Dank für eure Glückwünsche und das wundervolle Geschenk. Wir freuen uns auf viele gemeinsame Momente!',
          template: 'rustic',
          selectedMoments: ['1', '3'],
          status: 'draft',
          personalizedLink: `/recap?for=Peter%20%26%20Anna%20M%C3%BCller&id=mueller-def456`
        },
        {
          id: 'card3',
          recipientName: 'Trauzeugen',
          recipientEmail: 'trauzeugen@example.com',
          message: 'Ihr wart die besten Trauzeugen, die wir uns hätten wünschen können! Danke für eure Unterstützung und die wundervollen Überraschungen.',
          template: 'modern',
          selectedMoments: ['1', '2', '3', '4'],
          status: 'draft',
          personalizedLink: `/recap?for=Trauzeugen&id=trauzeugen-ghi789`
        }
      ];

      setMoments(sampleMoments.filter(moment => moment.mediaItems.length > 0));
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
  };

  const handleShareRecap = () => {
    // Implement sharing functionality
    const shareUrl = `${window.location.origin}/recap/kristin-maurizio`;
    navigator.clipboard.writeText(shareUrl);
    alert('Link zur Zusammenfassung wurde in die Zwischenablage kopiert!');
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

  const handleSubmitCard = () => {
    if (!newCard.recipientName || !newCard.message) {
      alert('Bitte fülle alle Pflichtfelder aus.');
      return;
    }

    // Generate a unique ID for the link
    const uniqueId = `${newCard.recipientName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;
    
    // Create personalized link
    const personalizedLink = `/recap?for=${encodeURIComponent(newCard.recipientName)}&id=${uniqueId}`;

    // Create new card
    const card: ThankYouCard = {
      id: `card-${Date.now()}`,
      recipientName: newCard.recipientName,
      recipientEmail: newCard.recipientEmail,
      message: newCard.message,
      template: newCard.template,
      selectedMoments: ['1', '2', '3', '4'], // Default to all moments
      status: 'draft',
      personalizedLink
    };

    setThankYouCards([...thankYouCards, card]);
    setShowCreateCard(false);
    setNewCard({
      recipientName: '',
      recipientEmail: '',
      message: '',
      template: 'elegant'
    });
  };

  const handleSendCard = (card: ThankYouCard) => {
    // In a real app, this would send an email
    // For now, just mark as sent
    const updatedCards = thankYouCards.map(c => 
      c.id === card.id 
        ? { ...c, status: 'sent' as const, sentAt: new Date().toISOString() } 
        : c
    );
    
    setThankYouCards(updatedCards);
    alert(`Dankeskarte an ${card.recipientName} wurde versendet!`);
  };

  const handleDeleteCard = (cardId: string) => {
    if (window.confirm('Dankeskarte wirklich löschen?')) {
      setThankYouCards(thankYouCards.filter(card => card.id !== cardId));
    }
  };

  const handleCopyLink = (link: string, cardId: string) => {
    const fullLink = `${window.location.origin}${link}`;
    navigator.clipboard.writeText(fullLink);
    
    // Add to copied links set
    setCopiedLinks(prev => new Set(prev).add(cardId));
    
    // Remove from copied links after 2 seconds
    setTimeout(() => {
      setCopiedLinks(prev => {
        const newSet = new Set(prev);
        newSet.delete(cardId);
        return newSet;
      });
    }, 2000);
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
                  Erstelle personalisierte Dankeskarten für eure Gäste
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
            <div className="space-y-6">
              {thankYouCards.map((card) => (
                <div 
                  key={card.id}
                  className={`rounded-2xl border p-6 transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-700' 
                      : 'bg-white border-gray-200 shadow-lg'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-xl font-semibold transition-colors duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {card.recipientName}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-300 ${
                          card.status === 'sent'
                            ? isDarkMode ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'
                            : isDarkMode ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {card.status === 'sent' ? 'Versendet' : 'Entwurf'}
                        </span>
                      </div>
                      
                      {card.recipientEmail && (
                        <div className={`text-sm mb-3 transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Email: {card.recipientEmail}
                        </div>
                      )}
                      
                      <div className={`p-4 rounded-lg mb-4 transition-colors duration-300 ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                      }`}>
                        <p className={`text-sm transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {card.message}
                        </p>
                      </div>
                      
                      {card.personalizedLink && (
                        <div className={`mb-4 p-3 rounded-lg border transition-colors duration-300 ${
                          isDarkMode ? 'bg-blue-900/20 border-blue-700/30' : 'bg-blue-50 border-blue-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Link className={`w-4 h-4 transition-colors duration-300 ${
                                isDarkMode ? 'text-blue-400' : 'text-blue-600'
                              }`} />
                              <span className={`text-sm font-medium transition-colors duration-300 ${
                                isDarkMode ? 'text-blue-400' : 'text-blue-600'
                              }`}>
                                Personalisierter Link
                              </span>
                            </div>
                            <button
                              onClick={() => handleCopyLink(card.personalizedLink!, card.id)}
                              className={`p-1.5 rounded transition-colors duration-300 ${
                                isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-100'
                              }`}
                              title="Link kopieren"
                            >
                              {copiedLinks.has(card.id) ? (
                                <Check className={`w-4 h-4 transition-colors duration-300 ${
                                  isDarkMode ? 'text-green-400' : 'text-green-600'
                                }`} />
                              ) : (
                                <Copy className={`w-4 h-4 transition-colors duration-300 ${
                                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                }`} />
                              )}
                            </button>
                          </div>
                          <div className={`mt-2 text-xs font-mono p-2 rounded transition-colors duration-300 ${
                            isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'
                          }`}>
                            {window.location.origin}{card.personalizedLink}
                          </div>
                          <div className={`mt-2 text-xs transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Dieser Link führt direkt zur personalisierten Slideshow für {card.recipientName}.
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm">
                        <div className={`flex items-center gap-1 transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          <Image className="w-4 h-4" />
                          <span>{card.selectedMoments.length} Momente</span>
                        </div>
                        <div className={`flex items-center gap-1 transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          <FileText className="w-4 h-4" />
                          <span>{card.template}</span>
                        </div>
                        {card.status === 'sent' && card.sentAt && (
                          <div className={`flex items-center gap-1 transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(card.sentAt).toLocaleDateString('de-DE')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      {card.status === 'draft' && (
                        <button
                          onClick={() => handleSendCard(card)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-300 ${
                            isDarkMode 
                              ? 'bg-green-600 hover:bg-green-700 text-white' 
                              : 'bg-green-500 hover:bg-green-600 text-white'
                          }`}
                        >
                          <Send className="w-4 h-4" />
                          Senden
                        </button>
                      )}
                      
                      {card.personalizedLink && (
                        <a
                          href={card.personalizedLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-300 ${
                            isDarkMode 
                              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                        >
                          <Eye className="w-4 h-4" />
                          Vorschau
                        </a>
                      )}
                      
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-300 ${
                          isDarkMode 
                            ? 'bg-red-600 hover:bg-red-700 text-white' 
                            : 'bg-red-500 hover:bg-red-600 text-white'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                        Löschen
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
                  <Mail className={`w-12 h-12 mx-auto mb-4 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                  <h3 className={`text-lg font-semibold mb-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Neue Dankeskarte erstellen
                  </h3>
                  <p className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    Personalisierte Erinnerungen für eure Gäste
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

      {/* Create Card Modal */}
      {showCreateCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-semibold transition-colors duration-300 ${
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
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Empfänger Name *
                </label>
                <input
                  type="text"
                  value={newCard.recipientName}
                  onChange={(e) => setNewCard({...newCard, recipientName: e.target.value})}
                  placeholder="z.B. Familie Schmidt"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  E-Mail (optional)
                </label>
                <input
                  type="email"
                  value={newCard.recipientEmail}
                  onChange={(e) => setNewCard({...newCard, recipientEmail: e.target.value})}
                  placeholder="email@beispiel.de"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-colors duration-300 ${
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
                  Nachricht *
                </label>
                <textarea
                  value={newCard.message}
                  onChange={(e) => setNewCard({...newCard, message: e.target.value})}
                  placeholder="Schreibe eine persönliche Nachricht..."
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none resize-none transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Template
                </label>
                <select
                  value={newCard.template}
                  onChange={(e) => setNewCard({...newCard, template: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="elegant">Elegant</option>
                  <option value="rustic">Rustikal</option>
                  <option value="modern">Modern</option>
                  <option value="classic">Klassisch</option>
                </select>
              </div>

              <div className={`p-4 rounded-lg transition-colors duration-300 ${
                isDarkMode ? 'bg-blue-900/20 border border-blue-700/30' : 'bg-blue-50 border border-blue-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Info className={`w-4 h-4 transition-colors duration-300 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                  <span className={`text-sm font-medium transition-colors duration-300 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    Personalisierter Link
                  </span>
                </div>
                <p className={`text-xs transition-colors duration-300 ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-700'
                }`}>
                  Jeder Gast erhält einen einzigartigen Link zu einer personalisierten Slideshow mit Musik.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreateCard(false)}
                  className={`flex-1 py-2 px-4 rounded-lg transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' 
                      : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                  }`}
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSubmitCard}
                  className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Erstellen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Info icon component
const Info = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

// Link icon component
const Link = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
  </svg>
);