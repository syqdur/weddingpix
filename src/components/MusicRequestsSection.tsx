import React, { useState, useEffect } from 'react';
import { Music, Plus, Filter, TrendingUp, Clock, Check, Play, List, History } from 'lucide-react';
import { MusicRequest } from '../types';
import { loadMusicRequests } from '../services/musicService';
import { MusicRequestModal } from './MusicRequestModal';
import { MusicHistoryList } from './MusicHistoryList';

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
  const [requests, setRequests] = useState<MusicRequest[]>([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log(`🎵 === MUSIC REQUESTS SECTION MOUNTED ===`);
    console.log(`👤 User: ${userName} (${deviceId})`);
    console.log(`👑 Admin: ${isAdmin}`);
    
    setIsLoading(true);
    
    const unsubscribe = loadMusicRequests((loadedRequests) => {
      console.log(`🎵 Music requests loaded: ${loadedRequests.length}`);
      loadedRequests.forEach((request, index) => {
        console.log(`  ${index + 1}. "${request.songTitle}" by ${request.artist} (requested by ${request.requestedBy})`);
      });
      
      setRequests(loadedRequests);
      setIsLoading(false);
    });
    
    return () => {
      console.log(`🎵 Unsubscribing from music requests`);
      unsubscribe();
    };
  }, [userName, deviceId, isAdmin]);

  // 🎯 ONLY SHOW PLAYED SONGS (HISTORY)
  const playedRequests = requests.filter(request => request.status === 'played');

  return (
    <div className={`border-b transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
    }`}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full transition-colors duration-300 ${
              isDarkMode ? 'bg-green-600' : 'bg-green-500'
            }`}>
              <Music className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className={`text-xl font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                🎵 Musikwünsche
              </h2>
              <p className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Songs werden automatisch gespielt und hier angezeigt
              </p>
            </div>
          </div>

          {/* Add Song Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRequestModal(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 ${
                isDarkMode
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Song hinzufügen</span>
              <span className="sm:hidden">Hinzufügen</span>
            </button>
          </div>
        </div>

        {/* History Header */}
        <div className={`p-4 rounded-xl mb-4 transition-colors duration-300 ${
          isDarkMode ? 'bg-blue-900/20 border border-blue-700/30' : 'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            <History className={`w-5 h-5 transition-colors duration-300 ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`} />
            <h3 className={`font-semibold transition-colors duration-300 ${
              isDarkMode ? 'text-blue-300' : 'text-blue-800'
            }`}>
              🎵 Verlauf der gespielten Songs
            </h3>
          </div>
          <p className={`text-sm transition-colors duration-300 ${
            isDarkMode ? 'text-blue-200' : 'text-blue-700'
          }`}>
            Alle Songs die bereits auf der Hochzeit gespielt wurden ({playedRequests.length} Songs)
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className={`p-3 rounded-lg transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className={`text-2xl font-bold transition-colors duration-300 ${
              isDarkMode ? 'text-green-400' : 'text-green-600'
            }`}>
              {requests.length}
            </div>
            <div className={`text-xs transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Gesamt
            </div>
          </div>
          <div className={`p-3 rounded-lg transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className={`text-2xl font-bold transition-colors duration-300 ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`}>
              {playedRequests.length}
            </div>
            <div className={`text-xs transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Gespielt
            </div>
          </div>
          <div className={`p-3 rounded-lg transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className={`text-2xl font-bold transition-colors duration-300 ${
              isDarkMode ? 'text-purple-400' : 'text-purple-600'
            }`}>
              {new Set(playedRequests.map(r => r.requestedBy)).size}
            </div>
            <div className={`text-xs transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Gäste
            </div>
          </div>
          <div className={`p-3 rounded-lg transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className={`text-2xl font-bold transition-colors duration-300 ${
              isDarkMode ? 'text-pink-400' : 'text-pink-600'
            }`}>
              {playedRequests.reduce((sum, r) => sum + r.votes, 0)}
            </div>
            <div className={`text-xs transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Votes
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="px-4 pb-4">
          <div className="text-center py-12">
            <div className="w-8 h-8 mx-auto border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className={`text-lg font-semibold transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Lade Musikwünsche...
            </p>
            <p className={`text-sm mt-1 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Verbinde mit Firebase...
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      {!isLoading && (
        <div className="px-4 pb-4">
          <MusicHistoryList
            requests={playedRequests}
            currentUser={userName}
            isDarkMode={isDarkMode}
          />
        </div>
      )}

      {/* Music Request Modal */}
      <MusicRequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        userName={userName}
        deviceId={deviceId}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};