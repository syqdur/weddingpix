import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Trash2 } from 'lucide-react';
import { MediaItem, Comment, Like } from '../types';

interface MediaModalProps {
  isOpen: boolean;
  items: MediaItem[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  comments: Comment[];
  likes: Like[];
  onAddComment: (mediaId: string, text: string) => void;
  onDeleteComment: (commentId: string) => void;
  onToggleLike: (mediaId: string) => void;
  userName: string;
  isAdmin: boolean;
  isDarkMode: boolean;
}

export const MediaModal: React.FC<MediaModalProps> = ({
  isOpen,
  items,
  currentIndex,
  onClose,
  onNext,
  onPrev,
  comments,
  likes,
  onAddComment,
  onDeleteComment,
  onToggleLike,
  userName,
  isAdmin,
  isDarkMode
}) => {
  const [commentText, setCommentText] = useState('');

  const currentItem = items[currentIndex];
  const currentComments = comments.filter(c => c.mediaId === currentItem?.id);
  const currentLikes = likes.filter(l => l.mediaId === currentItem?.id);
  const isLiked = currentLikes.some(like => like.userName === userName);
  const likeCount = currentLikes.length;

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          onPrev();
          break;
        case 'ArrowRight':
          onNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, onClose, onNext, onPrev]);

  if (!isOpen || !currentItem) return null;

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      onAddComment(currentItem.id, commentText.trim());
      setCommentText('');
    }
  };

  const handleDeleteComment = (commentId: string) => {
    if (window.confirm('Kommentar wirklich löschen?')) {
      onDeleteComment(commentId);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'vor wenigen Minuten';
    if (diffInHours < 24) return `vor ${diffInHours}h`;
    if (diffInHours < 168) return `vor ${Math.floor(diffInHours / 24)}d`;
    return date.toLocaleDateString('de-DE');
  };

  // Generate beautiful avatar based on username
  const getAvatarUrl = (username: string) => {
    const avatars = [
      'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1212984/pexels-photo-1212984.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1484794/pexels-photo-1484794.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
    ];
    
    // Use username to consistently select an avatar
    const hash = username.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return avatars[Math.abs(hash) % avatars.length];
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex">
      {/* Mobile Instagram-style modal */}
      <div className={`w-full max-w-md mx-auto flex flex-col transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b transition-colors duration-300 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button onClick={onClose}>
            <X className={`w-6 h-6 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`} />
          </button>
          <span className={`font-semibold transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Beitrag
          </span>
          <div></div>
        </div>

        {/* Media */}
        <div className="flex-1 relative bg-black flex items-center justify-center">
          {currentItem.type === 'video' ? (
            <video
              src={currentItem.url}
              controls
              className="max-w-full max-h-full"
              preload="metadata"
            />
          ) : currentItem.type === 'note' ? (
            <div className={`w-full h-full flex flex-col items-center justify-center p-8 transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gradient-to-br from-purple-900/50 to-pink-900/50' 
                : 'bg-gradient-to-br from-purple-100 to-pink-100'
            }`}>
              <div className={`max-w-sm w-full p-6 rounded-2xl transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-800/80 border border-purple-700/30' : 'bg-white/90 border border-purple-200/50'
              }`}>
                <div className="text-center mb-6">
                  <div className="text-4xl mb-2">💌</div>
                  <h3 className={`text-xl font-semibold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Notiz
                  </h3>
                </div>
                <div className={`p-4 rounded-xl transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                }`}>
                  <p className={`text-base leading-relaxed transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    "{currentItem.noteText}"
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <img
              src={currentItem.url}
              alt="Hochzeitsfoto"
              className="max-w-full max-h-full object-contain"
            />
          )}
          
          {items.length > 1 && (
            <>
              <button
                onClick={onPrev}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={onNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Actions and Comments */}
        <div className={`transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          {/* Action buttons */}
          <div className={`flex items-center justify-between p-4 border-b transition-colors duration-300 ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => onToggleLike(currentItem.id)}
                className={`transition-colors ${
                  isLiked ? 'text-red-500' : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
              </button>
              <MessageCircle className={`w-6 h-6 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`} />
            </div>
          </div>

          {/* Post info */}
          <div className="px-4 py-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 p-0.5">
                <div className="w-full h-full rounded-full overflow-hidden">
                  <img 
                    src={getAvatarUrl(currentItem.uploadedBy)}
                    alt={currentItem.uploadedBy}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div>
                <span className={`font-semibold text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {currentItem.uploadedBy}
                </span>
                <div className={`text-xs transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {formatDate(currentItem.uploadedAt)}
                </div>
              </div>
            </div>
            <div className="mb-2">
              <span className={`font-semibold text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {likeCount > 0 ? `${likeCount} „Gefällt mir"-Angabe${likeCount > 1 ? 'n' : ''}` : 'Gefällt dir das?'}
              </span>
            </div>
          </div>

          {/* Comments */}
          <div className="max-h-40 overflow-y-auto px-4">
            {currentComments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3 py-2 group">
                <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                  <img 
                    src={getAvatarUrl(comment.userName)}
                    alt={comment.userName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <span className={`font-semibold text-sm mr-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {comment.userName}
                  </span>
                  <span className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {comment.text}
                  </span>
                  <div className={`text-xs mt-1 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    {formatDate(comment.createdAt)}
                  </div>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add comment */}
          <form onSubmit={handleSubmitComment} className={`p-4 border-t transition-colors duration-300 ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full overflow-hidden">
                <img 
                  src={getAvatarUrl(userName)}
                  alt={userName}
                  className="w-full h-full object-cover"
                />
              </div>
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Kommentieren..."
                className={`flex-1 text-sm outline-none bg-transparent transition-colors duration-300 ${
                  isDarkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
                }`}
              />
              {commentText.trim() && (
                <button
                  type="submit"
                  className="text-blue-500 font-semibold text-sm"
                >
                  Posten
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};