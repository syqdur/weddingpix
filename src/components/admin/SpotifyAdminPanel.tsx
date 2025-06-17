import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { SpotifyAuthSetup } from './SpotifyAuthSetup';
import { SpotifyConfigPanel } from './SpotifyConfigPanel';
import { MusicRequestsManager } from './MusicRequestsManager';
import { SyncLogsViewer } from './SyncLogsViewer';

interface SpotifyAdminPanelProps {
  isDarkMode: boolean;
  adminName: string;
}

export const SpotifyAdminPanel: React.FC<SpotifyAdminPanelProps> = ({ 
  isDarkMode,
  adminName
}) => {
  const [activeTab, setActiveTab] = useState('auth');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setActiveTab('config');
  };

  return (
    <div className="space-y-6">
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className={`w-full grid grid-cols-4 transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
        }`}>
          <TabsTrigger 
            value="auth"
            className={`py-3 transition-colors duration-300 ${
              activeTab === 'auth'
                ? isDarkMode 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-white text-gray-900 shadow-sm'
                : isDarkMode
                  ? 'text-gray-300 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Authentifizierung
          </TabsTrigger>
          <TabsTrigger 
            value="config"
            className={`py-3 transition-colors duration-300 ${
              activeTab === 'config'
                ? isDarkMode 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-white text-gray-900 shadow-sm'
                : isDarkMode
                  ? 'text-gray-300 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Konfiguration
          </TabsTrigger>
          <TabsTrigger 
            value="requests"
            className={`py-3 transition-colors duration-300 ${
              activeTab === 'requests'
                ? isDarkMode 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-white text-gray-900 shadow-sm'
                : isDarkMode
                  ? 'text-gray-300 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Musikwünsche
          </TabsTrigger>
          <TabsTrigger 
            value="logs"
            className={`py-3 transition-colors duration-300 ${
              activeTab === 'logs'
                ? isDarkMode 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-white text-gray-900 shadow-sm'
                : isDarkMode
                  ? 'text-gray-300 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Logs
          </TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="auth">
            <SpotifyAuthSetup 
              isDarkMode={isDarkMode} 
              onAuthSuccess={handleAuthSuccess}
            />
          </TabsContent>
          
          <TabsContent value="config">
            <SpotifyConfigPanel 
              isDarkMode={isDarkMode}
              adminName={adminName}
            />
          </TabsContent>
          
          <TabsContent value="requests">
            <MusicRequestsManager 
              isDarkMode={isDarkMode}
              adminName={adminName}
            />
          </TabsContent>
          
          <TabsContent value="logs">
            <SyncLogsViewer 
              isDarkMode={isDarkMode}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};