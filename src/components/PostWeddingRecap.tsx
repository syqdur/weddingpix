import React, { useState, useEffect } from 'react';
import { db } from '../src/config/firebase'; // Import your Firebase configuration
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { MediaItem, Moment, ThankYouCard } from '../types'; // Import your types
import { Heart, Camera, Download, Mail, Share2, BarChart3, Users, Calendar, MapPin, MessageSquare, Star, ArrowLeft, Plus, Edit3, Trash2, Save, Eye, ThumbsUp, X, Image, Video, FileText, Gift, Sparkles, Crown, Award, Copy, ExternalLink, Link, Check } from 'lucide-react';


interface PostWeddingCardProps {
  isDarkMode: boolean;
  mediaItems: MediaItem[];
  isAdmin: boolean;
  userName: string;
}

export const PostWeddingCard: React.FC<PostWeddingCardProps> = ({ isDarkMode, mediaItems, isAdmin, userName }) => {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [thankYouCards, setThankYouCards] = useState<ThankYouCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateMoment, setShowCreateMoment] = useState(false);
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [newMoment, setNewMoment] = useState<Moment>({
    title: '',
    description: '',
    category: 'special',
    location: '',
    tags: [],
    mediaItems: [],
    timestamp: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  const [newCard, setNewCard] = useState<ThankYouCard>({
    recipientName: '',
    recipientEmail: '',
    message: '',
    selectedMoments: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    shareableLink: ''
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const momentsRef = collection(db, 'moments');
        const cardsRef = collection(db, 'thankYouCards');

        const momentsQuery = query(momentsRef, orderBy('timestamp', 'desc'));
        const cardsQuery = query(cardsRef, orderBy('createdAt', 'desc'));

        const [momentsSnapshot, cardsSnapshot] = await Promise.all([
          getDocs(momentsQuery),
          getDocs(cardsQuery)
        ]);

        const loadedMoments = momentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Moment));
        const loadedCards = cardsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ThankYouCard));

        setMoments(loadedMoments);
        setThankYouCards(loadedCards);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Error loading data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCreateMoment = () => {
    setShowCreateMoment(true);
    setError(null);
  };

  const handleSaveMoment = async () => {
    try {
      if (!newMoment.title.trim()) {
        setError('Please enter a title for the moment.');
        return;
      }
      if (!newMoment.description.trim()) {
        setError('Please enter a description.');
        return;
      }

      const docRef = await addDoc(collection(db, 'moments'), newMoment);
      const newMomentWithId = { id: docRef.id, ...newMoment };
      setMoments([newMomentWithId, ...moments]);
      setNewMoment({
        title: '',
        description: '',
        category: 'special',
        location: '',
        tags: [],
        mediaItems: [],
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setShowCreateMoment(false);
      alert('Moment successfully saved!');
    } catch (error) {
      console.error('Error saving moment:', error);
      setError('Error saving moment. Please try again.');
    }
  };

  const handleCreateCard = () => {
    setShowCreateCard(true);
    setError(null);
  };

  const handleSubmitCard = async () => {
    try {
      if (!newCard.recipientName.trim()) {
        setError('Please enter a recipient name.');
        return;
      }
      if (newCard.selectedMoments.length === 0) {
        setError('Please select at least one moment.');
        return;
      }

      const cardData = { ...newCard };

      const docRef = await addDoc(collection(db, 'thankYouCards'), cardData);
      const newCardWithId = { id: docRef.id, ...cardData, shareableLink: `${window.location.origin}/recap?for=${encodeURIComponent(newCard.recipientName)}&id=${docRef.id}` };
      setThankYouCards([newCardWithId, ...thankYouCards]);
      setNewCard({
        recipientName: '',
        recipientEmail: '',
        message: '',
        selectedMoments: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        shareableLink: ''
      });
      setShowCreateCard(false);
      alert('Thank you card successfully created!');
    } catch (error) {
      console.error('Error creating card:', error);
      setError('Error creating card. Please try again.');
    }
  };

  // ... rest of your component code ...

};
