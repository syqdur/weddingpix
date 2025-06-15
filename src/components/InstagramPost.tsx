import React, { useState } from 'react';
import { Heart, MessageCircle, Share, Bookmark, MoreHorizontal, Trash2 } from 'lucide-react';
import { MediaItem, Comment } from '../types';

interface InstagramPostProps {
  item: MediaItem;
  comments: Comment[];
  onAddComment: (mediaId: string, text: string) => void;
  onDelete?: (item: MediaItem) => void;
  showDeleteButton: boolean;
  userName: string;
  onClick: () => void;
}

export const InstagramPost: React.FC<InstagramPostProps> = ({
  item,
  comments,
  onAddComment,
  onDelete,
  showDeleteButton,
  userName,
  onClick
}) => {
  const [commentText, setCommentText] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);
  const [liked, setLiked] = useState(false);

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

  return (
    <div className="bg-white border-b border-gray-100">
      {/* Post Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 p-0.5">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
              <span className="text-xs">👤</span>
            </div>
          </div>
          <div>
            <span className="font-semibold text-sm">{item.uploadedBy}</span>
            <div className="text-xs text-gray-500">{formatDate(item.uploadedAt)}</div>
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
          <MoreHorizontal className="w-5 h-5 text-gray-600" />
        </div>
      </div>

      {/* Media Content */}
      <div className="relative">
        {item.type === 'video' ? (
          <video
            src={item.url}
            className="w-full aspect-square object-cover"
            controls
          />
        ) : (
          <img
            src={item.url}
            alt="Hochzeitsfoto"
            className="w-full aspect-square object-cover cursor-pointer"
            onClick={onClick}
          />
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setLiked(!liked)}
              className={`transition-colors ${liked ? 'text-red-500' : 'text-gray-700'}`}
            >
              <Heart className={`w-6 h-6 ${liked ? 'fill-current' : ''}`} />
            </button>
            <MessageCircle className="w-6 h-6 text-gray-700" />
            <Share className="w-6 h-6 text-gray-700" />
          </div>
          <Bookmark className="w-6 h-6 text-gray-700" />
        </div>

        {/* Likes */}
        <div className="mb-2">
          <span className="font-semibold text-sm">
            {liked ? '1 „Gefällt mir"-Angabe' : 'Gefällt dir das?'}
          </span>
        </div>

        {/* Comments */}
        <div className="space-y-1">
          {displayComments.map((comment) => (
            <div key={comment.id} className="text-sm">
              <span className="font-semibold mr-2">{comment.userName}</span>
              <span>{comment.text}</span>
            </div>
          ))}
          
          {comments.length > 2 && !showAllComments && (
            <button
              onClick={() => setShowAllComments(true)}
              className="text-gray-500 text-sm"
            >
              Alle {comments.length} Kommentare ansehen
            </button>
          )}
        </div>

        {/* Add Comment */}
        <form onSubmit={handleSubmitComment} className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-xs">👤</span>
            </div>
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Kommentieren..."
              className="flex-1 text-sm outline-none"
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