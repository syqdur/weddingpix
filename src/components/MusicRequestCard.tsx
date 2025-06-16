import React from 'react';
import { Heart, ExternalLink, Music, Users, Calendar, Trash2 } from 'lucide-react';
import { MusicRequest } from '../types';
import { voteMusicRequest, deleteMusicRequest } from '../services/musicService';

interface MusicRequestCardProps {
  request: MusicRequest;
  isAdmin: boolean;
  currentUser: string;
  isDarkMode: boolean;
  onVote?: (requestId: string) => void;
  onDelete?: (requestId: string) => void;
}

export const MusicRequestCard: React.FC<MusicRequestCardProps> = ({
  request,
  isAdmin,
  currentUser,
  isDarkMode,
  onVote,
  onDelete
}) => {
  const [isVoting, setIsVoting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const hasVoted = request.votedBy.includes(localStorage.getItem('wedding_device_id') || '');
  const canDelete = isAdmin || request.requestedBy === currentUser;

  const handleVote = async () => {
    if (isVoting) return;
    
    setIsVoting(true);
    try {
      const deviceId = localStorage.getItem('wedding_device_id') || '';
      await voteMusicRequest(request.id, deviceId);
      onVote?.(request.id);
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;

    const confirmMessage = isAdmin && request.requestedBy !== currentUser
      ? `Musikwunsch "${request.songTitle}" von ${request.requestedBy} wirklich löschen?`
      : `Deinen Musikwunsch "${request.songTitle}" wirklich löschen?`;

    if (window.confirm(confirmMessage)) {
      setIsDeleting(true);
      try {
        await deleteMusicRequest(request.id);
        onDelete?.(request.id);
      } catch (error) {
        console.error('Error deleting request:', error);
        alert('Fehler beim Löschen des Musikwunsches. Bitte versuche es erneut.');
      } finally {
        setIsDeleting(false);
      }
    }
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

  const formatDuration = (ms?: number) => {
    if (!ms) return '';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`p-4 rounded-xl border transition-all duration-300 hover:scale-105 ${
      isDarkMode 
        ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700' 
        : 'bg-white border-gray-200 hover:bg-gray-50 shadow-lg'
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

              {/* Delete Button */}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className={`p-2 rounded-full transition-colors duration-300 ${
                    isDeleting
                      ? 'cursor-not-allowed opacity-50'
                      : isDarkMode 
                        ? 'text-red-400 hover:bg-gray-600' 
                        : 'text-red-500 hover:bg-red-50'
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

            <div className="flex items-center gap-1 text-sm">
              <Calendar className={`w-4 h-4 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <span className={`transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {formatDate(request.requestedAt)}
              </span>
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
                <div className="w-1 h-1 bg-purple-500 rounded-full mt-2"></div>
                <p className={`text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  "{request.message}"
                </p>
              </div>
            </div>
          )}

          {/* Vote Button */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleVote}
              disabled={isVoting}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                hasVoted
                  ? isDarkMode ? 'bg-pink-600 text-white' : 'bg-pink-500 text-white'
                  : isDarkMode ? 'bg-gray-600 hover:bg-gray-500 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              } ${isVoting ? 'cursor-not-allowed opacity-50' : 'hover:scale-105'}`}
            >
              <Heart className={`w-4 h-4 ${hasVoted ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">
                {request.votes} {request.votes === 1 ? 'Vote' : 'Votes'}
              </span>
            </button>

            {/* Status Badge */}
            <div className={`text-xs px-2 py-1 rounded transition-colors duration-300 ${
              request.status === 'approved'
                ? isDarkMode ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'
                : isDarkMode ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {request.status === 'approved' ? '✅ Hinzugefügt' : '⏳ Wartend'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};