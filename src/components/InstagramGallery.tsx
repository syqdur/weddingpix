import React from 'react';
import { MediaItem, Comment } from '../types';
import { InstagramPost } from './InstagramPost';

interface InstagramGalleryProps {
  items: MediaItem[];
  onItemClick: (index: number) => void;
  onDelete?: (item: MediaItem) => void;
  isAdmin: boolean;
  comments: Comment[];
  onAddComment: (mediaId: string, text: string) => void;
  userName: string;
}

export const InstagramGallery: React.FC<InstagramGalleryProps> = ({
  items,
  onItemClick,
  onDelete,
  isAdmin,
  comments,
  onAddComment,
  userName
}) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-16 h-16 mx-auto mb-4 border-2 border-gray-300 rounded-full flex items-center justify-center">
          <span className="text-2xl">📸</span>
        </div>
        <h3 className="text-xl font-light mb-2">Noch keine Beiträge</h3>
        <p className="text-gray-500 text-sm">Lade das erste Foto von eurer Hochzeit hoch!</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {items.map((item, index) => (
        <InstagramPost
          key={item.id}
          item={item}
          comments={comments.filter(c => c.mediaId === item.id)}
          onAddComment={onAddComment}
          onDelete={onDelete}
          showDeleteButton={isAdmin}
          userName={userName}
          onClick={() => onItemClick(index)}
        />
      ))}
    </div>
  );
};