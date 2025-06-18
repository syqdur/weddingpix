import React, { useState, useEffect, useRef } from 'react';
import { Heart, Camera, Calendar, MapPin, ArrowLeft, Share2, Eye, Image, Video, MessageSquare, Music, VolumeX, Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaItem } from '../types';
import { loadGallery } from '../services/firebaseService';

interface PublicRecapPageProps {
  isDarkMode: boolean;
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

export const PublicRecapPage: React.FC<PublicRecapPageProps> = ({ isDarkMode }) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMoment, setSelectedMoment] = useState<Moment | null>(null);
  const [guestName, setGuestName] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimationPlaying, setIsAnimationPlaying] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const slideInterval = useRef<NodeJS.Timeout | null>(null);

  // Parse URL parameters to get guest name
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get('for');
    if (name) {
      setGuestName(decodeURIComponent(name));
    }
  }, []);

  // Load media items
  useEffect(() => {
    const unsubscribe = loadGallery((items) => {
      setMediaItems(items);
      
      // Create sample moments from media items
      const sampleMoments: Moment[] = [
        {
          id: '1',
          title: 'Die Zeremonie',
          description: 'Der magische Moment unseres Ja-Worts in der wunderschönen Kirche.',
          mediaItems: items.filter(item => item.type === 'image').slice(0, 8),
          category: 'ceremony',
          timestamp: '2025-07-12T14:00:00Z',
          location: 'St. Marien Kirche',
          tags: ['Zeremonie', 'Ja-Wort', 'Kirche', 'Emotionen']
        },
        {
          id: '2',
          title: 'Die Feier',
          description: 'Ausgelassene Stimmung und unvergessliche Momente mit Familie und Freunden.',
          mediaItems: items.filter(item => item.type === 'video').slice(0, 5),
          category: 'reception',
          timestamp: '2025-07-12T18:00:00Z',
          location: 'Schloss Bellevue',
          tags: ['Feier', 'Tanz', 'Familie', 'Freunde']
        },
        {
          id: '3',
          title: 'Besondere Momente',
          description: 'Die kleinen, besonderen Augenblicke, die diesen Tag unvergesslich gemacht haben.',
          mediaItems: items.filter(item => item.type === 'note').slice(0, 6),
          category: 'special',
          timestamp: '2025-07-12T20:00:00Z',
          tags: ['Besonders', 'Erinnerungen', 'Liebe']
        },
        {
          id: '4',
          title: 'Alle Erinnerungen',
          description: 'Eine Sammlung aller wunderschönen Momente von unserem besonderen Tag.',
          mediaItems: items.slice(0, 20),
          category: 'custom',
          timestamp: '2025-07-12T22:00:00Z',
          tags: ['Alle', 'Sammlung', 'Erinnerungen']
        }
      ];

      setMoments(sampleMoments.filter(moment => moment.mediaItems.length > 0));
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  // Handle slideshow for animation
  useEffect(() => {
    if (isAnimationPlaying) {
      // Start music
      if (audioRef.current) {
        audioRef.current.play().catch(err => console.error("Couldn't play audio:", err));
      }
      
      // Start slideshow
      slideInterval.current = setInterval(() => {
        setCurrentSlide(prev => {
          const allMediaItems = moments.flatMap(m => m.mediaItems);
          return prev < allMediaItems.length - 1 ? prev + 1 : 0;
        });
      }, 5000); // Change slide every 5 seconds
    } else {
      // Clear interval when animation stops
      if (slideInterval.current) {
        clearInterval(slideInterval.current);
        slideInterval.current = null;
      }
      
      // Pause music
      if (audioRef.current && !isMuted) {
        audioRef.current.pause();
      }
    }
    
    return () => {
      if (slideInterval.current) {
        clearInterval(slideInterval.current);
      }
    };
  }, [isAnimationPlaying, moments, isMuted]);

  // Toggle music
  const toggleMusic = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.play().catch(err => console.error("Couldn't play audio:", err));
      } else {
        audioRef.current.pause();
      }
    }
  };

  // Start animated slideshow
  const startAnimation = () => {
    setIsAnimationPlaying(true);
    setShowWelcome(false);
  };

  // Stop animated slideshow
  const stopAnimation = () => {
    setIsAnimationPlaying(false);
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
      case 'reception': return <Camera className="w-5 h-5" />;
      case 'party': return <Video className="w-5 h-5" />;
      case 'special': return <MessageSquare className="w-5 h-5" />;
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

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Kristin & Maurizio - Hochzeits-Erinnerungen',
        text: 'Schaut euch unsere wunderschönen Hochzeits-Erinnerungen an!',
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link wurde in die Zwischenablage kopiert!');
    }
  };

  const nextSlide = () => {
    const allMediaItems = moments.flatMap(m => m.mediaItems);
    setCurrentSlide(prev => (prev < allMediaItems.length - 1 ? prev + 1 : 0));
  };

  const prevSlide = () => {
    const allMediaItems = moments.flatMap(m => m.mediaItems);
    setCurrentSlide(prev => (prev > 0 ? prev - 1 : allMediaItems.length - 1));
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
            Lade Hochzeits-Erinnerungen...
          </p>
        </div>
      </div>
    );
  }

  // Animated Slideshow View
  if (isAnimationPlaying) {
    const allMediaItems = moments.flatMap(m => m.mediaItems);
    const currentMedia = allMediaItems[currentSlide];
    
    return (
      <div className="fixed inset-0 bg-black z-50">
        {/* Background music */}
        <audio 
          ref={audioRef} 
          loop 
          muted={isMuted}
          src="https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0c6ff1eab.mp3?filename=emotional-piano-118996.mp3"
        />
        
        {/* Controls */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
          <button
            onClick={toggleMusic}
            className="p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Music className="w-5 h-5" />}
          </button>
          <button
            onClick={stopAnimation}
            className="p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <Pause className="w-5 h-5" />
          </button>
        </div>
        
        {/* Navigation */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
        
        {/* Current Media */}
        <div className="absolute inset-0 flex items-center justify-center">
          {currentMedia?.type === 'image' && currentMedia.url ? (
            <img
              src={currentMedia.url}
              alt={currentMedia.name}
              className="max-w-full max-h-full object-contain animate-fadeIn"
            />
          ) : currentMedia?.type === 'video' && currentMedia.url ? (
            <video
              src={currentMedia.url}
              className="max-w-full max-h-full object-contain"
              autoPlay
              muted
              loop
            />
          ) : currentMedia?.type === 'note' ? (
            <div className="max-w-lg w-full p-8 bg-white/10 backdrop-blur-md rounded-2xl text-white animate-fadeIn">
              <div className="text-center mb-4">
                <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                <h3 className="text-xl font-semibold">Nachricht von {currentMedia.uploadedBy}</h3>
              </div>
              <p className="text-lg leading-relaxed">"{currentMedia.noteText}"</p>
            </div>
          ) : (
            <div className="text-white text-center">
              <Camera className="w-16 h-16 mx-auto mb-4" />
              <p>Keine Medien verfügbar</p>
            </div>
          )}
        </div>
        
        {/* Caption */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 max-w-2xl w-full px-4">
          <div className="bg-black/70 backdrop-blur-sm rounded-xl p-4 text-white text-center">
            <h3 className="text-xl font-semibold mb-2">Kristin & Maurizio</h3>
            <p className="text-sm opacity-80">
              {currentMedia?.type === 'note' 
                ? `Nachricht von ${currentMedia.uploadedBy}`
                : `Hochzeit am 12. Juli 2025 • ${currentSlide + 1} von ${allMediaItems.length}`}
            </p>
          </div>
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
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-pink-300">
                <img 
                  src="https://i.ibb.co/PvXjwss4/profil.jpg" 
                  alt="Kristin & Maurizio"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className={`text-3xl font-bold transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  💕 Kristin & Maurizio
                </h1>
                <p className={`text-lg transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  12. Juli 2025 • Unsere Hochzeits-Erinnerungen
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={startAnimation}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-pink-600 hover:bg-pink-700 text-white' 
                    : 'bg-pink-500 hover:bg-pink-600 text-white'
                }`}
              >
                <Play className="w-4 h-4" />
                Slideshow
              </button>
              <button
                onClick={handleShare}
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

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Message */}
        {showWelcome && (
          <div className={`text-center mb-12 p-8 rounded-2xl transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gradient-to-br from-pink-900/30 to-purple-900/30 border border-pink-700/30' 
              : 'bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-200'
          }`}>
            <h2 className={`text-3xl font-bold mb-4 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {guestName ? `Hallo ${guestName}! 👋` : 'Vielen Dank für eure Teilnahme! 💕'}
            </h2>
            <p className={`text-lg mb-6 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {guestName 
                ? `Wir freuen uns, dass du unsere Hochzeits-Erinnerungen anschaust. Hier sind die schönsten Momente, die wir mit dir und allen anderen Gästen geteilt haben.`
                : 'Hier sind die schönsten Momente unserer Hochzeit, die wir gemeinsam mit euch erlebt haben.'}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className={`px-4 py-2 rounded-full transition-colors duration-300 ${
                isDarkMode ? 'bg-pink-600 text-white' : 'bg-pink-100 text-pink-800'
              }`}>
                📸 {mediaItems.filter(item => item.type === 'image').length} Fotos
              </div>
              <div className={`px-4 py-2 rounded-full transition-colors duration-300 ${
                isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
              }`}>
                🎥 {mediaItems.filter(item => item.type === 'video').length} Videos
              </div>
              <div className={`px-4 py-2 rounded-full transition-colors duration-300 ${
                isDarkMode ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-800'
              }`}>
                💌 {mediaItems.filter(item => item.type === 'note').length} Nachrichten
              </div>
            </div>
            <button
              onClick={startAnimation}
              className={`mt-6 flex items-center gap-2 px-6 py-3 rounded-xl mx-auto transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-pink-600 hover:bg-pink-700 text-white' 
                  : 'bg-pink-500 hover:bg-pink-600 text-white'
              }`}
            >
              <Play className="w-5 h-5" />
              Slideshow starten
            </button>
          </div>
        )}

        {/* Moments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                    <Eye className={`w-4 h-4 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <span className={`transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {moment.mediaItems.length} Medien
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
        </div>

        {/* Footer */}
        <div className="text-center mt-12 py-8">
          <p className={`text-lg mb-4 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Vielen Dank, dass ihr unseren besonderen Tag mit uns geteilt habt! 💕
          </p>
          <p className={`text-sm transition-colors duration-300 ${
            isDarkMode ? 'text-gray-500' : 'text-gray-500'
          }`}>
            Mit Liebe erstellt von Kristin & Maurizio
          </p>
        </div>
      </div>

      {/* Moment Detail Modal */}
      {selectedMoment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-6 border-b transition-colors duration-300 ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h3 className={`text-xl font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {selectedMoment.title}
              </h3>
              <button
                onClick={() => setSelectedMoment(null)}
                className={`p-2 rounded-full transition-colors duration-300 ${
                  isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <p className={`text-base mb-6 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {selectedMoment.description}
              </p>

              {/* Media Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {selectedMoment.mediaItems.map((media, index) => (
                  <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-200">
                    {media.type === 'image' && media.url ? (
                      <img
                        src={media.url}
                        alt={media.name}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => window.open(media.url, '_blank')}
                      />
                    ) : media.type === 'video' && media.url ? (
                      <video
                        src={media.url}
                        className="w-full h-full object-cover"
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
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};