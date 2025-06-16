import React from 'react';
import { Music, Heart, Clock, ExternalLink, Users, Calendar, Award, Trash2 } from 'lucide-react';
import { MusicRequest } from '../types';
import { deleteMusicRequest } from '../services/musicService';

interface MusicHistoryListProps {
  requests: MusicRequest[];
  currentUser: string;
  isDarkMode: boolean;
}

export const MusicHistoryList: React.FC<MusicHistoryListProps> = ({
  requests,
  currentUser,
  isDarkMode
}) => {
  const [deletingRequests, setDeletingRequests] = React.useState<Set<string>>(new Set());

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

  const handleDelete = async (request: MusicRequest) => {
    // Only allow deletion of own requests
    if (request.requestedBy !== currentUser) {
      alert('Du kannst nur deine eigenen Musikwünsche löschen.');
      return;
    }

    if (deletingRequests.has(request.id)) return;

    const confirmMessage = `Deinen Musikwunsch "${request.songTitle}" wirklich löschen?`;

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

  // Sort by most recently added
  const sortedRequests = [...requests].sort((a, b) => 
    new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
  );

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
          Hier erscheinen alle Songs die für die Hochzeit gewünscht wurden
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className={`p-4 rounded-xl transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-700/50 border border-gray-600' : 'bg-gray-50 border border-gray-200'
      }`}>
        <div className="flex items-center gap-3 mb-3">
          <Award className={`w-5 h-5 transition-colors duration-300 ${
            isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
          }`} />
          <h4 className={`font-semibold transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            🎵 Hochzeits-Playlist Statistiken
          </h4>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold transition-colors duration-300 ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`}>
              {requests.length}
            </div>
            <div className={`text-xs transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Songs gewünscht
            </div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold transition-colors duration-300 ${
              isDarkMode ? 'text-green-400' : 'text-green-600'
            }`}>
              {new Set(requests.map(r => r.requestedBy)).size}
            </div>
            <div className={`text-xs transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Verschiedene Gäste
            </div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold transition-colors duration-300 ${
              isDarkMode ? 'text-pink-400' : 'text-pink-600'
            }`}>
              {requests.reduce((sum, r) => sum + r.votes, 0)}
            </div>
            <div className={`text-xs transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Gesamt Votes
            </div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold transition-colors duration-300 ${
              isDarkMode ? 'text-purple-400' : 'text-purple-600'
            }`}>
              {Math.floor(requests.reduce((sum, r) => sum + (r.duration || 0), 0) / 60000)}
            </div>
            <div className={`text-xs transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Minuten Musik
            </div>
          </div>
        </div>
      </div>

      {/* History List */}
      {sortedRequests.map((request, index) => {
        const canDelete = request.requestedBy === currentUser;
        const isDeleting = deletingRequests.has(request.id);

        return (
          <div key={request.id} className={`p-4 rounded-xl border transition-all duration-300 ${
            isDarkMode 
              ? 'bg-gray-700/50 border-gray-600' 
              : 'bg-white border-gray-200 shadow-sm'
          } ${isDeleting ? 'opacity-50' : ''}`}>
            <div className="flex items-start gap-4">
              {/* Album Art */}
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-300 flex-shrink-0">
                {request.albumArt ? (
                  <img 
                    src={request.albumArt}
                    alt={request.album}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="w-4 h-4 text-gray-500" />
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

                    {/* Delete Button - Only for own requests */}
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
                        title="Deinen Musikwunsch löschen"
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
                      {getTimeAgo(request.requestedAt)}
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

                {/* Bottom Info */}
                <div className="flex items-center justify-between">
                  {/* Vote Count */}
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-600' : 'bg-gray-100'
                  }`}>
                    <Heart className="w-4 h-4 text-pink-500 fill-current" />
                    <span className={`text-sm font-medium transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {request.votes} {request.votes === 1 ? 'Vote' : 'Votes'}
                    </span>
                  </div>

                  {/* Position in List */}
                  <div className={`text-xs px-2 py-1 rounded transition-colors duration-300 ${
                    index < 3 
                      ? isDarkMode ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-800'
                      : isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                  }`}>
                    #{index + 1}
                    {index === 0 && ' 🥇'}
                    {index === 1 && ' 🥈'}
                    {index === 2 && ' 🥉'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};