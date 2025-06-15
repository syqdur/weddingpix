import React, { useState } from 'react';
import { Music, Heart, Clock, ExternalLink, MessageSquare, Users, Play, Check, X, Trash2, Crown } from 'lucide-react';
import { MusicRequest } from '../types';
import { voteMusicRequest, updateMusicRequestStatus, deleteMusicRequest } from '../services/musicService';

interface MusicRequestsListProps {
  requests: MusicRequest[];
  currentUser: string;
  deviceId: string;
  isAdmin: boolean;
  isDarkMode: boolean;
}

export const MusicRequestsList: React.FC<MusicRequestsListProps> = ({
  requests,
  currentUser,
  deviceId,
  isAdmin,
  isDarkMode
}) => {
  const [votingRequests, setVotingRequests] = useState<Set<string>>(new Set());
  const [deletingRequests, setDeletingRequests] = useState<Set<string>>(new Set());

  const handleVote = async (requestId: string) => {
    if (votingRequests.has(requestId)) return;

    setVotingRequests(prev => new Set(prev).add(requestId));
    try {
      await voteMusicRequest(requestId, deviceId);
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setVotingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleStatusUpdate = async (requestId: string, status: MusicRequest['status']) => {
    try {
      await updateMusicRequestStatus(requestId, status);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (request: MusicRequest) => {
    // 🎯 NEW: Only allow deletion of own requests (or admin can delete any)
    const canDelete = isAdmin || request.requestedBy === currentUser;
    if (!canDelete) {
      alert('Du kannst nur deine eigenen Musikwünsche löschen.');
      return;
    }

    if (deletingRequests.has(request.id)) return;

    const confirmMessage = isAdmin 
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

  const formatDuration = (ms?: number) => {
    if (!ms) return '';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: MusicRequest['status']) => {
    switch (status) {
      case 'pending': return isDarkMode ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-800';
      case 'approved': return isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800';
      case 'played': return isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800';
      case 'rejected': return isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800';
      default: return isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: MusicRequest['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-3 h-3" />;
      case 'approved': return <Check className="w-3 h-3" />;
      case 'played': return <Play className="w-3 h-3" />;
      case 'rejected': return <X className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const getStatusText = (status: MusicRequest['status']) => {
    switch (status) {
      case 'pending': return 'Wartend';
      case 'approved': return 'Genehmigt';
      case 'played': return 'Gespielt';
      case 'rejected': return 'Abgelehnt';
      default: return 'Unbekannt';
    }
  };

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className={`w-16 h-16 mx-auto mb-4 border-2 rounded-full flex items-center justify-center transition-colors duration-300 ${
          isDarkMode ? 'border-gray-600' : 'border-gray-300'
        }`}>
          <Music className="w-8 h-8 text-green-500" />
        </div>
        <h3 className={`text-xl font-light mb-2 transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Noch keine Musikwünsche
        </h3>
        <p className={`text-sm transition-colors duration-300 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          Sei der Erste und wünsche dir einen Song für die Hochzeit!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => {
        const hasVoted = request.votedBy.includes(deviceId);
        const canDelete = isAdmin || request.requestedBy === currentUser;
        const isVoting = votingRequests.has(request.id);
        const isDeleting = deletingRequests.has(request.id);

        return (
          <div key={request.id} className={`p-4 rounded-xl border transition-all duration-300 ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600' 
              : 'bg-white border-gray-200 shadow-sm'
          } ${isDeleting ? 'opacity-50' : ''}`}>
            <div className="flex items-start gap-4">
              {/* Album Art */}
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-300 flex-shrink-0">
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
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold truncate transition-colors duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {request.songTitle}
                    </h4>
                    <p className={`text-sm truncate transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {request.artist}
                    </p>
                    {request.album && (
                      <p className={`text-xs truncate transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {request.album}
                        {request.duration && ` • ${formatDuration(request.duration)}`}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    {/* Spotify Link */}
                    {request.spotifyUrl && (
                      <a
                        href={request.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-2 rounded-full transition-colors duration-300 ${
                          isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
                        }`}
                        title="Auf Spotify anhören"
                      >
                        <ExternalLink className="w-4 h-4 text-white" />
                      </a>
                    )}

                    {/* Delete Button - Only show for own requests or admin */}
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(request)}
                        disabled={isDeleting}
                        className={`p-2 rounded-full transition-colors duration-300 ${
                          isDeleting
                            ? 'cursor-not-allowed opacity-50'
                            : isDarkMode 
                              ? 'text-red-400 hover:bg-gray-600' 
                              : 'text-red-500 hover:bg-red-50'
                        }`}
                        title={request.requestedBy === currentUser ? "Deinen Musikwunsch löschen" : "Musikwunsch löschen"}
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
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1 text-sm">
                    <Users className={`w-4 h-4 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <span className={`transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {request.requestedBy}
                      {request.requestedBy === currentUser && (
                        <span className={`ml-1 text-xs px-1.5 py-0.5 rounded transition-colors duration-300 ${
                          isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
                        }`}>
                          Du
                        </span>
                      )}
                    </span>
                  </div>

                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(request.status)}`}>
                    {getStatusIcon(request.status)}
                    {getStatusText(request.status)}
                  </div>

                  {request.popularity && (
                    <div className="flex items-center gap-1 text-sm">
                      <Heart className={`w-4 h-4 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                      <span className={`transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {request.popularity}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Message */}
                {request.message && (
                  <div className={`p-3 rounded-lg mb-3 transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-600' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-start gap-2">
                      <MessageSquare className={`w-4 h-4 mt-0.5 flex-shrink-0 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                      <p className={`text-sm transition-colors duration-300 ${
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
                    onClick={() => handleVote(request.id)}
                    disabled={isVoting || isDeleting}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                      hasVoted
                        ? isDarkMode
                          ? 'bg-pink-600 text-white'
                          : 'bg-pink-500 text-white'
                        : isDarkMode
                          ? 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    } ${(isVoting || isDeleting) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isVoting ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Heart className={`w-4 h-4 ${hasVoted ? 'fill-current' : ''}`} />
                    )}
                    <span className="text-sm font-medium">{request.votes}</span>
                    <span className="text-xs">
                      {hasVoted ? 'Gefällt dir' : 'Gefällt mir'}
                    </span>
                  </button>

                  {/* Admin Controls */}
                  {isAdmin && request.status === 'pending' && !isDeleting && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStatusUpdate(request.id, 'approved')}
                        className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        Genehmigen
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(request.id, 'rejected')}
                        className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs transition-colors"
                      >
                        <X className="w-3 h-3" />
                        Ablehnen
                      </button>
                    </div>
                  )}

                  {isAdmin && request.status === 'approved' && !isDeleting && (
                    <button
                      onClick={() => handleStatusUpdate(request.id, 'played')}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs transition-colors"
                    >
                      <Play className="w-3 h-3" />
                      Als gespielt markieren
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};