import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Share, Bookmark } from 'lucide-react';
import { MediaItem, Comment } from '../types';

interface MediaModalProps {
  isOpen: boolean;
  items: MediaItem[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  comments: Comment[];
  onAddComment: (mediaId: string, text: string) => void;
  userName: string;
}

export const MediaModal: React.FC<MediaModalProps> = ({
  isOpen,
  items,
  currentIndex,
  onClose,
  onNext,
  onPrev,
  comments,
  onAddComment,
  userName
}) => {
  const [commentText, setCommentText] = useState('');
  const [liked, setLiked] = useState(false);

  const currentItem = items[currentIndex];
  const currentComments = comments.filter(c => c.mediaId === currentItem?.id);

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'vor wenigen Minuten';
    if (diffInHours < 24) return `vor ${diffInHours}h`;
    if (diffInHours < 168) return `vor ${Math.floor(diffInHours / 24)}d`;
    return date.toLocaleDateString('de-DE');
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex">
      {/* Mobile Instagram-style modal */}
      <div className="w-full max-w-md mx-auto bg-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <button onClick={onClose}>
            <X className="w-6 h-6" />
          </button>
          <span className="font-semibold">Beitrag</span>
          <div></div>
        </div>

        {/* Media */}
        <div className="flex-1 relative bg-black flex items-center justify-center">
          {currentItem.type === 'video' ? (
            <video
              src={currentItem.url}
              controls
              className="max-w-full max-h-full"
            />
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
        <div className="bg-white">
          {/* Action buttons */}
          <div className="flex items-center justify-between p-4 border-b">
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

          {/* Post info */}
          <div className="px-4 py-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 p-0.5">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                  <span className="text-xs">👤</span>
                </div>
              </div>
              <div>
                <span className="font-semibold text-sm">{currentItem.uploadedBy}</span>
                <div className="text-xs text-gray-500">{formatDate(currentItem.uploadedAt)}</div>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="max-h-40 overflow-y-auto px-4">
            {currentComments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3 py-2">
                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs">👤</span>
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-sm mr-2">{comment.userName}</span>
                  <span className="text-sm">{comment.text}</span>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDate(comment.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add comment */}
          <form onSubmit={handleSubmitComment} className="p-4 border-t">
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
    </div>
  );
};