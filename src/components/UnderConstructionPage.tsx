import React, { useState, useEffect } from 'react';
import { Heart, Sun, Moon, Lock, Unlock, Power } from 'lucide-react';

interface UnderConstructionPageProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const UnderConstructionPage: React.FC<UnderConstructionPageProps> = ({
  isDarkMode,
  toggleDarkMode
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [password, setPassword] = useState('');
  const [isUnderConstruction, setIsUnderConstruction] = useState(true);

  const weddingDate = new Date('2025-07-12T00:00:00');

  useEffect(() => {
    // Check if under construction is disabled
    const constructionStatus = localStorage.getItem('wedding_under_construction');
    if (constructionStatus === 'false') {
      setIsUnderConstruction(false);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const difference = weddingDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'remove') {
      // Disable under construction temporarily
      localStorage.setItem('wedding_under_construction', 'false');
      window.location.reload();
    } else if (password === 'permanent') {
      // Disable under construction permanently
      localStorage.setItem('wedding_under_construction', 'false');
      localStorage.setItem('wedding_under_construction_permanent', 'true');
      alert('✅ Under Construction wurde permanent deaktiviert!\n\nDie Website ist jetzt dauerhaft für alle Besucher verfügbar.');
      window.location.reload();
    } else if (password === 'aktivieren') {
      // Enable under construction
      localStorage.setItem('wedding_under_construction', 'true');
      localStorage.removeItem('wedding_under_construction_permanent');
      setShowPasswordInput(false);
      setPassword('');
    } else {
      alert('Falsches Passwort!\n\nVerfügbare Befehle:\n- "remove" = Temporär deaktivieren\n- "permanent" = Permanent deaktivieren\n- "aktivieren" = Aktivieren');
      setPassword('');
    }
  };

  const isPermanentlyDisabled = () => {
    return localStorage.getItem('wedding_under_construction_permanent') === 'true';
  };

  // If under construction is disabled, redirect to main app
  if (!isUnderConstruction) {
    window.location.reload();
    return null;
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900' 
        : 'bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50'
    }`}>
      {/* Header */}
      <div className="flex justify-between items-center p-6">
        <div></div>
        <button
          onClick={toggleDarkMode}
          className={`p-3 rounded-full transition-all duration-300 ${
            isDarkMode 
              ? 'text-yellow-400 hover:bg-white/10 hover:scale-110' 
              : 'text-gray-600 hover:bg-black/10 hover:scale-110'
          }`}
        >
          {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Profile Image */}
        <div className="mb-8 relative">
          <div className={`w-32 h-32 rounded-full overflow-hidden border-4 transition-all duration-500 ${
            isDarkMode ? 'border-pink-400 shadow-2xl shadow-pink-500/20' : 'border-pink-300 shadow-2xl shadow-pink-300/30'
          }`}>
            <img 
              src="https://i.ibb.co/PvXjwss4/profil.jpg" 
              alt="Kristin & Maurizio"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -top-2 -right-2 animate-pulse">
            <Heart className={`w-8 h-8 fill-current transition-colors duration-500 ${
              isDarkMode ? 'text-pink-400' : 'text-pink-500'
            }`} />
          </div>
        </div>

        {/* Title */}
        <h1 className={`text-4xl md:text-6xl font-light mb-4 transition-colors duration-500 ${
          isDarkMode ? 'text-white' : 'text-gray-800'
        }`}>
          Kristin & Maurizio
        </h1>

        <div className={`text-xl md:text-2xl mb-8 transition-colors duration-500 ${
          isDarkMode ? 'text-pink-300' : 'text-pink-600'
        }`}>
          12. Juli 2025
        </div>

        {/* Under Construction Message */}
        <div className={`max-w-2xl mb-12 transition-colors duration-500 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          <h2 className={`text-2xl md:text-3xl font-light mb-4 transition-colors duration-500 ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Unsere Hochzeitswebsite entsteht
          </h2>
          <p className="text-lg leading-relaxed">
            Wir arbeiten gerade an etwas Wunderschönem für unseren besonderen Tag. 
            Bald könnt ihr hier alle magischen Momente unserer Hochzeit mit uns teilen!
          </p>
        </div>

        {/* Countdown */}
        <div className="mb-12">
          <h3 className={`text-xl mb-6 transition-colors duration-500 ${
            isDarkMode ? 'text-pink-300' : 'text-pink-600'
          }`}>
            Noch so lange bis zu unserem großen Tag:
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-lg mx-auto">
            {[
              { value: timeLeft.days, label: 'Tage' },
              { value: timeLeft.hours, label: 'Stunden' },
              { value: timeLeft.minutes, label: 'Minuten' },
              { value: timeLeft.seconds, label: 'Sekunden' }
            ].map((item, index) => (
              <div 
                key={index}
                className={`p-4 rounded-2xl backdrop-blur-sm transition-all duration-500 ${
                  isDarkMode 
                    ? 'bg-white/10 border border-white/20' 
                    : 'bg-white/60 border border-white/40 shadow-lg'
                }`}
              >
                <div className={`text-3xl md:text-4xl font-bold transition-colors duration-500 ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  {item.value.toString().padStart(2, '0')}
                </div>
                <div className={`text-sm uppercase tracking-wide transition-colors duration-500 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hearts Animation */}
        <div className="flex items-center gap-2 mb-8">
          {[...Array(5)].map((_, i) => (
            <Heart 
              key={i}
              className={`w-4 h-4 fill-current animate-pulse transition-colors duration-500 ${
                isDarkMode ? 'text-pink-400' : 'text-pink-500'
              }`}
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>

        {/* Footer Message */}
        <p className={`text-sm transition-colors duration-500 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          Wir freuen uns darauf, diesen besonderen Moment mit euch zu teilen! 💕
        </p>

        {/* Status Indicator */}
        {isPermanentlyDisabled() && (
          <div className={`mt-6 px-4 py-2 rounded-full transition-colors duration-500 ${
            isDarkMode ? 'bg-green-900/30 border border-green-700/50' : 'bg-green-100 border border-green-300'
          }`}>
            <div className="flex items-center gap-2">
              <Power className={`w-4 h-4 transition-colors duration-500 ${
                isDarkMode ? 'text-green-400' : 'text-green-600'
              }`} />
              <span className={`text-sm transition-colors duration-500 ${
                isDarkMode ? 'text-green-300' : 'text-green-700'
              }`}>
                Under Construction ist permanent deaktiviert
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Admin Control Button */}
      <div className="fixed bottom-6 left-6">
        <button
          onClick={() => setShowPasswordInput(true)}
          className={`p-3 rounded-full transition-all duration-300 ${
            isDarkMode
              ? 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white backdrop-blur-sm'
              : 'bg-white/50 hover:bg-white/70 text-gray-600 hover:text-gray-800 backdrop-blur-sm'
          }`}
          title="Website verwalten"
        >
          {isUnderConstruction ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
        </button>
      </div>

      {/* Password Input Modal */}
      {showPasswordInput && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-3xl p-8 max-w-sm w-full transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
          }`}>
            <h3 className={`text-xl font-semibold mb-6 text-center transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Website verwalten
            </h3>
            
            <div className={`mb-6 p-4 rounded-xl transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-700/50 border border-gray-600' : 'bg-gray-50 border border-gray-200'
            }`}>
              <h4 className={`font-semibold mb-2 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Verfügbare Befehle:
              </h4>
              <ul className={`text-sm space-y-1 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <li><code className="bg-gray-600 text-white px-2 py-1 rounded">remove</code> - Temporär deaktivieren</li>
                <li><code className="bg-orange-600 text-white px-2 py-1 rounded">permanent</code> - Permanent deaktivieren</li>
                <li><code className="bg-blue-600 text-white px-2 py-1 rounded">aktivieren</code> - Wieder aktivieren</li>
              </ul>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Befehl eingeben..."
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordInput(false);
                    setPassword('');
                  }}
                  className={`flex-1 py-3 px-4 rounded-xl transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' 
                      : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                  }`}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-3 px-4 rounded-xl transition-colors"
                >
                  Ausführen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};