import React, { useState } from 'react';
import { Grid, List, Heart, MessageCircle, Trash2, Edit3 } from 'lucide-react';
import { MediaItem, Comment, Like } from '../types';
import { InstagramPost } from './InstagramPost';
import { NotePost } from './NotePost';

interface InstagramGalleryProps {
  items: MediaItem[];
  onItemClick: (index: number) => void;
  onDelete?: (item: MediaItem) => void;
  onEditNote?: (item: MediaItem, newText: string) => void;
  isAdmin: boolean;
  comments: Comment[];
  likes: Like[];
  onAddComment: (mediaId: string, text: string) => void;
  onDeleteComment: (commentId: string) => void;
  onToggleLike: (mediaId: string) => void;
  userName: string;
  isDarkMode: boolean;
}

export const InstagramGallery: React.FC<InstagramGalleryProps> = ({
  items,
  onItemClick,
  onDelete,
  onEditNote,
  isAdmin,
  comments,
  likes,
  onAddComment,
  onDeleteComment,
  onToggleLike,
  userName,
  isDarkMode
}) => {
  const [viewMode, setViewMode] = useState<'feed' | 'grid'>('feed');

  if (items.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className={`w-16 h-16 mx-auto mb-4 border-2 rounded-full flex items-center justify-center transition-colors duration-300 ${
          isDarkMode ? 'border-gray-600' : 'border-gray-300'
        }`}>
          <span className="text-2xl">📸</span>
        </div>
        <h3 className={`text-xl font-light mb-2 transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Noch keine Beiträge
        </h3>
        <p className={`text-sm transition-colors duration-300 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          Lade das erste Foto von eurer Hochzeit hoch oder hinterlasse eine Notiz!
        </p>
      </div>
    );
  }

  // Filter items for grid view
  const mediaItems = items.filter(item => item.type !== 'note');
  const noteItems = items.filter(item => item.type === 'note');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'vor wenigen Minuten';
    if (diffInHours < 24) return `vor ${diffInHours}h`;
    if (diffInHours < 168) return `vor ${Math.floor(diffInHours / 24)}d`;
    return date.toLocaleDateString('de-DE');
  };

  const getAvatarUrl = (username: string) => {
    const weddingAvatars = [
      'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1616113/pexels-photo-1616113.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1729797/pexels-photo-1729797.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1070850/pexels-photo-1070850.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1444424/pexels-photo-1444424.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1024967/pexels-photo-1024967.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1729799/pexels-photo-1729799.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      'https://images.pexels.com/photos/1444443/pexels-photo-1444443.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
    ];
    
    const hash = username.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return weddingAvatars[Math.abs(hash) % weddingAvatars.length];
  };

  return (
    <div>
      {/* View Toggle */}
      <div className={`flex items-center justify-center p-4 border-b transition-colors duration-300 ${
        isDarkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <div className={`flex rounded-lg p-1 transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          <button
            onClick={() => setViewMode('feed')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-300 ${
              viewMode === 'feed'
                ? isDarkMode
                  ? 'bg-gray-700 text-white shadow-sm'
                  : 'bg-white text-gray-900 shadow-sm'
                : isDarkMode
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <List className="w-4 h-4" />
            <span className="text-sm font-medium">Feed</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-300 ${
              viewMode === 'grid'
                ? isDarkMode
                  ? 'bg-gray-700 text-white shadow-sm'
                  : 'bg-white text-gray-900 shadow-sm'
                : isDarkMode
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span className="text-sm font-medium">Grid</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'feed' ? (
        // Feed View (existing)
        <div className="space-y-0">
          {items.map((item, index) => (
            item.type === 'note' ? (
              <NotePost
                key={item.id}
                item={item}
                comments={comments.filter(c => c.mediaId === item.id)}
                likes={likes.filter(l => l.mediaId === item.id)}
                onAddComment={onAddComment}
                onDeleteComment={onDeleteComment}
                onToggleLike={onToggleLike}
                onDelete={onDelete}
                onEditNote={onEditNote}
                showDeleteButton={isAdmin}
                userName={userName}
                isAdmin={isAdmin}
                isDarkMode={isDarkMode}
              />
            ) : (
              <InstagramPost
                key={item.id}
                item={item}
                comments={comments.filter(c => c.mediaId === item.id)}
                likes={likes.filter(l => l.mediaId === item.id)}
                onAddComment={onAddComment}
                onDeleteComment={onDeleteComment}
                onToggleLike={onToggleLike}
                onDelete={onDelete}
                onEditNote={onEditNote}
                showDeleteButton={isAdmin}
                userName={userName}
                isAdmin={isAdmin}
                onClick={() => onItemClick(index)}
                isDarkMode={isDarkMode}
              />
            )
          ))}
        </div>
      ) : (
        // Grid View (new)
        <div className="p-1">
          {/* Notes Grid */}
          {noteItems.length > 0 && (
            <div className="mb-6">
              <h3 className={`text-lg font-semibold mb-3 px-3 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                💌 Notizen ({noteItems.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-3">
                {noteItems.map((item) => {
                  const itemLikes = likes.filter(l => l.mediaId === item.id);
                  const itemComments = comments.filter(c => c.mediaId === item.id);
                  const isLiked = itemLikes.some(like => like.userName === userName);
                  const canDelete = isAdmin || item.uploadedBy === userName;
                  const canEdit = item.uploadedBy === userName;
                  
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border transition-all duration-300 hover:scale-[1.02] ${
                        isDarkMode 
                          ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800' 
                          : 'bg-white border-gray-200 hover:bg-gray-50 shadow-sm'
                      }`}
                    >
                      {/* Note Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full overflow-hidden">
                            <img 
                              src={getAvatarUrl(item.uploadedBy)}
                              alt={item.uploadedBy}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <span className={`font-semibold text-sm transition-colors duration-300 ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {item.uploadedBy}
                              {item.uploadedBy === userName && (
                                <span className={`ml-1 text-xs px-1.5 py-0.5 rounded transition-colors duration-300 ${
                                  isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  Du
                                </span>
                              )}
                            </span>
                            <div className={`text-xs transition-colors duration-300 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {formatDate(item.uploadedAt)}
                            </div>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          {canEdit && (
                            <button
                              onClick={() => {
                                const newText = prompt('Notiz bearbeiten:', item.noteText);
                                if (newText && newText.trim() && onEditNote) {
                                  onEditNote(item, newText.trim());
                                }
                              }}
                              className={`p-1 rounded transition-colors duration-300 ${
                                isDarkMode ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-500 hover:bg-blue-50'
                              }`}
                              title="Notiz bearbeiten"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => onDelete && onDelete(item)}
                              className={`p-1 rounded transition-colors duration-300 ${
                                isDarkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-500 hover:bg-red-50'
                              }`}
                              title="Notiz löschen"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Note Content */}
                      <div className={`p-3 rounded-lg mb-3 transition-colors duration-300 ${
                        isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                      }`}>
                        <p className={`text-sm leading-relaxed transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-800'
                        }`}>
                          "{item.noteText}"
                        </p>
                      </div>

                      {/* Note Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => onToggleLike(item.id)}
                            className={`flex items-center gap-1 transition-colors ${
                              isLiked ? 'text-red-500' : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                            <span className="text-sm font-medium">{itemLikes.length}</span>
                          </button>
                          <div className={`flex items-center gap-1 transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">{itemComments.length}</span>
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          💌 Notiz
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Media Grid */}
          {mediaItems.length > 0 && (
            <div>
              <h3 className={`text-lg font-semibold mb-3 px-3 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                📸 Medien ({mediaItems.length})
              </h3>
              <div className="grid grid-cols-3 gap-1">
                {mediaItems.map((item, mediaIndex) => {
                  // Find the original index in the full items array
                  const originalIndex = items.findIndex(i => i.id === item.id);
                  const itemLikes = likes.filter(l => l.mediaId === item.id);
                  const itemComments = comments.filter(c => c.mediaId === item.id);
                  
                  return (
                    <div
                      key={item.id}
                      className="relative aspect-square cursor-pointer group"
                      onClick={() => onItemClick(originalIndex)}
                    >
                      {/* Media Content */}
                      <div className="w-full h-full overflow-hidden">
                        {item.type === 'video' ? (
                          <div className="relative w-full h-full">
                            <video
                              src={item.url}
                              className="w-full h-full object-cover"
                              muted
                              preload="metadata"
                            />
                            {/* Video indicator */}
                            <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1">
                              <div className="w-0 h-0 border-l-[6px] border-l-white border-y-[4px] border-y-transparent ml-0.5"></div>
                            </div>
                          </div>
                        ) : item.isUnavailable || !item.url ? (
                          <div className={`w-full h-full flex items-center justify-center transition-colors duration-300 ${
                            isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                          }`}>
                            <div className="text-center">
                              <div className="text-2xl mb-1">📷</div>
                              <div className="text-xs">Nicht verfügbar</div>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={item.url}
                            alt="Hochzeitsfoto"
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        )}
                      </div>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="flex items-center gap-4 text-white">
                          <div className="flex items-center gap-1">
                            <Heart className="w-4 h-4 fill-current" />
                            <span className="font-semibold">{itemLikes.length}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            <span className="font-semibold">{itemComments.length}</span>
                          </div>
                        </div>
                      </div>

                      {/* Media type indicator */}
                      {item.type === 'image' && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="bg-black/60 rounded-full p-1">
                            <span className="text-white text-xs">📸</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty Grid State */}
          {mediaItems.length === 0 && noteItems.length === 0 && (
            <div className="text-center py-12">
              <div className={`w-16 h-16 mx-auto mb-4 border-2 rounded-full flex items-center justify-center transition-colors duration-300 ${
                isDarkMode ? 'border-gray-600' : 'border-gray-300'
              }`}>
                <Grid className={`w-8 h-8 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
              </div>
              <h3 className={`text-xl font-light mb-2 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Keine Inhalte
              </h3>
              <p className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Lade das erste Foto hoch oder hinterlasse eine Notiz!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};