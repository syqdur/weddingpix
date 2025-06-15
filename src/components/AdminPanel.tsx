import React, { useState } from 'react';
import { Lock, Unlock, Settings } from 'lucide-react';

interface AdminPanelProps {
  isDarkMode: boolean;
  isAdmin: boolean;
  onToggleAdmin: (isAdmin: boolean) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  isDarkMode, 
  isAdmin, 
  onToggleAdmin 
}) => {
  const [showPinInput, setShowPinInput] = useState(false);
  const [pin, setPin] = useState('');

  const correctPIN = "2407";

  const handleAdminToggle = () => {
    if (isAdmin) {
      onToggleAdmin(false);
    } else {
      setShowPinInput(true);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === correctPIN) {
      onToggleAdmin(true);
      setShowPinInput(false);
      setPin('');
    } else {
      alert('Falscher Code!');
      setPin('');
    }
  };

  const toggleUnderConstruction = () => {
    const currentStatus = localStorage.getItem('wedding_under_construction');
    const newStatus = currentStatus === 'false' ? 'true' : 'false';
    localStorage.setItem('wedding_under_construction', newStatus);
    
    if (newStatus === 'true') {
      alert('Under Construction aktiviert! Die Seite wird neu geladen.');
    } else {
      alert('Under Construction deaktiviert! Die Seite wird neu geladen.');
    }
    
    window.location.reload();
  };

  const isUnderConstructionActive = () => {
    const status = localStorage.getItem('wedding_under_construction');
    return status !== 'false';
  };

  return (
    <>
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

      {/* Admin Controls */}
      {isAdmin && (
        <div className="fixed bottom-20 left-4 space-y-2">
          <button
            onClick={toggleUnderConstruction}
            className={`p-3 rounded-full shadow-lg transition-colors duration-300 ${
              isUnderConstructionActive()
                ? isDarkMode
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
                : isDarkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
            title={isUnderConstructionActive() ? "Under Construction deaktivieren" : "Under Construction aktivieren"}
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      )}

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