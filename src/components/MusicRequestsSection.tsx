import React, { useState, useEffect } from 'react';
import { Music, Plus, Filter, TrendingUp, Clock, Check, Play } from 'lucide-react';
import { MusicRequest } from '../types';
import { loadMusicRequests } from '../services/musicService';
import { MusicRequestModal } from './MusicRequestModal';
import { MusicRequestsList } from './MusicRequestsList';

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
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'played'>('all');

  useEffect(() => {
    const unsubscribe = loadMusicRequests(setRequests);
    return unsubscribe;
  }, []);

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  const getFilterCount = (status: MusicRequest['status'] | 'all') => {
    if (status === 'all') return requests.length;
    return requests.filter(r => r.status === status).length;
  };

  const getFilterIcon = (status: MusicRequest['status'] | 'all') => {
    switch (status) {
      case 'all': return <Music className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <Check className="w-4 h-4" />;
      case 'played': return <Play className="w-4 h-4" />;
      default: return <Music className="w-4 h-4" />;
    }
  };

  const getFilterLabel = (status: MusicRequest['status'] | 'all') => {
    switch (status) {
      case 'all': return 'Alle';
      case 'pending': return 'Wartend';
      case 'approved': return 'Genehmigt';
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

          <button
            onClick={() => setShowRequestModal(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 ${
              isDarkMode
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Wunsch hinzufügen</span>
            <span className="sm:hidden">Hinzufügen</span>
          </button>
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
              isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
            }`}>
              {getFilterCount('pending')}
            </div>
            <div className={`text-xs transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Wartend
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
              Genehmigt
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

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(['all', 'pending', 'approved', 'played'] as const).map((status) => (
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
      </div>

      {/* Requests List */}
      <div className="px-4 pb-4">
        <MusicRequestsList
          requests={filteredRequests}
          currentUser={userName}
          deviceId={deviceId}
          isAdmin={isAdmin}
          isDarkMode={isDarkMode}
        />
      </div>

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