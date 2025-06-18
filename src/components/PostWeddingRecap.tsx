import React, { useState, useEffect } from 'react';
import { 
  Heart, Camera, Download, Mail, Share2, BarChart3, Users, 
  Calendar, MapPin, MessageSquare, Star, ArrowLeft, Plus, 
  Edit3, Trash2, Save, X, Image, Video, FileText, Gift, 
  Sparkles, Crown, Award, Eye, ThumbsUp, ExternalLink, Copy, Send, Link 
} from 'lucide-react';
import { db } from './src/config/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, getDocs, where } from 'firebase/firestore';

interface MediaItem {
  id: string;
  url: string;
  thumbnailUrl: string;
  description?: string;
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
  createdBy: string;
  createdAt: string;
}

interface ThankYouCard {
  id: string;
  recipientName: string;
  recipientEmail?: string;
  message: string;
  template: string;
  selectedMoments: string[];
  status: 'draft' | 'link_created';
  createdAt: string;
  createdBy: string;
  shareableLink?: string;
  linkId?: string;
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

interface PostWeddingRecapProps {
  isDarkMode: boolean;
  mediaItems: MediaItem[];
  isAdmin: boolean;
  userName: string;
}

const PostWeddingRecap: React.FC<PostWeddingRecapProps> = ({
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
  const [isCreatingMoment, setIsCreatingMoment] = useState(false);
  const [isCreatingCard, setIsCreatingCard] = useState(false);

  // Form states
  const [momentForm, setMomentForm] = useState({
    title: '',
    description: '',
    category: 'custom' as Moment['category'],
    location: '',
    selectedMediaIds: [] as string[]
  });

  const [cardForm, setCardForm] = useState({
    recipientName: '',
    recipientEmail: '',
    message: '',
    template: 'elegant',
    selectedMoments: [] as string[]
  });

  // Load moments from Firestore
  useEffect(() => {
    const q = query(collection(db, 'moments'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const loadedMoments: Moment[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as Moment
        }));
        setMoments(loadedMoments);
        setIsLoading(false);
        setError(null);
      },
      (error) => {
        setError(`Fehler beim Laden der Momente: ${error.message}`);
        setIsLoading(false);
        setMoments([]);
      }
    );
    return unsubscribe;
  }, []);

