import React from 'react';
import { Music, Heart, ExternalLink, Users, Calendar, Trash2, Play, Volume2, Clock, CheckSquare, Square } from 'lucide-react';
import { MusicRequest } from '../types';
import { deleteMusicRequest, voteMusicRequest, bulkDeleteMusicRequests } from '../services/musicService';

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
  const [selectedRequests, setSelectedRequests] = React.useState<Set<string>>(new Set());
  const [bulkDeleteMode, setBulkDeleteMode] = React.useState(false);

  const formatDuration = (ms?: number) => {
    if (!ms) return '';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'vor wenigen Minuten';
    if (diffInHours < 24) return `vor ${diffInHours}h`;
    if (diffInHours < 168) return `vor ${Math.floor(diffInHours / 24)}d`;
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
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
      ? `Musikwunsch "${request.songTitle}" von ${request.requestedBy} wirklich löschen?\n\n⚠️ Der Song wird auch automatisch aus der Spotify-Playlist entfernt!`
      : `Deinen Musikwunsch "${request.songTitle}" wirklich löschen?\n\n⚠️ Der Song wird auch automatisch aus der Spotify-Playlist entfernt!`;

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

  // Bulk delete functionality
  const handleBulkDelete = async () => {
    if (selectedRequests.size === 0) {
      alert('Keine Songs ausgewählt.');
      return;
    }

    const selectedSongs = requests.filter(r => selectedRequests.has(r.id));
    const canDeleteAll = selectedSongs.every(song => 
      isAdmin || song.requestedBy === currentUser
    );

    if (!canDeleteAll) {
      alert('Du kannst nur deine eigenen Songs löschen. Bitte wähle nur deine eigenen Songs aus.');
      return;
    }

    const songTitles = selectedSongs.map(s => `"${s.songTitle}"`).join(', ');
    const confirmMessage = `${selectedRequests.size} Song${selectedRequests.size > 1 ? 's' : ''} wirklich löschen?\n\n${songTitles}\n\n⚠️ Alle Songs werden auch automatisch aus der Spotify-Playlist entfernt!`;

    if (window.confirm(confirmMessage)) {
      try {
        const result = await bulkDeleteMusicRequests(Array.from(selectedRequests));
        
        if (result.success > 0) {
          setSelectedRequests(new Set());
          setBulkDeleteMode(false);
          alert(`✅ ${result.success} Song${result.success > 1 ? 's' : ''} erfolgreich gelöscht!`);
        }
        
        if (result.errors.length > 0) {
          console.error('Bulk delete errors:', result.errors);
          alert(`⚠️ ${result.errors.length} Song${result.errors.length > 1 ? 's' : ''} konnten nicht gelöscht werden.`);
        }
      } catch (error) {
        console.error('Error in bulk delete:', error);
        alert('Fehler beim Löschen der Songs. Bitte versuche es erneut.');
      }
    }
  };

  const toggleSelection = (requestId: string) => {
    setSelectedRequests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(requestId)) {
        newSet.delete(requestId);
      } else {
        newSet.add(requestId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    const userSongs = requests.filter(r => isAdmin || r.requestedBy === currentUser);
    setSelectedRequests(new Set(userSongs.map(r => r.id)));
  };

  const deselectAll = () => {
    setSelectedRequests(new Set());
  };

  const hasUserVoted = (request: MusicRequest) => {
    const deviceId = localStorage.getItem('wedding_device_id') || '';
    return request.votedBy.includes(deviceId);
  };

  // Filter songs that user can delete
  const userDeletableSongs = requests.filter(r => isAdmin || r.requestedBy === currentUser);

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
            <li>🎵 Automatisch auch zu Spotify (falls eingerichtet)</li>
            <li>👍 Andere Gäste können für Songs voten</li>
            <li>🎶 Beliebte Songs werden häufiger gespielt</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Delete Controls */}
      {userDeletableSongs.length > 0 && (
        <div className={`p-4 rounded-xl transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setBulkDeleteMode(!bulkDeleteMode)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  bulkDeleteMode
                    ? isDarkMode ? 'bg-red-600 text-white' : 'bg-red-500 text-white'
                    : isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {bulkDeleteMode ? 'Auswahl beenden' : 'Mehrere löschen'}
                </span>
              </button>

              {bulkDeleteMode && (
                <>
                  <span className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {selectedRequests.size} von {userDeletableSongs.length} ausgewählt
                  </span>
                  
                  <button
                    onClick={selectAll}
                    className={`text-sm px-2 py-1 rounded transition-colors ${
                      isDarkMode ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    Alle
                  </button>
                  
                  <button
                    onClick={deselectAll}
                    className={`text-sm px-2 py-1 rounded transition-colors ${
                      isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Keine
                  </button>
                </>
              )}
            </div>

            {bulkDeleteMode && selectedRequests.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'
                } text-white`}
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {selectedRequests.size} löschen
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Songs List */}
      <div className="space-y-3">
        {requests.map((request, index) => {
          const canDelete = isAdmin || request.requestedBy === currentUser;
          const isDeleting = deletingRequests.has(request.id);
          const isVoting = votingRequests.has(request.id);
          const userHasVoted = hasUserVoted(request);
          const isSelected = selectedRequests.has(request.id);
          const showCheckbox = bulkDeleteMode && canDelete;

          return (
            <div key={request.id} className={`group p-4 rounded-xl border transition-all duration-300 hover:scale-[1.01] hover:shadow-md ${
              isDarkMode 
                ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800' 
                : 'bg-white border-gray-200 hover:bg-gray-50 shadow-sm'
            } ${isDeleting ? 'opacity-50' : ''} ${isSelected ? 'ring-2 ring-red-500' : ''}`}>
              <div className="flex items-center gap-3">
                {/* Selection Checkbox */}
                {showCheckbox && (
                  <button
                    onClick={() => toggleSelection(request.id)}
                    className={`p-1 rounded transition-colors ${
                      isSelected
                        ? 'text-red-500'
                        : isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                  </button>
                )}

                {/* Rank Badge */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-300 ${
                  index < 3 
                    ? isDarkMode ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-800'
                    : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}>
                  {index === 0 && '🥇'}
                  {index === 1 && '🥈'}
                  {index === 2 && '🥉'}
                  {index > 2 && `${index + 1}`}
                </div>

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
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-semibold text-sm truncate transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {request.songTitle}
                      </h4>
                      <p className={`text-xs truncate transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {request.artist}
                        {request.duration && ` • ${formatDuration(request.duration)}`}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 ml-2">
                      {/* Vote Button */}
                      <button
                        onClick={() => handleVote(request)}
                        disabled={isVoting}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all duration-300 ${
                          userHasVoted
                            ? isDarkMode ? 'bg-pink-600 text-white' : 'bg-pink-500 text-white'
                            : isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        } ${isVoting ? 'cursor-not-allowed opacity-50' : 'hover:scale-105'}`}
                      >
                        <Heart className={`w-3 h-3 ${userHasVoted ? 'fill-current' : ''}`} />
                        <span className="font-medium">{request.votes}</span>
                      </button>

                      {/* Spotify Link */}
                      {request.spotifyUrl && (
                        <a
                          href={request.spotifyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`p-1.5 rounded-lg transition-all duration-300 hover:scale-110 ${
                            isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
                          }`}
                          title="Auf Spotify anhören"
                        >
                          <ExternalLink className="w-3 h-3 text-white" />
                        </a>
                      )}

                      {/* Delete Button */}
                      {canDelete && !bulkDeleteMode && (
                        <button
                          onClick={() => handleDelete(request)}
                          disabled={isDeleting}
                          className={`p-1.5 rounded-lg transition-all duration-300 hover:scale-110 ${
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
                            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Request Info */}
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-xs">
                      <Users className={`w-3 h-3 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                      <span className={`transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {request.requestedBy}
                        {request.requestedBy === currentUser && (
                          <span className={`ml-1 text-xs px-1 py-0.5 rounded transition-colors duration-300 ${
                            isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
                          }`}>
                            Du
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs">
                      <Clock className={`w-3 h-3 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                      <span className={`transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {getTimeAgo(request.requestedAt)}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className={`text-xs px-2 py-0.5 rounded transition-colors duration-300 ${
                      request.status === 'approved'
                        ? isDarkMode ? 'bg-green-600/20 text-green-300' : 'bg-green-100 text-green-800'
                        : isDarkMode ? 'bg-yellow-600/20 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {request.status === 'approved' ? '✅ In Playlist' : '⏳ Wartend'}
                    </div>
                  </div>

                  {/* Message */}
                  {request.message && (
                    <div className={`mt-2 p-2 rounded-lg transition-colors duration-300 ${
                      isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                    }`}>
                      <p className={`text-xs leading-relaxed transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        "{request.message}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};