import React, { useState, useEffect } from 'react';
import { Music, Plus, Filter, TrendingUp, Clock, Check, Play, List, History } from 'lucide-react';
import { MusicRequest } from '../types';
import { loadMusicRequests } from '../services/musicService';
import { MusicRequestModal } from './MusicRequestModal';
import { MusicRequestsList } from './MusicRequestsList';
import { PlaylistExportModal } from './PlaylistExportModal';
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
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'approved' | 'played'>('all');
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [isLoading, setIsLoading] = useState(true);

  // 🎧 DJ SYSTEM: Check if current user is DJ, Mauro, or Admin
  const isDJ = userName.toLowerCase() === 'dj' || 
              userName.toLowerCase() === 'mauro' || 
              userName.toLowerCase() === 'maurizio' || 
              isAdmin;

  useEffect(() => {
    console.log(`🎵 === MUSIC REQUESTS SECTION MOUNTED ===`);
    console.log(`👤 User: ${userName} (${deviceId})`);
    console.log(`👑 Admin: ${isAdmin}`);
    console.log(`🎧 DJ: ${isDJ}`);
    
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
  }, [userName, deviceId, isAdmin, isDJ]);

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  const approvedRequests = requests.filter(request => request.status === 'approved');
  const playedRequests = requests.filter(request => request.status === 'played');

  const getFilterCount = (status: MusicRequest['status'] | 'all') => {
    if (status === 'all') return requests.length;
    return requests.filter(r => r.status === status).length;
  };

  const getFilterIcon = (status: MusicRequest['status'] | 'all') => {
    switch (status) {
      case 'all': return <Music className="w-4 h-4" />;
      case 'approved': return <Check className="w-4 h-4" />;
      case 'played': return <Play className="w-4 h-4" />;
      default: return <Music className="w-4 h-4" />;
    }
  };

  const getFilterLabel = (status: MusicRequest['status'] | 'all') => {
    switch (status) {
      case 'all': return 'Alle';
      case 'approved': return 'In Playlist';
      case 'played': return 'Gespielt';
      default: return 'Alle';
    }
  };

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
                Wünsche dir Songs für die Hochzeit
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

        {/* 🎯 Playlist Button für DJ/Admin */}
        {isDJ && approvedRequests.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setShowPlaylistModal(true)}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed transition-all duration-300 hover:scale-[1.02] ${
                isDarkMode
                  ? 'border-purple-600 bg-purple-900/20 hover:bg-purple-900/30 text-purple-300'
                  : 'border-purple-500 bg-purple-50 hover:bg-purple-100 text-purple-700'
              }`}
              title="Songs zu Spotify Playlist hinzufügen"
            >
              <List className="w-5 h-5" />
              <span className="font-medium">
                🎯 {approvedRequests.length} Songs zur Spotify Playlist hinzufügen
              </span>
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex mb-4">
          <button
            onClick={() => setActiveTab('current')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-medium transition-all duration-300 ${
              activeTab === 'current'
                ? isDarkMode
                  ? 'text-green-400 border-b-2 border-green-400 bg-gray-700/30'
                  : 'text-green-600 border-b-2 border-green-600 bg-green-50'
                : isDarkMode
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/20'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Music className="w-4 h-4" />
            Aktuelle Playlist
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-medium transition-all duration-300 ${
              activeTab === 'history'
                ? isDarkMode
                  ? 'text-green-400 border-b-2 border-green-400 bg-gray-700/30'
                  : 'text-green-600 border-b-2 border-green-600 bg-green-50'
                : isDarkMode
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/20'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <History className="w-4 h-4" />
            Verlauf ({playedRequests.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'current' ? (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
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
                  isDarkMode ? 'text-green-400' : 'text-green-600'
                }`}>
                  {getFilterCount('approved')}
                </div>
                <div className={`text-xs transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  In Playlist
                </div>
              </div>
              <div className={`p-3 rounded-lg transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <div className={`text-2xl font-bold transition-colors duration-300 ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`}>
                  {getFilterCount('played')}
                </div>
                <div className={`text-xs transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Gespielt
                </div>
              </div>
            </div>

            {/* Filter Tabs - 🎯 SIMPLIFIED: Nur noch 3 Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {(['all', 'approved', 'played'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                    filter === status
                      ? isDarkMode
                        ? 'bg-green-600 text-white'
                        : 'bg-green-500 text-white'
                      : isDarkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {getFilterIcon(status)}
                  {getFilterLabel(status)}
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    filter === status
                      ? 'bg-white/20 text-white'
                      : isDarkMode
                        ? 'bg-gray-600 text-gray-300'
                        : 'bg-gray-200 text-gray-600'
                  }`}>
                    {getFilterCount(status)}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          /* History Tab Header */
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
                🎵 Gespielte Songs
              </h3>
            </div>
            <p className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-blue-200' : 'text-blue-700'
            }`}>
              Alle Songs die bereits auf der Hochzeit gespielt wurden ({playedRequests.length} Songs)
            </p>
          </div>
        )}
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
          {activeTab === 'current' ? (
            <MusicRequestsList
              requests={filteredRequests}
              currentUser={userName}
              deviceId={deviceId}
              isAdmin={isAdmin}
              isDarkMode={isDarkMode}
            />
          ) : (
            <MusicHistoryList
              requests={playedRequests}
              currentUser={userName}
              isDarkMode={isDarkMode}
            />
          )}
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

      {/* Playlist Export Modal */}
      <PlaylistExportModal
        isOpen={showPlaylistModal}
        onClose={() => setShowPlaylistModal(false)}
        approvedRequests={approvedRequests}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};