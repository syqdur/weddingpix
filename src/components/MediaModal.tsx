import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Trash2, Play, Pause } from 'lucide-react';
import { MediaItem, Comment, Like } from '../types';
import { AudioWaveform } from './AudioWaveform';

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
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

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

  // Reset audio state when modal closes or item changes
  useEffect(() => {
    if (!isOpen || !currentItem) {
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [isOpen, currentItem]);

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

  const toggleAudioPlayback = () => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        // Reset audio to beginning and play
        audio.currentTime = 0;
        audio.play().catch(error => {
          console.error('Error playing audio:', error);
        });
      }
    }
  };

  const handleAudioPlay = () => setIsPlaying(true);
  const handleAudioPause = () => setIsPlaying(false);
  const handleAudioEnded = () => setIsPlaying(false);

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
            />
          ) : currentItem.type === 'audio' ? (
            <div className="w-full h-full flex flex-col items-center justify-center relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src="https://images.pexels.com/photos/164938/pexels-photo-164938.jpeg?auto=compress&cs=tinysrgb&w=400"
                  alt="Audio Nachricht"
                  className="w-full h-full object-cover opacity-30"
                />
              </div>
              <div className="relative z-10 flex flex-col items-center gap-6 w-full px-8">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <button
                    onClick={toggleAudioPlayback}
                    className="text-pink-500 hover:text-pink-600 transition-colors"
                  >
                    {isPlaying ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-1" />}
                  </button>
                </div>
                
                {/* Waveform Visualization */}
                <div className="w-full max-w-sm">
                  <AudioWaveform
                    isPlaying={isPlaying}
                    audioElement={audioRef.current}
                    color="#ec4899"
                    className="rounded-lg"
                  />
                </div>
                
                <div className="text-center text-white">
                  <div className="font-semibold text-lg">🎵 Audio Nachricht</div>
                  <div className="text-sm opacity-75">Tippe zum Abspielen</div>
                </div>
              </div>
              <audio
                ref={audioRef}
                src={currentItem.url}
                onPlay={handleAudioPlay}
                onPause={handleAudioPause}
                onEnded={handleAudioEnded}
                preload="metadata"
              />
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
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                  <span className="text-xs">👤</span>
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
                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs">👤</span>
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
              <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-xs">👤</span>
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