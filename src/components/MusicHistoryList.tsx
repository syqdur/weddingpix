import React from 'react';
import { Music, Heart, Clock, ExternalLink, Users, Calendar, Award, Trash2, Star, Play, Pause, Volume2 } from 'lucide-react';
import { MusicRequest } from '../types';
import { deleteMusicRequest, voteMusicRequest } from '../services/musicService';

interface MusicHistoryListProps {
  requests: MusicRequest[];
  currentUser: string;
  isAdmin: boolean;
  isDarkMode: boolean;
}

export const MusicHistoryList: React.FC<MusicHistoryListProps> = ({
  requests,
  currentUser,
  isAdmin,
  isDarkMode
}) => {
  const [deletingRequests, setDeletingRequests] = React.useState<Set<string>>(new Set());
  const [votingRequests, setVotingRequests] = React.useState<Set<string>>(new Set());

  const formatDuration = (ms?: number) => {
    if (!ms) return '';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'vor wenigen Minuten';
    if (diffInHours < 24) return `vor ${diffInHours}h`;
    if (diffInHours < 168) return `vor ${Math.floor(diffInHours / 24)}d`;
    return formatDate(dateString);
  };

  const handleVote = async (request: MusicRequest) => {
    if (votingRequests.has(request.id)) return;

    setVotingRequests(prev => new Set(prev).add(request.id));
    
    try {
      const deviceId = localStorage.getItem('wedding_device_id') || '';
      await voteMusicRequest(request.id, deviceId);
    } catch (error) {
      console.error('Error voting:', error);
      alert('Fehler beim Voten. Bitte versuche es erneut.');
    } finally {
      setVotingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(request.id);
        return newSet;
      });
    }
  };

  const handleDelete = async (request: MusicRequest) => {
    const canDelete = isAdmin || request.requestedBy === currentUser;
    
    if (!canDelete) {
      alert('Du kannst nur deine eigenen Musikwünsche löschen.');
      return;
    }

    if (deletingRequests.has(request.id)) return;

    const confirmMessage = isAdmin && request.requestedBy !== currentUser
      ? `Musikwunsch "${request.songTitle}" von ${request.requestedBy} wirklich löschen?`
      : `Deinen Musikwunsch "${request.songTitle}" wirklich löschen?`;

    if (window.confirm(confirmMessage)) {
      setDeletingRequests(prev => new Set(prev).add(request.id));
      
      try {
        await deleteMusicRequest(request.id);
        console.log(`✅ Music request deleted: ${request.songTitle}`);
      } catch (error) {
        console.error('Error deleting request:', error);
        alert('Fehler beim Löschen des Musikwunsches. Bitte versuche es erneut.');
      } finally {
        setDeletingRequests(prev => {
          const newSet = new Set(prev);
          newSet.delete(request.id);
          return newSet;
        });
      }
    }
  };

  const hasUserVoted = (request: MusicRequest) => {
    const deviceId = localStorage.getItem('wedding_device_id') || '';
    return request.votedBy.includes(deviceId);
  };

  if (requests.length === 0) {
    return (
      <div className="text-center py-16">
        <div className={`w-24 h-24 mx-auto mb-6 border-2 rounded-full flex items-center justify-center transition-colors duration-300 ${
          isDarkMode ? 'border-gray-600' : 'border-gray-300'
        }`}>
          <Music className="w-12 h-12 text-green-500" />
        </div>
        <h3 className={`text-2xl font-light mb-4 transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Noch keine Musikwünsche
        </h3>
        <p className={`text-lg mb-6 transition-colors duration-300 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          Sei der Erste und füge einen Song zur Hochzeits-Playlist hinzu!
        </p>
        <div className={`max-w-md mx-auto p-6 rounded-2xl transition-colors duration-300 ${
          isDarkMode ? 'bg-blue-900/20 border border-blue-700/30' : 'bg-blue-50 border border-blue-200'
        }`}>
          <h4 className={`font-semibold mb-3 transition-colors duration-300 ${
            isDarkMode ? 'text-blue-300' : 'text-blue-800'
          }`}>
            💡 So funktioniert's:
          </h4>
          <ul className={`text-sm space-y-2 text-left transition-colors duration-300 ${
            isDarkMode ? 'text-blue-200' : 'text-blue-700'
          }`}>
            <li>🔍 Suche nach deinem Lieblingssong</li>
            <li>🎯 Song wird sofort zur Playlist hinzugefügt</li>
            <li>👍 Andere Gäste können für Songs voten</li>
            <li>🎶 Beliebte Songs werden häufiger gespielt</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className={`p-6 rounded-2xl transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <Award className={`w-6 h-6 transition-colors duration-300 ${
            isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
          }`} />
          <h4 className={`text-xl font-semibold transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            🎵 Playlist-Übersicht
          </h4>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`}>
              {requests.length}
            </div>
            <div className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Songs gewünscht
            </div>
          </div>
          
          <div className="text-center">
            <div className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
              isDarkMode ? 'text-green-400' : 'text-green-600'
            }`}>
              {new Set(requests.map(r => r.requestedBy)).size}
            </div>
            <div className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Verschiedene Gäste
            </div>
          </div>
          
          <div className="text-center">
            <div className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
              isDarkMode ? 'text-pink-400' : 'text-pink-600'
            }`}>
              {requests.reduce((sum, r) => sum + r.votes, 0)}
            </div>
            <div className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Gesamt Votes
            </div>
          </div>
          
          <div className="text-center">
            <div className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
              isDarkMode ? 'text-purple-400' : 'text-purple-600'
            }`}>
              {Math.floor(requests.reduce((sum, r) => sum + (r.duration || 0), 0) / 60000)}
            </div>
            <div className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Minuten Musik
            </div>
          </div>
        </div>
      </div>

      {/* Songs List */}
      <div className="space-y-4">
        {requests.map((request, index) => {
          const canDelete = isAdmin || request.requestedBy === currentUser;
          const isDeleting = deletingRequests.has(request.id);
          const isVoting = votingRequests.has(request.id);
          const userHasVoted = hasUserVoted(request);

          return (
            <div key={request.id} className={`group p-6 rounded-2xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${
              isDarkMode 
                ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800' 
                : 'bg-white border-gray-200 hover:bg-gray-50 shadow-sm'
            } ${isDeleting ? 'opacity-50' : ''}`}>
              <div className="flex items-start gap-4">
                {/* Rank Badge */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-colors duration-300 ${
                  index < 3 
                    ? isDarkMode ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-800'
                    : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}>
                  {index === 0 && '🥇'}
                  {index === 1 && '🥈'}
                  {index === 2 && '🥉'}
                  {index > 2 && `#${index + 1}`}
                </div>

                {/* Album Art */}
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-300 flex-shrink-0 shadow-md">
                  {request.albumArt ? (
                    <img 
                      src={request.albumArt}
                      alt={request.album}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                </div>

                {/* Song Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-lg font-semibold truncate transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {request.songTitle}
                      </h4>
                      <p className={`text-base truncate transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {request.artist}
                      </p>
                      {request.album && (
                        <p className={`text-sm truncate transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {request.album}
                          {request.duration && ` • ${formatDuration(request.duration)}`}
                          {request.popularity && ` • ${request.popularity}% Popularität`}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {/* Spotify Link */}
                      {request.spotifyUrl && (
                        <a
                          href={request.spotifyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`p-3 rounded-xl transition-all duration-300 hover:scale-110 ${
                            isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
                          }`}
                          title="Auf Spotify anhören"
                        >
                          <ExternalLink className="w-4 h-4 text-white" />
                        </a>
                      )}

                      {/* Delete Button */}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(request)}
                          disabled={isDeleting}
                          className={`p-3 rounded-xl transition-all duration-300 hover:scale-110 ${
                            isDeleting
                              ? 'cursor-not-allowed opacity-50'
                              : isDarkMode 
                                ? 'bg-red-600 hover:bg-red-700 text-white' 
                                : 'bg-red-500 hover:bg-red-600 text-white'
                          }`}
                          title={
                            isAdmin && request.requestedBy !== currentUser
                              ? `Musikwunsch von ${request.requestedBy} löschen`
                              : "Deinen Musikwunsch löschen"
                          }
                        >
                          {isDeleting ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Request Info */}
                  <div className="flex items-center gap-6 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className={`w-4 h-4 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                      <span className={`transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {request.requestedBy}
                        {request.requestedBy === currentUser && (
                          <span className={`ml-2 text-xs px-2 py-1 rounded-full transition-colors duration-300 ${
                            isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
                          }`}>
                            Du
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className={`w-4 h-4 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                      <span className={`transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {getTimeAgo(request.requestedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Message */}
                  {request.message && (
                    <div className={`p-4 rounded-xl mb-4 transition-colors duration-300 ${
                      isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                        <p className={`text-sm leading-relaxed transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          "{request.message}"
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Bottom Actions */}
                  <div className="flex items-center justify-between">
                    {/* Vote Button */}
                    <button
                      onClick={() => handleVote(request)}
                      disabled={isVoting}
                      className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 ${
                        userHasVoted
                          ? isDarkMode ? 'bg-pink-600 text-white shadow-lg' : 'bg-pink-500 text-white shadow-lg'
                          : isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      } ${isVoting ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      <Heart className={`w-5 h-5 ${userHasVoted ? 'fill-current' : ''} ${isVoting ? 'animate-pulse' : ''}`} />
                      <span className="font-semibold">
                        {request.votes} {request.votes === 1 ? 'Vote' : 'Votes'}
                      </span>
                    </button>

                    {/* Status Badge */}
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors duration-300 ${
                      request.status === 'approved'
                        ? isDarkMode ? 'bg-green-600/20 text-green-300 border border-green-600/30' : 'bg-green-100 text-green-800 border border-green-200'
                        : isDarkMode ? 'bg-yellow-600/20 text-yellow-300 border border-yellow-600/30' : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        request.status === 'approved' ? 'bg-green-500' : 'bg-yellow-500'
                      }`}></div>
                      <span className="text-sm font-medium">
                        {request.status === 'approved' ? '✅ In Playlist' : '⏳ Wartend'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};