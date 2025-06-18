import React, { useState, useEffect } from 'react';
import { Heart, Camera, Download, Mail, Share2, BarChart3, Users, Calendar, MapPin, MessageSquare, Star, ArrowLeft, Plus, Edit3, Trash2, Save, X, Image, Video, FileText, Gift, Sparkles, Crown, Award, Eye, ThumbsUp, ExternalLink, Copy, Send, Link } from 'lucide-react';
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
  getDocs,
  where
} from 'firebase/firestore';
import { db } from '../src/config/firebase';

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
    console.log('🔄 Loading moments from Firestore...');
    
    const q = query(collection(db, 'moments'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log(`📋 Moments loaded: ${snapshot.docs.length}`);
        
        const loadedMoments: Moment[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Moment));
        
        setMoments(loadedMoments);
        setIsLoading(false);
        setError(null);
      },
      (error) => {
        console.error('❌ Error loading moments:', error);
        setError(`Fehler beim Laden der Momente: ${error.message}`);
        setIsLoading(false);
        setMoments([]);
      }
    );

    return unsubscribe;
  }, []);

  // Load thank you cards from Firestore
  useEffect(() => {
    console.log('🔄 Loading thank you cards from Firestore...');
    
    const q = query(collection(db, 'thankYouCards'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log(`💌 Thank you cards loaded: ${snapshot.docs.length}`);
        
        const loadedCards: ThankYouCard[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as ThankYouCard));
        
        setThankYouCards(loadedCards);
      },
      (error) => {
        console.error('❌ Error loading thank you cards:', error);
        setError(`Fehler beim Laden der Dankeskarten: ${error.message}`);
      }
    );

    return unsubscribe;
  }, []);Even though your project is already optimized, it's now too big to handle. Try using a <code>.bolt/ignore</code> file or splitting your project into smaller parts. Need help? You'll find all the steps below.
<bolt-quick-actions><bolt-quick-action type="link" href="https://bolt.fyi/prompt-too-long">How to reduce my project size?</bolt-quick-action></bolt-q