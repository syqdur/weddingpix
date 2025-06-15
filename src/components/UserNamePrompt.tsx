import React, { useState } from 'react';
import { Heart, Camera } from 'lucide-react';

interface UserNamePromptProps {
  onSubmit: (name: string) => void;
}

export const UserNamePrompt: React.FC<UserNamePromptProps> = ({ onSubmit }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center p-4 z-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full overflow-hidden border-4 border-pink-200">
            <img 
              src="/public/image_with_edge_to_edge_grid_and_labels.jpg" 
              alt="Maurizio & Kristin"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-2xl font-light mb-2">kristinundmauro</h1>
          <p className="text-gray-600 text-sm mb-6">
            Willkommen zu unserer Hochzeitsgalerie! 💕<br/>
            Teile deine schönsten Momente mit uns.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Wie heißt du?"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
              autoFocus
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Weiter
          </button>
        </form>
        
        <div className="mt-8 flex items-center justify-center gap-2 text-gray-400">
          <Heart className="w-4 h-4" />
          <span className="text-xs">Kristin & Maurizio • 12.07.2025</span>
          <Heart className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};