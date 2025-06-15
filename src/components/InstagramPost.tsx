import React, { useState, useRef } from 'react';
import { Heart, MessageCircle, MoreHorizontal, Trash2, Play, Pause } from 'lucide-react';
import { MediaItem, Comment, Like } from '../types';
import { AudioWaveform } from './AudioWaveform';

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
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

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
    <div className={`border-b transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
    }`}>
      {/* Post Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 p-0.5">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
              <span className="text-xs">👤</span>
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
          />
        ) : item.type === 'audio' ? (
          <div className={`w-full aspect-square flex flex-col items-center justify-center relative transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            {/* Audio thumbnail background */}
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src="https://images.pexels.com/photos/164938/pexels-photo-164938.jpeg?auto=compress&cs=tinysrgb&w=400"
                alt="Audio Nachricht"
                className="w-full h-full object-cover opacity-30"
              />
            </div>
            
            {/* Audio controls and waveform */}
            <div className="relative z-10 flex flex-col items-center gap-6 w-full px-8">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-600' : 'bg-white'
              } shadow-lg`}>
                <button
                  onClick={toggleAudioPlayback}
                  className="text-pink-500 hover:text-pink-600 transition-colors"
                >
                  {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                </button>
              </div>
              
              {/* Waveform Visualization */}
              <div className="w-full max-w-xs">
                <AudioWaveform
                  isPlaying={isPlaying}
                  audioElement={audioRef.current}
                  color={isDarkMode ? '#ec4899' : '#ec4899'}
                  className="rounded-lg"
                />
              </div>
              
              <div className={`text-center transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                <div className="font-semibold">🎵 Audio Nachricht</div>
                <div className="text-sm opacity-75">Tippe zum Abspielen</div>
              </div>
            </div>
            
            <audio
              ref={audioRef}
              src={item.url}
              onPlay={handleAudioPlay}
              onPause={handleAudioPause}
              onEnded={handleAudioEnded}
              preload="metadata"
            />
          </div>
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
  );
};