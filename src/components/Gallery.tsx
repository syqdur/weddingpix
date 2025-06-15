import React from 'react';
import { MediaItem } from '../types';
import { MediaCard } from './MediaCard';

interface GalleryProps {
  items: MediaItem[];
  onItemClick: (index: number) => void;
  onDelete?: (item: MediaItem) => void;
  isAdmin: boolean;
}

export const Gallery: React.FC<GalleryProps> = ({
  items,
  onItemClick,
  onDelete,
  isAdmin
}) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📸</div>
        <p className="text-gray-500">Noch keine Bilder hochgeladen.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item, index) => (
        <MediaCard
          key={item.id}
          item={item}
          onClick={() => onItemClick(index)}
          onDelete={onDelete}
          showDeleteButton={isAdmin}
        />
      ))}
    </div>
  );
};