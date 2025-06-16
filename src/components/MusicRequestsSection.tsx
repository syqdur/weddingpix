import React, { useState, useEffect } from 'react';
import { Plus, History, Music } from 'lucide-react';
import { MusicRequest } from '../types';
import { loadMusicRequests } from '../services/musicService';
import { MusicHistoryList } from './MusicHistoryList';
import { MusicRequestModal } from './MusicRequestModal';

interface MusicRequestsSectionProps {
  userName: string;
  deviceId: string;
  isAdmin: boolean;
  isDarkMode: boolean;
}

export const MusicRequestsSection: React.FC<MusicRequestsSectionProps> = ({
  userName,
  deviceId,
  isAdmin,
  isDarkMode
}) => {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [allRequests, setAllRequests] = useState<MusicRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Load music requests
  useEffect(() => {
    console.log('🎵 Setting up music requests subscription...');
    setIsLoading(true);
    
    const unsubscribe = loadMusicRequests((requests) => {
      console.log(`🎵 Received ${requests.length} music requests`);
      setAllRequests(requests);
      setIsLoading(false);
      setError(null);
    });

    return () => {
      console.log('🎵 Cleaning up music requests subscription');
      unsubscribe();
    };
  }, []);

  const handleRequestSuccess = () => {
    setSubmitSuccess('🎉 Song wurde erfolgreich zur Playlist hinzugefügt!');
    setTimeout(() => setSubmitSuccess(null), 3000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className={`ml-4 transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Lade Musikwünsche...
        </p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <History className={`w-5 h-5 transition-colors duration-300 ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`} />
            <h3 className={`font-semibold transition-colors duration-300 ${
              isDarkMode ? 'text-blue-300' : 'text-blue-800'
            }`}>
              🎵 Musikwünsche für die Hochzeit
            </h3>
          </div>
          <p className={`text-sm transition-colors duration-300 ${
            isDarkMode ? 'text-blue-200' : 'text-blue-700'
          }`}>
            Alle Gäste können Songs zur Hochzeits-Playlist hinzufügen ({allRequests.length} Songs)
            {isAdmin && ' • Als Admin hast du zusätzlich Zugriff auf die Spotify-Integration'}
          </p>
        </div>

        {/* Add Song Button - Available for ALL users */}
        <button
          onClick={() => setShowRequestModal(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg ${
            isDarkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">🎵 Song hinzufügen</span>
          <span className="sm:hidden">Hinzufügen</span>
        </button>
      </div>

      {/* Success Message */}
      {submitSuccess && (
        <div className={`mb-6 p-4 rounded-xl border transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-green-900/20 border-green-700/30 text-green-300' 
            : 'bg-green-50 border-green-200 text-green-700'
        }`}>
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4" />
            <div className="font-semibold">{submitSuccess}</div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className={`mb-6 p-4 rounded-xl border transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-red-900/20 border-red-700/30 text-red-300' 
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4" />
            <div className="font-semibold">Fehler: {error}</div>
          </div>
        </div>
      )}

      {/* Music History List */}
      <MusicHistoryList 
        requests={allRequests}
        currentUser={userName}
        isAdmin={isAdmin}
        isDarkMode={isDarkMode}
      />

      {/* Music Request Modal */}
      <MusicRequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        userName={userName}
        deviceId={deviceId}
        isDarkMode={isDarkMode}
        onSuccess={handleRequestSuccess}
      />
    </div>
  );
};