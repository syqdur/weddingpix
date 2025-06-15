import React, { useState } from 'react';
import { Plus, Camera } from 'lucide-react';

interface UploadSectionProps {
  onUpload: (files: FileList) => Promise<void>;
  isUploading: boolean;
  progress: number;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onUpload,
  isUploading,
  progress
}) => {
  const [files, setFiles] = useState<FileList | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
    }
  };

  return (
    <div className="p-4 border-b border-gray-100">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center relative overflow-hidden">
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Plus className="w-6 h-6 text-gray-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">Neuer Beitrag</h3>
          <p className="text-xs text-gray-500">
            Teile deine schönsten Momente von der Hochzeit
          </p>
          {progress > 0 && (
            <div className="w-full bg-gray-200 h-1 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-blue-500 h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
        <Camera className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  );
};