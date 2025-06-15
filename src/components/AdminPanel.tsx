import React, { useState } from 'react';
import { Lock, Unlock } from 'lucide-react';

interface AdminPanelProps {
  isAdmin: boolean;
  onToggleAdmin: (isAdmin: boolean) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
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

  return (
    <>
      <button
        onClick={handleAdminToggle}
        className="fixed bottom-4 left-4 bg-gray-200 hover:bg-gray-300 text-gray-600 p-3 rounded-full shadow-lg transition-colors"
        title={isAdmin ? "Admin-Modus verlassen" : "Admin-Modus"}
      >
        {isAdmin ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
      </button>

      {showPinInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Admin-Code eingeben</h3>
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="PIN eingeben..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPinInput(false);
                    setPin('');
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-xl transition-colors"
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