  // Load thank you cards from Firestore
  useEffect(() => {
    const q = query(collection(db, 'thankYouCards'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const loadedCards: ThankYouCard[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as ThankYouCard
        }));
        setThankYouCards(loadedCards);
      },
      (error) => {
        setError(`Fehler beim Laden der Dankeskarten: ${error.message}`);
      }
    );
    return unsubscribe;
  }, []);

  // Create a new moment
  const createMoment = async () => {
    try {
      setIsCreatingMoment(true);
      const mediaItemsForMoment = mediaItems.filter(media => momentForm.selectedMediaIds.includes(media.id));
      const docRef = await addDoc(collection(db, 'moments'), {
        ...momentForm,
        mediaItems: mediaItemsForMoment,
        createdAt: new Date().toISOString(),
        createdBy: userName,
        tags: [] // Initialize tags array
      });
      console.log('Moment created with ID: ', docRef.id);
      setMomentForm({
        title: '',
        description: '',
        category: 'custom',
        location: '',
        selectedMediaIds: []
      });
      setShowCreateMoment(false);
    } catch (error) {
      setError(`Fehler beim Erstellen des Moments: ${error.message}`);
    } finally {
      setIsCreatingMoment(false);
    }
  };

  // Delete a moment
  const deleteMoment = async (momentId: string) => {
    try {
      await deleteDoc(doc(db, 'moments', momentId));
      console.log('Moment deleted with ID: ', momentId);
    } catch (error) {
      setError(`Fehler beim Löschen des Moments: ${error.message}`);
    }
  };

  // Add moments to a thank-you card
  const addMomentsToCard = (cardId: string, momentIds: string[]) => {
    try {
      setThankYouCards(prevCards => 
        prevCards.map(card => 
          card.id === cardId 
            ? { ...card, selectedMoments: [...card.selectedMoments, ...momentIds] } 
            : card
        )
      );
    } catch (error) {
      setError(`Fehler beim Hinzufügen von Momenten zur Karte: ${error.message}`);
    }
  };

  // Handle moment selection for cards
  const handleMomentSelect = (momentId: string) => {
    setCardForm(prevForm => ({
      ...prevForm,
      selectedMoments: [...prevForm.selectedMoments, momentId]
    }));
  };

  return (
    <div className={`post-wedding-recap ${isDarkMode ? 'dark-mode' : ''}`}>
      {/* Navigation */}
      <nav>
        <ul>
          <li 
            className={activeSection === 'moments' ? 'active' : ''} 
            onClick={() => setActiveSection('moments')}
          >
            Momente
          </li>
          <li 
            className={activeSection === 'cards' ? 'active' : ''} 
            onClick={() => setActiveSection('cards')}
          >
            Dankeskarten
          </li>
          <li 
            className={activeSection === 'share' ? 'active' : ''} 
            onClick={() => setActiveSection('share')}
          >
            Teilen
          </li>
          <li 
            className={activeSection === 'analytics' ? 'active' : ''} 
            onClick={() => setActiveSection('analytics')}
          >
            Analytics
          </li>
        </ul>
      </nav>

      {/* Loading state */}
      {isLoading && (
        <div className="loading-screen">
          <p>Lade Inhalte...</p>
        </div>
      )}

      {/* Content based on active section */}
      {!isLoading && !error && (
        <>
          {activeSection === 'moments' && (
            <div className="moments-section">
              <h2>Ihre besonderen Momente</h2>
              
              {isAdmin && (
                <button 
                  onClick={() => setShowCreateMoment(true)}
                  disabled={isCreatingMoment}
                >
                  {isCreatingMoment ? 'Erstellung...' : 'Moment erstellen'}
                </button>
              )}

              {showCreateMoment && (
                <div className="moment-form">
                  <h3>Moment erstellen</h3>
                  <form onSubmit={createMoment}>
                    <div className="form-group">
                      <label htmlFor="momentTitle">Titel</label>
                      <input 
                        type="text" 
                        id="momentTitle"
                        value={momentForm.title} 
                        onChange={(e) => setMomentForm(prev => ({...prev, title: e.target.value}))} 
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="momentDescription">Beschreibung</label>
                      <textarea 
                        id="momentDescription"
                        value={momentForm.description} 
                        onChange={(e) => setMomentForm(prev => ({...prev, description: e.target.value}))}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="momentCategory">Kategorie</label>
                      <select 
                        id="momentCategory"
                        value={momentForm.category} 
                        onChange={(e) => setMomentForm(prev => ({...prev, category: e.target.value as Moment['category']}))}
                        required
                      >
                        <option value="ceremony">Zeremonie</option>
                        <option value="reception">Empfang</option>
                        <option value="party">Party</option>
                        <option value="special">Sondermoment</option>
                        <option value="custom">Benutzerdefiniert</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="momentLocation">Ort</label>
                      <input 
                        type="text" 
                        id="momentLocation"
                        value={momentForm.location} 
                        onChange={(e) => setMomentForm(prev => ({...prev, location: e.target.value}))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Medien auswählen</label>
                      <div className="media-selection">
                        {mediaItems.map(media => (
                          <div 
                            key={media.id} 
                            className="media-item"
                            onClick={() => {
                              setMomentForm(prev => ({
                                ...prev,
                                selectedMediaIds: prev.selectedMediaIds.includes(media.id)
                                  ? prev.selectedMediaIds.filter(id => id !== media.id)
                                  : [...prev.selectedMediaIds, media.id]
                              }));
                            }}
                          >
                            <img 
                              src={media.thumbnailUrl} 
                              alt={media.description || 'Vorschaubild'} 
                              className={momentForm.selectedMediaIds.includes(media.id) ? 'selected' : ''}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      className="submit-button"
                      disabled={isCreatingMoment}
                    >
                      {isCreatingMoment ? 'Erstellung...' : 'Moment erstellen'}
                    </button>
                    <button 
                      type="button" 
                      className="cancel-button"
                      onClick={() => setShowCreateMoment(false)}
                    >
                      Abbrechen
                    </button>
                  </form>
                </div>
              )}

              {moments.length > 0 ? (
                <div className="moments-list">
                  {moments.map(moment => (
                    <div key={moment.id} className="moment-card">
                      <h3>{moment.title}</h3>
                      <p>{moment.description}</p>
                      <div className="moment-meta">
                        <span>Kategorie: {moment.category}</span>
                        {moment.location && <span>Ort: {moment.location}</span>}
                      </div>
                      <div className="moment-media">
                        {moment.mediaItems.slice(0, 3).map(media => (
                          <img 
                            key={media.id}
                            src={media.url}
                            alt={media.description || 'Moment-Medium'}
                            className="moment-thumbnail"
                          />
                        ))}
                        {moment.mediaItems.length > 3 && (
                          <span className="more-media">+{moment.mediaItems.length - 3} mehr</span>
                        )}
                      </div>
                      {isAdmin && (
                        <div className="moment-actions">
                          <button 
                            onClick={() => {
                              setSelectedMoment(moment);
                              setMomentForm({
                                title: moment.title,
                                description: moment.description,
                                category: moment.category,
                                location: moment.location || '',
                                selectedMediaIds: moment.mediaItems.map(m => m.id)
                              });
                              setShowCreateMoment(true);
                            }}
                          >
                            Bearbeiten
                          </button>
                          <button 
                            onClick={() => deleteMoment(moment.id)}
                          >
                            Löschen
                          </button>
                          <button 
                            onClick={() => handleMomentSelect(moment.id)}
                          >
                            Zur Karte hinzufügen
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p>Es gibt noch keine Momente. Erstellen Sie als Administrator einen Moment.</p>
              )}
            </div>
          )}

          {activeSection === 'cards' && (
            <div className="cards-section">
              <h2>Dankeskarten</h2>
              
              {isAdmin && (
                <button 
                  onClick={() => setShowCreateCard(true)}
                  disabled={isCreatingCard}
                >
                  {isCreatingCard ? 'Erstellung...' : 'Karte erstellen'}
                </button>
              )}

              {showCreateCard && (
                <div className="card-form">
                  <h3>Dankeskarte erstellen</h3>
                  <form>
                    <div className="form-group">
                      <label htmlFor="cardRecipient">Empfänger Name</label>
                      <input 
                        type="text" 
                        id="cardRecipient"
                        value={cardForm.recipientName} 
                        onChange={(e) => setCardForm(prev => ({...prev, recipientName: e.target.value}))} 
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="cardEmail">Empfänger E-Mail</label>
                      <input 
                        type="email" 
                        id="cardEmail"
                        value={cardForm.recipientEmail} 
                        onChange={(e) => setCardForm(prev => ({...prev, recipientEmail: e.target.value}))}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="cardMessage">Nachricht</label>
                      <textarea 
                        id="cardMessage"
                        value={cardForm.message} 
                        onChange={(e) => setCardForm(prev => ({...prev, message: e.target.value}))}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="cardTemplate">Vorlage</label>
                      <select 
                        id="cardTemplate"
                        value={cardForm.template} 
                        onChange={(e) => setCardForm(prev => ({...prev, template: e.target.value}))}
                      >
                        <option value="elegant">Elegant</option>
                        <option value="modern">Modern</option>
                        <option value="classic">Klassisch</option>
                        <option value="personal">Persönlich</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Momente auswählen</label>
                      <div className="moments-selection">
                        {moments.map(moment => (
                          <div 
                            key={moment.id} 
                            className="moment-item"
                            onClick={() => {
                              setCardForm(prev => ({
                                ...prev,
                                selectedMoments: prev.selectedMoments.includes(moment.id)
                                  ? prev.selectedMoments.filter(id => id !== moment.id)
                                  : [...prev.selectedMoments, moment.id]
                              }));
                            }}
                          >
                            <h4>{moment.title}</h4>
                            <p>{moment.description.substring(0, 50)}{moment.description.length > 50 ? '...' : ''}</p>
                            <div className={cardForm.selectedMoments.includes(moment.id) ? 'selected' : ''}></div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => addMomentsToCard('', cardForm.selectedMoments)}
                      disabled={isCreatingCard}
                    >
                      {isCreatingCard ? 'Erstellung...' : 'Momente hinzufügen'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setShowCreateCard(false)}
                    >
                      Abbrechen
                    </button>
                  </form>
                </div>
              )}

              {thankYouCards.length > 0 ? (
                <div className="cards-list">
                  {thankYouCards.map(card => (
                    <div key={card.id} className="card-item">
                      <h3>Zu {card.recipientName}</h3>
                      <p>{card.message.substring(0, 100)}{card.message.length > 100 ? '...' : ''}</p>
                      <div className="card-meta">
                        <span>Vorlage: {card.template}</span>
                        <span>Momente: {card.selectedMoments.length}</span>
                        <span>Status: {card.status}</span>
                      </div>
                      {card.shareableLink && (
                        <div className="card-link">
                          <input 
                            type="text" 
                            value={card.shareableLink}
                            readOnly
                          />
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(card.shareableLink);
                              alert('Link kopiert!');
                            }}
                          >
                            Kopieren
                          </button>
                        </div>
                      )}
                      {isAdmin && (
                        <div className="card-actions">
                          <button>Editieren</button>
                          <button>Löschen</button>
                          <button>Teilen</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p>Es gibt noch keine Dankeskarten. Erstellen Sie als Administrator eine Karte.</p>
              )}
            </div>
          )}

          {activeSection === 'share' && (
            <div className="share-section">
              <h2>Teilen</h2>
              <p>Teilen Sie Ihre Hochzeitsmomente und Dankeskarten mit Freunden und Familie.</p>
            </div>
          )}

          {activeSection === 'analytics' && (
            <div className="analytics-section">
              <h2>Analytics</h2>
              <div className="analytics-card">
                <h3>Übersicht</h3>
                <div className="analytics-data">
                  <div className="data-item">
                    <h4>Gesamtauswertungen</h4>
                    <p>{analytics.totalViews}</p>
                  </div>
                  <div className="data-item">
                    <h4>Einzelne Besucher</h4>
                    <p>{analytics.uniqueVisitors}</p>
                  </div>
                  <div className="data-item">
                    <h4>Durchschnittliche Verweildauer</h4>
                    <p>{analytics.averageTimeSpent}</p>
                  </div>
                </div>
              </div>
              <div className="analytics-card">
                <h3>Beliebteste Momente</h3>
                <ul className="popular-moments">
                  {analytics.mostViewedMoments.map(momentId => (
                    <li key={momentId}>
                      {moments.find(moment => moment.id === momentId)?.title || 'Unbekanntes Moment'}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="analytics-card">
                <h3>Feedback</h3>
                <div className="feedback-list">
                  {analytics.feedback.map((item, index) => (
                    <div key={index} className="feedback-item">
                      <div className="rating">
                        {Array(5).fill(null).map((_, i) => (
                          <Star 
                            key={i} 
                            color={i < item.rating ? '#FFD700' : '#CCCCCC'} 
                          />
                        ))}
                      </div>
                      <p>{item.comment}</p>
                      <small>{new Date(item.timestamp).toLocaleDateString()}</small>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Error state */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Fehlermeldung schließen</button>
        </div>
      )}
    </div>
  );
};

export default PostWeddingRecap;
