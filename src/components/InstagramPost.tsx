import React, { useState } from 'react';
import { Heart, MessageCircle, MoreHorizontal, Trash2 } from 'lucide-react';
import { MediaItem, Comment, Like } from '../types';

interface InstagramPostProps {
  item: MediaItem;
  comments: Comment[];
  likes: Like[];
  onAddComment: (mediaId: string, text: string) => void;
  onDeleteComment: (commentId: string) => void;
  onToggleLike: (mediaId: string) => void;
  onDelete?: (item: MediaItem) => void;
  showDeleteButton: boolean;
  userName: string;
  isAdmin: boolean;
  onClick: () => void;
  isDarkMode: boolean;
}

export const InstagramPost: React.FC<InstagramPostProps> = ({
  item,
  comments,
  likes,
  onAddComment,
  onDeleteComment,
  onToggleLike,
  onDelete,
  showDeleteButton,
  userName,
  isAdmin,
  onClick,
  isDarkMode
}) => {
  const [commentText, setCommentText] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const isLiked = likes.some(like => like.userName === userName);
  const likeCount = likes.length;

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      onAddComment(item.id, commentText.trim());
      setCommentText('');
    }
  };

  const handleDelete = () => {
    if (onDelete && window.confirm('Beitrag wirklich löschen?')) {
      onDelete(item);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    if (window.confirm('Kommentar wirklich löschen?')) {
      onDeleteComment(commentId);
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
    console.error(`❌ Image failed to load: ${item.url}`);
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

  const displayComments = showAllComments ? comments : comments.slice(0, 2);

  // Generate beautiful wedding-themed avatar based on username
  const getAvatarUrl = (username: string) => {
    const weddingAvatars = [
      'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', // Wedding rings
      'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', // White roses
      'https://images.pexels.com/photos/1616113/pexels-photo-1616113.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', // Pink flowers
      'https://images.pexels.com/photos/1729797/pexels-photo-1729797.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', // Wedding bouquet
      'https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', // White peonies
      'https://images.pexels.com/photos/1070850/pexels-photo-1070850.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', // Pink roses
      'https://images.pexels.com/photos/1444424/pexels-photo-1444424.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', // Wedding bands
      'https://images.pexels.com/photos/1024967/pexels-photo-1024967.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', // White flowers
      'https://images.pexels.com/photos/1729799/pexels-photo-1729799.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', // Bridal bouquet
      'https://images.pexels.com/photos/1444443/pexels-photo-1444443.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'  // Diamond ring
    ];
    
    // Use username to consistently select an avatar
    const hash = username.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return weddingAvatars[Math.abs(hash) % weddingAvatars.length];
  };

  return (
    <div className={`border-b transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
    }`}>
      {/* Post Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 p-0.5">
            <div className="w-full h-full rounded-full overflow-hidden">
              <img 
                src={getAvatarUrl(item.uploadedBy)}
                alt={item.uploadedBy}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div>
            <span className={`font-semibold text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {item.uploadedBy}
            </span>
            <div className={`text-xs transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {formatDate(item.uploadedAt)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showDeleteButton && (
            <button
              onClick={handleDelete}
              className="p-1 text-red-500 hover:bg-red-50 rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <MoreHorizontal className={`w-5 h-5 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`} />
        </div>
      </div>

      {/* Media Content */}
      <div className="relative">
        {item.type === 'video' ? (
          <video
            src={item.url}
            className="w-full aspect-square object-cover"
            controls
            preload="metadata"
            onLoadStart={() => setImageLoading(true)}
            onLoadedData={() => setImageLoading(false)}
            onError={() => {
              setImageLoading(false);
              setImageError(true);
            }}
          />
        ) : (
          <div className="relative w-full aspect-square bg-gray-100">
            {imageLoading && (
              <div className={`absolute inset-0 flex items-center justify-center transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            
            {imageError ? (
              <div className={`absolute inset-0 flex flex-col items-center justify-center transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
              }`}>
                <div className="text-4xl mb-2">📷</div>
                <p className="text-sm text-center px-4">
                  Bild konnte nicht geladen werden
                </p>
                <p className="text-xs text-center px-4 mt-1">
                  Von {item.uploadedBy}
                </p>
              </div>
            ) : (
              <img
                src={item.url}
                alt="Hochzeitsfoto"
                className={`w-full h-full object-cover cursor-pointer transition-opacity duration-300 ${
                  imageLoading ? 'opacity-0' : 'opacity-100'
                }`}
                onClick={onClick}
                onLoad={handleImageLoad}
                onError={handleImageError}
                loading="lazy"
              />
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onToggleLike(item.id)}
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

        {/* Likes */}
        <div className="mb-2">
          <span className={`font-semibold text-sm transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {likeCount > 0 ? `${likeCount} „Gefällt mir"-Angabe${likeCount > 1 ? 'n' : ''}` : 'Gefällt dir das?'}
          </span>
        </div>

        {/* Comments */}
        <div className="space-y-1">
          {displayComments.map((comment) => (
            <div key={comment.id} className="text-sm flex items-start justify-between group">
              <div className="flex-1">
                <span className={`font-semibold mr-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {comment.userName}
                </span>
                <span className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {comment.text}
                </span>
              </div>
              {isAdmin && (
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="opacity-0 group-hover:opacity-100 ml-2 p-1 text-red-500 hover:bg-red-50 rounded transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          
          {comments.length > 2 && !showAllComments && (
            <button
              onClick={() => setShowAllComments(true)}
              className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              Alle {comments.length} Kommentare ansehen
            </button>
          )}
        </div>

        {/* Add Comment */}
        <form onSubmit={handleSubmitComment} className={`mt-3 pt-3 border-t transition-colors duration-300 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-100'
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
  );
};