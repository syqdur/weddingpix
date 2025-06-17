import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { subscribeSyncLogs } from '../../services/spotifyIntegration';

interface SyncLogsViewerProps {
  isDarkMode: boolean;
}

interface SyncLog {
  timestamp: number;
  action: 'add' | 'remove' | 'sync' | 'refresh_token';
  status: 'success' | 'failed';
  details: string;
  affectedItems: number;
  error?: string;
  executedBy?: string;
}

export const SyncLogsViewer: React.FC<SyncLogsViewerProps> = ({ isDarkMode }) => {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');

  // Subscribe to sync logs
  useEffect(() => {
    setIsLoading(true);
    
    const unsubscribe = subscribeSyncLogs((syncLogs) => {
      setLogs(syncLogs);
      setIsLoading(false);
    });
    
    return unsubscribe;
  }, []);

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.status === filter);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('de-DE');
  };

  const getActionLabel = (action: string): string => {
    switch (action) {
      case 'add': return 'Hinzufügen';
      case 'remove': return 'Entfernen';
      case 'sync': return 'Synchronisierung';
      case 'refresh_token': return 'Token-Erneuerung';
      default: return action;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'add':
        return <PlusCircle className="w-4 h-4" />;
      case 'remove':
        return <MinusCircle className="w-4 h-4" />;
      case 'sync':
        return <RefreshCw className="w-4 h-4" />;
      case 'refresh_token':
        return <Key className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-full transition-colors duration-300 ${
            isDarkMode ? 'bg-blue-600' : 'bg-blue-500'
          }`}>
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className={`text-xl font-semibold transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Synchronisierungs-Logs
            </h3>
            <p className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Protokoll aller Spotify-Synchronisierungen
            </p>
          </div>
        </div>
        
        {/* Filter */}
        <div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className={`px-3 py-2 border rounded-lg transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="all">Alle Logs</option>
            <option value="success">Nur Erfolge</option>
            <option value="failed">Nur Fehler</option>
          </select>
        </div>
      </div>

      {/* Logs List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center">
            <Loader className="w-8 h-8 animate-spin text-blue-500 mb-4" />
            <p className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Lade Synchronisierungs-Logs...
            </p>
          </div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className={`p-12 text-center rounded-xl border transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
        }`}>
          <Clock className={`w-12 h-12 mx-auto mb-4 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-600' : 'text-gray-400'
          }`} />
          <h4 className={`text-lg font-medium mb-2 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Keine Logs gefunden
          </h4>
          <p className={`text-sm transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {filter !== 'all'
              ? `Es wurden keine Logs mit dem Status "${filter === 'success' ? 'Erfolg' : 'Fehler'}" gefunden`
              : 'Es wurden noch keine Synchronisierungen durchgeführt'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border transition-colors duration-300 ${
                log.status === 'success'
                  ? isDarkMode ? 'bg-green-900/10 border-green-700/30' : 'bg-green-50 border-green-200'
                  : isDarkMode ? 'bg-red-900/10 border-red-700/30' : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full transition-colors duration-300 ${
                  log.status === 'success'
                    ? isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'
                    : isDarkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-600'
                }`}>
                  {log.status === 'success' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {getActionLabel(log.action)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        log.status === 'success'
                          ? isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
                          : isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
                      }`}>
                        {log.status === 'success' ? 'Erfolg' : 'Fehler'}
                      </span>
                    </div>
                    <span className={`text-xs transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {formatDate(log.timestamp)}
                    </span>
                  </div>
                  
                  <p className={`text-sm mb-2 transition-colors duration-300 ${
                    log.status === 'success'
                      ? isDarkMode ? 'text-green-200' : 'text-green-700'
                      : isDarkMode ? 'text-red-200' : 'text-red-700'
                  }`}>
                    {log.details}
                    {log.affectedItems > 0 && (
                      <span className="ml-1">
                        ({log.affectedItems} {log.affectedItems === 1 ? 'Element' : 'Elemente'})
                      </span>
                    )}
                  </p>
                  
                  {log.error && (
                    <div className={`p-2 rounded-lg text-xs transition-colors duration-300 ${
                      isDarkMode ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-700'
                    }`}>
                      <div className="font-medium mb-1">Fehlerdetails:</div>
                      <div className="font-mono break-all">{log.error}</div>
                    </div>
                  )}
                  
                  {log.executedBy && (
                    <div className={`text-xs mt-2 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Ausgeführt von: {log.executedBy}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Helper components
const PlusCircle: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const MinusCircle: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const Key: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

const Info: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);