import React from 'react';
import { Trash2, User, Calendar } from 'lucide-react';
import { MediaItem } from '../types';

interface MediaCardProps {
  item: MediaItem;
  onClick: () => void;
  onDelete?: (item: MediaItem) => void;
  showDeleteButton: boolean;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  item,
  onClick,
  onDelete,
  showDeleteButton
}) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && window.confirm('Bild/Video wirklich löschen?')) {
      onDelete(item);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="group relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative overflow-hidden">
        {item.type === 'video' ? (
          <video
            src={item.url}
            className="w-full h-48 object-cover"
            preload="metadata"
          />
        ) : (
          <img
            src={item.url}
            alt="Hochzeitsfoto"
            className="w-full h-48 object-cover cursor-pointer"
            onClick={onClick}
            loading="lazy"
          />
        )}
        
        {showDeleteButton && (
          <button
            onClick={handleDelete}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User className="w-4 h-4" />
          <span className="font-medium">{item.uploadedBy}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(item.uploadedAt)}</span>
        </div>
      </div>
    </div>
  );
};