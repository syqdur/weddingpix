import React from 'react';
import { MediaItem, Comment, Like } from '../types';
import { InstagramPost } from './InstagramPost';
import { NotePost } from './NotePost';

interface InstagramGalleryProps {
  items: MediaItem[];
  onItemClick: (index: number) => void;
  onDelete?: (item: MediaItem) => void;
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
  isAdmin,
  comments,
  likes,
  onAddComment,
  onDeleteComment,
  onToggleLike,
  userName,
  isDarkMode
}) => {
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

  return (
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
            showDeleteButton={isAdmin}
            userName={userName}
            isAdmin={isAdmin}
            onClick={() => onItemClick(index)}
            isDarkMode={isDarkMode}
          />
        )
      ))}
    </div>
  );
};