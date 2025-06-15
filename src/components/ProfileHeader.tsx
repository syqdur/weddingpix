import React from 'react';
import { Settings, UserPlus } from 'lucide-react';

export const ProfileHeader: React.FC = () => {
  return (
    <div className="p-4 border-b border-gray-100">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200">
          <img 
            src="https://i.ibb.co/PvXjwss4/profil.jpg" 
            alt="Maurizio & Kristin"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold">kristinundmauro</h2>
          <div className="flex gap-6 mt-2 text-sm">
            <span><strong>∞</strong> Follower</span>
            </div>
        </div>
      </div>
      <button
  className="p-2 rounded text-sm bg-gray-200 dark:bg-gray-700 dark:text-white"
  onClick={() => setDarkMode(!darkMode)}
>
  {darkMode ? '🌙 Dark' : '☀️ Light'}
</button>
      
      <div className="space-y-2">
        <h3 className="font-semibold">Kristin & Maurizio 💕</h3>
        <p className="text-sm text-gray-600">
          Wir sagen JA! ✨<br/>
          12.07.2025 - Der schönste Tag unseres Lebens 💍<br/>
          Teilt eure Lieblingsmomente mit uns! 📸<br/>
          #MaurizioUndKristin #Hochzeit2024 #FürImmer
          coded by Mauro 
        </p>
      </div>
      
      <div className="flex gap-2 mt-4">
        
        <button className="bg-gray-200 p-1.5 rounded-md">
          <UserPlus className="w-4 h-4" />
        </button>
        <button className="bg-gray-200 p-1.5 rounded-md">
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};