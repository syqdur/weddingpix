import React, { useState, useEffect } from 'react';
import { Plus, History, Music, Sparkles, TrendingUp, Users, Clock, Search, Filter, SortAsc, Award, CheckCircle, AlertCircle } from 'lucide-react';
import { MusicRequest } from '../types';
import { loadMusicRequests } from '../services/musicService';
import { MusicHistoryList } from './MusicHistoryList';
import { MusicRequestModal } from './MusicRequestModal';
import { PlaylistExportModal } from './PlaylistExportModal';
import { subscribeToSharedSpotifyStatus } from '../services/spotifyPlaylistService';

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
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [allRequests, setAllRequests] = useState<MusicRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'alphabetical'>('popular');
  
  // 🌍 NEW: Shared Spotify status for all users
  const [sharedSpotifyStatus, setSharedSpotifyStatus] = useState<{
    isAvailable: boolean;
    authenticatedBy: string | null;
    authenticatedAt: string | null;
  }>({
    isAvailable: false,
    authenticatedBy: null,
    authenticatedAt: null
  });

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

  // 🌍 NEW: Subscribe to shared Spotify status
  useEffect(() => {
    console.log('🌍 Setting up shared Spotify status subscription...');
    
    const unsubscribe = subscribeToSharedSpotifyStatus((status) => {
      console.log('🌍 Shared Spotify status update:', status);
      setSharedSpotifyStatus(status);
    });

    return () => {
      console.log('🌍 Cleaning up shared Spotify status subscription');
      unsubscribe();
    };
  }, []);

  const handleRequestSuccess = () => {
    setSubmitSuccess('🎉 Song wurde erfolgreich zur Playlist hinzugefügt!');
    setTimeout(() => setSubmitSuccess(null), 3000);
  };

  // Filter and sort requests
  const filteredAndSortedRequests = React.useMemo(() => {
    let filtered = allRequests;

    // Apply search filter
    if (searchFilter.trim()) {
      const searchTerm = searchFilter.toLowerCase();
      filtered = allRequests.filter(request => 
        request.songTitle.toLowerCase().includes(searchTerm) ||
        request.artist.toLowerCase().includes(searchTerm) ||
        request.requestedBy.toLowerCase().includes(searchTerm) ||
        (request.album && request.album.toLowerCase().includes(searchTerm))
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          if (a.votes !== b.votes) return b.votes - a.votes;
          return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
        case 'newest':
          return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
        case 'alphabetical':
          return a.songTitle.localeCompare(b.songTitle);
        default:
          return 0;
      }
    });

    return sorted;
  }, [allRequests, searchFilter, sortBy]);

  const stats = React.useMemo(() => {
    const totalSongs = allRequests.length;
    const totalVotes = allRequests.reduce((sum, r) => sum + r.votes, 0);
    const uniqueUsers = new Set(allRequests.map(r => r.requestedBy)).size;
    const totalDuration = allRequests.reduce((sum, r) => sum + (r.duration || 0), 0);
    
    return {
      totalSongs,
      totalVotes,
      uniqueUsers,
      totalDurationMinutes: Math.floor(totalDuration / 60000)
    };
  }, [allRequests]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-6"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Music className="w-6 h-6 text-green-500 animate-pulse" />
          </div>
        </div>
        <h3 className={`text-xl font-semibold mb-2 transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Lade Musikwünsche...
        </h3>
        <p className={`text-sm transition-colors duration-300 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Sammle alle Songs für die perfekte Hochzeits-Playlist
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 🌍 NEW: Shared Spotify Status Banner */}
      {sharedSpotifyStatus.isAvailable && (
        <div className={`p-4 rounded-xl transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-green-900/20 border border-green-700/30' 
            : 'bg-green-50 border border-green-200'
        }`}>
          <div className="flex items-center gap-3">
            <CheckCircle className={`w-5 h-5 transition-colors duration-300 ${
              isDarkMode ? 'text-green-400' : 'text-green-600'
            }`} />
            <div className="flex-1">
              <h4 className={`font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-green-300' : 'text-green-800'
              }`}>
                🌍 Spotify Integration aktiv für ALLE Benutzer!
              </h4>
              <p className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-green-200' : 'text-green-700'
              }`}>
                Eingerichtet von {sharedSpotifyStatus.authenticatedBy} am {' '}
                {sharedSpotifyStatus.authenticatedAt && 
                  new Date(sharedSpotifyStatus.authenticatedAt).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                }
              </p>
              <p className={`text-xs mt-1 transition-colors duration-300 ${
                isDarkMode ? 'text-green-300' : 'text-green-600'
              }`}>
                ✅ Alle Songs werden automatisch zur Spotify-Playlist hinzugefügt
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Compact Hero Section */}
      <div className={`relative overflow-hidden rounded-2xl p-6 transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-purple-900/30 via-pink-900/30 to-blue-900/30 border border-purple-700/30' 
          : 'bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 border border-purple-200/50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-full transition-colors duration-300 ${
                isDarkMode ? 'bg-purple-600' : 'bg-purple-500'
              }`}>
                <Music className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className={`text-xl font-bold transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  🎵 Hochzeits-Playlist
                </h1>
                <p className={`text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-purple-200' : 'text-purple-700'
                }`}>
                  Eure Lieblingssongs für den perfekten Tag
                </p>
              </div>
            </div>

            {/* Compact Stats */}
            <div className="grid grid-cols-4 gap-3">
              <div className={`p-3 rounded-lg transition-colors duration-300 ${
                isDarkMode ? 'bg-white/10 backdrop-blur-sm' : 'bg-white/60 backdrop-blur-sm'
              }`}>
                <div className={`text-lg font-bold transition-colors duration-300 ${
                  isDarkMode ? 'text-green-400' : 'text-green-600'
                }`}>
                  {stats.totalSongs}
                </div>
                <div className={`text-xs transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Songs
                </div>
              </div>
              <div className={`p-3 rounded-lg transition-colors duration-300 ${
                isDarkMode ? 'bg-white/10 backdrop-blur-sm' : 'bg-white/60 backdrop-blur-sm'
              }`}>
                <div className={`text-lg font-bold transition-colors duration-300 ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`}>
                  {stats.totalVotes}
                </div>
                <div className={`text-xs transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Votes
                </div>
              </div>
              <div className={`p-3 rounded-lg transition-colors duration-300 ${
                isDarkMode ? 'bg-white/10 backdrop-blur-sm' : 'bg-white/60 backdrop-blur-sm'
              }`}>
                <div className={`text-lg font-bold transition-colors duration-300 ${
                  isDarkMode ? 'text-pink-400' : 'text-pink-600'
                }`}>
                  {stats.uniqueUsers}
                </div>
                <div className={`text-xs transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Gäste
                </div>
              </div>
              <div className={`p-3 rounded-lg transition-colors duration-300 ${
                isDarkMode ? 'bg-white/10 backdrop-blur-sm' : 'bg-white/60 backdrop-blur-sm'
              }`}>
                <div className={`text-lg font-bold transition-colors duration-300 ${
                  isDarkMode ? 'text-purple-400' : 'text-purple-600'
                }`}>
                  {stats.totalDurationMinutes}
                </div>
                <div className={`text-xs transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Min
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons - Compact */}
          <div className="flex flex-col gap-2 ml-4">
            <button
              onClick={() => setShowRequestModal(true)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white' 
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span className="font-semibold text-sm">Song hinzufügen</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setShowPlaylistModal(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white' 
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                }`}
              >
                <History className="w-4 h-4" />
                <span className="font-semibold text-sm">Verwalten</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success Message */}
      {submitSuccess && (
        <div className={`p-4 rounded-xl border transition-all duration-300 animate-in slide-in-from-top ${
          isDarkMode 
            ? 'bg-green-900/20 border-green-700/30 text-green-300' 
            : 'bg-green-50 border-green-200 text-green-700'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full transition-colors duration-300 ${
              isDarkMode ? 'bg-green-600' : 'bg-green-500'
            }`}>
              <Music className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-semibold">{submitSuccess}</div>
              <div className="text-sm mt-1 opacity-90">
                🎯 Song wurde zur Playlist hinzugefügt und automatisch mit Spotify synchronisiert
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className={`p-4 rounded-xl border transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-red-900/20 border-red-700/30 text-red-300' 
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full transition-colors duration-300 ${
              isDarkMode ? 'bg-red-600' : 'bg-red-500'
            }`}>
              <Music className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-semibold">Fehler beim Laden der Musikwünsche</div>
              <div className="text-sm mt-1">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* 🌍 NEW: No Spotify Integration Warning */}
      {!sharedSpotifyStatus.isAvailable && (
        <div className={`p-4 rounded-xl border transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-yellow-900/20 border-yellow-700/30 text-yellow-300' 
            : 'bg-yellow-50 border-yellow-200 text-yellow-700'
        }`}>
          <div className="flex items-center gap-3">
            <AlertCircle className={`w-5 h-5 transition-colors duration-300 ${
              isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
            }`} />
            <div>
              <div className="font-semibold">Spotify Integration nicht aktiv</div>
              <div className="text-sm mt-1">
                Songs werden zur internen Playlist hinzugefügt, aber nicht automatisch zu Spotify synchronisiert.
                {isAdmin && ' Als Admin kannst du die Spotify-Integration einrichten.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compact Search and Filter Controls */}
      {allRequests.length > 0 && (
        <div className={`p-4 rounded-xl transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'
        }`}>
          <div className="flex gap-3">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Songs, Künstler oder Gäste suchen..."
                  className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
            </div>

            {/* Sort Options - Compact */}
            <div className="flex gap-1">
              {[
                { key: 'popular', icon: <TrendingUp className="w-4 h-4" />, label: 'Top' },
                { key: 'newest', icon: <Clock className="w-4 h-4" />, label: 'Neu' },
                { key: 'alphabetical', icon: <SortAsc className="w-4 h-4" />, label: 'A-Z' }
              ].map((option) => (
                <button
                  key={option.key}
                  onClick={() => setSortBy(option.key as any)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-all duration-300 ${
                    sortBy === option.key
                      ? isDarkMode
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-500 text-white'
                      : isDarkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  title={option.label}
                >
                  {option.icon}
                  <span className="text-xs font-medium hidden sm:inline">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Filter Results Info */}
          {searchFilter && (
            <div className={`mt-3 text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {filteredAndSortedRequests.length} von {allRequests.length} Songs gefunden
            </div>
          )}
        </div>
      )}

      {/* Summary Stats - Only show if there are requests */}
      {allRequests.length > 0 && (
        <div className={`p-4 rounded-xl transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <Award className={`w-5 h-5 transition-colors duration-300 ${
              isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
            }`} />
            <h4 className={`font-semibold transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              🎵 Playlist-Übersicht
            </h4>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold mb-1 transition-colors duration-300 ${
                isDarkMode ? 'text-blue-400' : 'text-blue-600'
              }`}>
                {allRequests.length}
              </div>
              <div className={`text-xs transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Songs gewünscht
              </div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold mb-1 transition-colors duration-300 ${
                isDarkMode ? 'text-green-400' : 'text-green-600'
              }`}>
                {new Set(allRequests.map(r => r.requestedBy)).size}
              </div>
              <div className={`text-xs transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Verschiedene Gäste
              </div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold mb-1 transition-colors duration-300 ${
                isDarkMode ? 'text-pink-400' : 'text-pink-600'
              }`}>
                {allRequests.reduce((sum, r) => sum + r.votes, 0)}
              </div>
              <div className={`text-xs transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Gesamt Votes
              </div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold mb-1 transition-colors duration-300 ${
                isDarkMode ? 'text-purple-400' : 'text-purple-600'
              }`}>
                {Math.floor(allRequests.reduce((sum, r) => sum + (r.duration || 0), 0) / 60000)}
              </div>
              <div className={`text-xs transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Minuten Musik
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Music History List */}
      <MusicHistoryList 
        requests={filteredAndSortedRequests}
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

      {/* Playlist Export Modal (Admin only) */}
      {isAdmin && (
        <PlaylistExportModal
          isOpen={showPlaylistModal}
          onClose={() => setShowPlaylistModal(false)}
          isDarkMode={isDarkMode}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
};