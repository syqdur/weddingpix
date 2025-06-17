import React, { useState, useEffect } from 'react';
import { Music, Plus, Search, TrendingUp, Clock, SortAsc, Filter } from 'lucide-react';
import { MusicRequest } from '../types';
import { loadMusicRequests } from '../services/musicService';
import { MusicRequestModal } from './MusicRequestModal';
import { MusicHistoryList } from './MusicHistoryList';
import { isSharedTokenAvailable, getSharedTokenInfo } from '../services/spotifyAuthService';

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
  const [requests, setRequests] = useState<MusicRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'alphabetical'>('popular');
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [spotifyAvailable, setSpotifyAvailable] = useState(false);
  const [sharedTokenInfo, setSharedTokenInfo] = useState<any>(null);

  // Load music requests
  useEffect(() => {
    setIsLoading(true);
    
    const unsubscribe = loadMusicRequests((loadedRequests) => {
      setRequests(loadedRequests);
      setIsLoading(false);
    });

    // Check if Spotify is available
    const checkSpotify = () => {
      const available = isSharedTokenAvailable();
      setSpotifyAvailable(available);
      
      if (available) {
        const tokenInfo = getSharedTokenInfo();
        setSharedTokenInfo(tokenInfo);
      }
    };
    
    checkSpotify();
    
    // Check Spotify availability periodically
    const interval = setInterval(checkSpotify, 60000); // Every minute
    
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleRequestSuccess = () => {
    setSubmitSuccess('🎉 Song wurde erfolgreich zur Playlist hinzugefügt!');
    setTimeout(() => setSubmitSuccess(null), 3000);
  };

  // Filter and sort requests
  const filteredAndSortedRequests = React.useMemo(() => {
    let filtered = requests;

    // Apply search filter
    if (searchFilter.trim()) {
      const searchTerm = searchFilter.toLowerCase();
      filtered = requests.filter(request => 
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
  }, [requests, searchFilter, sortBy]);

  // Calculate stats
  const stats = React.useMemo(() => {
    const totalSongs = requests.length;
    const totalVotes = requests.reduce((sum, r) => sum + r.votes, 0);
    const uniqueUsers = new Set(requests.map(r => r.requestedBy)).size;
    const totalDuration = requests.reduce((sum, r) => sum + (r.duration || 0), 0);
    
    return {
      totalSongs,
      totalVotes,
      uniqueUsers,
      totalDurationMinutes: Math.floor(totalDuration / 60000)
    };
  }, [requests]);

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
      {/* Shared Spotify Status Banner */}
      {spotifyAvailable && sharedTokenInfo && (
        <div className={`p-4 rounded-xl transition-colors duration-300 ${
          sharedTokenInfo.daysRemaining <= 7
            ? isDarkMode 
              ? 'bg-yellow-900/20 border border-yellow-700/30' 
              : 'bg-yellow-50 border border-yellow-200'
            : isDarkMode 
              ? 'bg-green-900/20 border border-green-700/30' 
              : 'bg-green-50 border border-green-200'
        }`}>
          <div className="flex items-center gap-3">
            {sharedTokenInfo.daysRemaining <= 7 ? (
              <AlertCircle className={`w-5 h-5 transition-colors duration-300 ${
                isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
              }`} />
            ) : (
              <CheckCircle className={`w-5 h-5 transition-colors duration-300 ${
                isDarkMode ? 'text-green-400' : 'text-green-600'
              }`} />
            )}
            <div className="flex-1">
              <h4 className={`font-semibold transition-colors duration-300 ${
                sharedTokenInfo.daysRemaining <= 7
                  ? isDarkMode ? 'text-yellow-300' : 'text-yellow-800'
                  : isDarkMode ? 'text-green-300' : 'text-green-800'
              }`}>
                {sharedTokenInfo.daysRemaining <= 7 
                  ? '⚠️ Spotify Integration läuft bald ab!'
                  : '🌍 Spotify Integration aktiv für ALLE Benutzer!'
                }
              </h4>
              <div className="flex items-center gap-4 mt-1">
                <p className={`text-sm transition-colors duration-300 ${
                  sharedTokenInfo.daysRemaining <= 7
                    ? isDarkMode ? 'text-yellow-200' : 'text-yellow-700'
                    : isDarkMode ? 'text-green-200' : 'text-green-700'
                }`}>
                  Eingerichtet von {sharedTokenInfo.admin} am {' '}
                  {new Date(sharedTokenInfo.timestamp).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <div className="flex items-center gap-1">
                  <Calendar className={`w-4 h-4 transition-colors duration-300 ${
                    sharedTokenInfo.daysRemaining <= 7
                      ? isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                      : isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`} />
                  <span className={`text-sm font-medium transition-colors duration-300 ${
                    sharedTokenInfo.daysRemaining <= 7
                      ? isDarkMode ? 'text-yellow-300' : 'text-yellow-800'
                      : isDarkMode ? 'text-green-300' : 'text-green-800'
                  }`}>
                    {sharedTokenInfo.daysRemaining <= 7 
                      ? `Läuft in ${sharedTokenInfo.daysRemaining} Tag${sharedTokenInfo.daysRemaining !== 1 ? 'en' : ''} ab`
                      : `Läuft bis ${new Date(sharedTokenInfo.expiryTime).toLocaleDateString('de-DE')} (${sharedTokenInfo.daysRemaining} Tage)`
                    }
                  </span>
                </div>
              </div>
              <p className={`text-xs mt-1 transition-colors duration-300 ${
                sharedTokenInfo.daysRemaining <= 7
                  ? isDarkMode ? 'text-yellow-300' : 'text-yellow-600'
                  : isDarkMode ? 'text-green-300' : 'text-green-600'
              }`}>
                {sharedTokenInfo.daysRemaining <= 7 
                  ? '⚠️ Ein Admin sollte die Integration bald erneuern'
                  : '✅ Alle Songs werden automatisch zur Spotify-Playlist hinzugefügt'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
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

            {/* Stats */}
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

          {/* Add Song Button */}
          <div className="flex flex-col gap-2 ml-4">
            <button
              onClick={() => setShowRequestModal(true)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white' 
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
              }`}
              disabled={!spotifyAvailable}
              title={spotifyAvailable ? 'Song hinzufügen' : 'Spotify nicht verfügbar'}
            >
              <Plus className="w-4 h-4" />
              <span className="font-semibold text-sm">Song hinzufügen</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {submitSuccess && (
        <div className={`p-4 rounded-xl border transition-colors duration-300 ${
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

      {/* No Spotify Integration Warning */}
      {!spotifyAvailable && (
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

      {/* Search and Filter Controls */}
      {requests.length > 0 && (
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

            {/* Sort Options */}
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
              {filteredAndSortedRequests.length} von {requests.length} Songs gefunden
            </div>
          )}
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
    </div>
  );
};