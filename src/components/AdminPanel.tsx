import React, { useState } from 'react';
import { Lock, Unlock, Eye, EyeOff, LogOut } from 'lucide-react';

interface AdminPanelProps {
  isAdmin: boolean;
  onToggleAdmin: (isAdmin: boolean) => void;
  isUnderConstruction: boolean;
  onToggleUnderConstruction: () => void;
  isDarkMode: boolean;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isAdmin,
  onToggleAdmin,
  isUnderConstruction,
  onToggleUnderConstruction,
  isDarkMode
}) => {
  const [showPinInput, setShowPinInput] = useState(false);
  const [pin, setPin] = useState('');

  const correctPIN = "2407";

  const handleAdminToggle = () => {
    if (isAdmin) {
      // Admin logout
      onToggleAdmin(false);
      // Also remove from localStorage to ensure clean logout
      localStorage.removeItem('wedding_admin_mode');
    } else {
      setShowPinInput(true);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === correctPIN) {
      onToggleAdmin(true);
      // Also set in localStorage for persistence
      localStorage.setItem('wedding_admin_mode', 'true');
      setShowPinInput(false);
      setPin('');
    } else {
      alert('Falscher Code!');
      setPin('');
    }
  };

  return (
    <>
      {/* Admin Toggle Button */}
      <button
        onClick={handleAdminToggle}
        className={`fixed bottom-4 left-4 p-3 rounded-full shadow-lg transition-colors duration-300 ${
          isDarkMode
            ? isAdmin
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            : isAdmin
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
        }`}
        title={isAdmin ? "Admin-Modus verlassen" : "Admin-Modus"}
      >
        {isAdmin ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
      </button>

      {/* Under Construction Toggle (only visible to admin) */}
      {isAdmin && (
        <button
          onClick={onToggleUnderConstruction}
          className={`fixed bottom-4 left-20 p-3 rounded-full shadow-lg transition-colors duration-300 ${
            isDarkMode
              ? isUnderConstruction
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-orange-600 hover:bg-orange-700 text-white'
              : isUnderConstruction
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-orange-500 hover:bg-orange-600 text-white'
          }`}
          title={isUnderConstruction ? "Website für Gäste aktivieren" : "Under Construction für Gäste aktivieren"}
        >
          {isUnderConstruction ? <Eye className="w-6 h-6" /> : <EyeOff className="w-6 h-6" />}
        </button>
      )}

      {/* Admin Status Indicator */}
      {isAdmin && (
        <div className={`fixed top-4 right-4 px-3 py-1 rounded-full text-xs font-medium transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-green-600/20 text-green-400 border border-green-600/30' 
            : 'bg-green-100 text-green-800 border border-green-200'
        }`}>
          Admin-Modus aktiv
        </div>
      )}

      {/* Under Construction Status Indicator */}
      {isAdmin && isUnderConstruction && (
        <div className={`fixed top-4 left-4 px-3 py-1 rounded-full text-xs font-medium transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-orange-600/20 text-orange-400 border border-orange-600/30' 
            : 'bg-orange-100 text-orange-800 border border-orange-200'
        }`}>
          Under Construction aktiv
        </div>
      )}

      {/* PIN Input Modal */}
      {showPinInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl p-6 max-w-sm w-full transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Admin-Code eingeben
            </h3>
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="PIN eingeben..."
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
                    setShowPinInput(false);
                    setPin('');
                  }}
                  className={`flex-1 py-2 px-4 rounded-xl transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' 
                      : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                  }`}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded-xl transition-colors"
                >
                  Bestätigen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};