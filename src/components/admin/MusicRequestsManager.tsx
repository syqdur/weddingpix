import React, { useState, useEffect } from 'react';
import { 
  Music, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Trash2, 
  Loader,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Heart,
  ExternalLink,
  Users,
  MessageSquare
} from 'lucide-react';
import { 
  subscribeMusicRequests, 
  updateMusicRequestStatus,
  bulkUpdateMusicRequestStatus,
  deleteMusicRequest,
  bulkDeleteMusicRequests
} from '../../services/spotifyIntegration';
import { MusicRequest } from '../../types';

interface MusicRequestsManagerProps {
  isDarkMode: boolean;
  adminName: string;
}

type SortField = 'requestedAt' | 'votes' | 'songTitle' | 'artist' | 'requestedBy';
type SortDirection = 'asc' | 'desc';
type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

export const MusicRequestsManager: React.FC<MusicRequestsManagerProps> = ({ 
  isDarkMode,
  adminName
}) => {
  const [requests, setRequests] = useState<MusicRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<MusicRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortField, setSortField] = useState<SortField>('votes');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());

  // Subscribe to music requests
  useEffect(() => {
    setIsLoading(true);
    
    const unsubscribe = subscribeMusicRequests((allRequests) => {
      setRequests(allRequests);
      setIsLoading(false);
    });
    
    return unsubscribe;
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...requests];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(request => 
        request.songTitle.toLowerCase().includes(query) ||
        request.artist.toLowerCase().includes(query) ||
        request.requestedBy.toLowerCase().includes(query) ||
        (request.message && request.message.toLowerCase().includes(query))
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'requestedAt':
          comparison = a.requestedAt - b.requestedAt;
          break;
        case 'votes':
          comparison = a.votes - b.votes;
          break;
        case 'songTitle':
          comparison = a.songTitle.localeCompare(b.songTitle);
          break;
        case 'artist':
          comparison = a.artist.localeCompare(b.artist);
          break;
        case 'requestedBy':
          comparison = a.requestedBy.localeCompare(b.requestedBy);
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    setFilteredRequests(filtered);
  }, [requests, statusFilter, searchQuery, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleStatusChange = async (requestId: string, status: 'pending' | 'approved' | 'rejected') => {
    setIsProcessing(true);
    setError(null);
    setSuccess(null);
    
    try {
      await updateMusicRequestStatus(requestId, status, adminName);
      
      setSuccess(`Status erfolgreich auf "${getStatusLabel(status)}" geändert`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Fehler beim Ändern des Status');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (requestId: string) => {
    if (!window.confirm('Möchtest du diesen Musikwunsch wirklich löschen?')) {
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setSuccess(null);
    
    try {
      await deleteMusicRequest(requestId, adminName);
      
      setSuccess('Musikwunsch erfolgreich gelöscht');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error deleting request:', error);
      setError('Fehler beim Löschen des Musikwunsches');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject' | 'delete') => {
    if (selectedRequests.size === 0) {
      setError('Keine Musikwünsche ausgewählt');
      return;
    }
    
    const requestIds = Array.from(selectedRequests);
    
    if (action === 'delete' && !window.confirm(`Möchtest du ${requestIds.length} Musikwünsche wirklich löschen?`)) {
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (action === 'approve' || action === 'reject') {
        const status = action === 'approve' ? 'approved' : 'rejected';
        const result = await bulkUpdateMusicRequestStatus(requestIds, status, adminName);
        
        setSuccess(`${result.success} Musikwünsche erfolgreich auf "${getStatusLabel(status)}" gesetzt`);
        if (result.failed > 0) {
          setError(`${result.failed} Musikwünsche konnten nicht aktualisiert werden`);
        }
      } else if (action === 'delete') {
        const result = await bulkDeleteMusicRequests(requestIds, adminName);
        
        setSuccess(`${result.success} Musikwünsche erfolgreich gelöscht`);
        if (result.failed > 0) {
          setError(`${result.failed} Musikwünsche konnten nicht gelöscht werden`);
        }
      }
      
      // Clear selection
      setSelectedRequests(new Set());
      setShowBulkActions(false);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error performing bulk action:', error);
      setError('Fehler bei der Massenbearbeitung');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleRequestSelection = (requestId: string) => {
    const newSelection = new Set(selectedRequests);
    
    if (newSelection.has(requestId)) {
      newSelection.delete(requestId);
    } else {
      newSelection.add(requestId);
    }
    
    setSelectedRequests(newSelection);
  };

  const toggleAllRequests = () => {
    if (selectedRequests.size === filteredRequests.length) {
      // Deselect all
      setSelectedRequests(new Set());
    } else {
      // Select all
      setSelectedRequests(new Set(filteredRequests.map(r => r.id)));
    }
  };

  const toggleRequestExpanded = (requestId: string) => {
    const newExpanded = new Set(expandedRequests);
    
    if (newExpanded.has(requestId)) {
      newExpanded.delete(requestId);
    } else {
      newExpanded.add(requestId);
    }
    
    setExpandedRequests(newExpanded);
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'pending': return 'Ausstehend';
      case 'approved': return 'Genehmigt';
      case 'rejected': return 'Abgelehnt';
      default: return status;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return isDarkMode ? 'bg-yellow-600/20 text-yellow-300' : 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return isDarkMode ? 'bg-green-600/20 text-green-300' : 'bg-green-100 text-green-800';
      case 'rejected':
        return isDarkMode ? 'bg-red-600/20 text-red-300' : 'bg-red-100 text-red-800';
      default:
        return isDarkMode ? 'bg-gray-600/20 text-gray-300' : 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('de-DE');
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-full transition-colors duration-300 ${
            isDarkMode ? 'bg-purple-600' : 'bg-purple-500'
          }`}>
            <Music className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className={`text-xl font-semibold transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Musikwünsche verwalten
            </h3>
            <p className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {filteredRequests.length} Musikwünsche gefunden
            </p>
          </div>
        </div>
        
        {/* Bulk Action Toggle */}
        <button
          onClick={() => setShowBulkActions(!showBulkActions)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isDarkMode
              ? showBulkActions 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              : showBulkActions 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          <MoreHorizontal className="w-4 h-4" />
          <span>{showBulkActions ? 'Massenbearbeitung aktiv' : 'Massenbearbeitung'}</span>
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className={`p-4 rounded-xl border transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-red-900/20 border-red-700/30 text-red-300' 
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}
      
      {success && (
        <div className={`p-4 rounded-xl border transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-green-900/20 border-green-700/30 text-green-300' 
            : 'bg-green-50 border-green-200 text-green-700'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span>{success}</span>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className={`p-4 rounded-xl border transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
        }`}>
          <div className="flex flex-wrap items-center gap-3">
            <div className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <input
                type="checkbox"
                checked={selectedRequests.size === filteredRequests.length && filteredRequests.length > 0}
                onChange={toggleAllRequests}
                className="mr-2"
              />
              <span>{selectedRequests.size} von {filteredRequests.length} ausgewählt</span>
            </div>
            
            <div className="flex-1"></div>
            
            <button
              onClick={() => handleBulkAction('approve')}
              disabled={isProcessing || selectedRequests.size === 0}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                isProcessing || selectedRequests.size === 0
                  ? 'cursor-not-allowed opacity-50'
                  : isDarkMode
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>Genehmigen</span>
            </button>
            
            <button
              onClick={() => handleBulkAction('reject')}
              disabled={isProcessing || selectedRequests.size === 0}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                isProcessing || selectedRequests.size === 0
                  ? 'cursor-not-allowed opacity-50'
                  : isDarkMode
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    : 'bg-yellow-500 hover:bg-yellow-600 text-white'
              }`}
            >
              <XCircle className="w-4 h-4" />
              <span>Ablehnen</span>
            </button>
            
            <button
              onClick={() => handleBulkAction('delete')}
              disabled={isProcessing || selectedRequests.size === 0}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                isProcessing || selectedRequests.size === 0
                  ? 'cursor-not-allowed opacity-50'
                  : isDarkMode
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Löschen</span>
            </button>
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className={`p-4 rounded-xl border transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
      }`}>
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Suche nach Titel, Künstler oder Benutzer..."
              className={`w-full pl-9 pr-3 py-2 border rounded-lg transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
          
          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className={`px-3 py-2 border rounded-lg transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">Alle Status</option>
              <option value="pending">Ausstehend</option>
              <option value="approved">Genehmigt</option>
              <option value="rejected">Abgelehnt</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center">
            <Loader className="w-8 h-8 animate-spin text-purple-500 mb-4" />
            <p className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Lade Musikwünsche...
            </p>
          </div>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className={`p-12 text-center rounded-xl border transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
        }`}>
          <Music className={`w-12 h-12 mx-auto mb-4 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-600' : 'text-gray-400'
          }`} />
          <h4 className={`text-lg font-medium mb-2 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Keine Musikwünsche gefunden
          </h4>
          <p className={`text-sm transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {searchQuery || statusFilter !== 'all'
              ? 'Versuche, deine Suchkriterien zu ändern'
              : 'Es wurden noch keine Musikwünsche eingereicht'}
          </p>
        </div>
      ) : (
        <div className={`rounded-xl border overflow-hidden transition-colors duration-300 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <table className="w-full">
            <thead className={`transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <tr>
                {showBulkActions && (
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRequests.size === filteredRequests.length && filteredRequests.length > 0}
                      onChange={toggleAllRequests}
                    />
                  </th>
                )}
                <th 
                  className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}
                  onClick={() => handleSort('songTitle')}
                >
                  <div className="flex items-center gap-1">
                    <span>Song</span>
                    {sortField === 'songTitle' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}
                  onClick={() => handleSort('artist')}
                >
                  <div className="flex items-center gap-1">
                    <span>Künstler</span>
                    {sortField === 'artist' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}
                  onClick={() => handleSort('requestedBy')}
                >
                  <div className="flex items-center gap-1">
                    <span>Von</span>
                    {sortField === 'requestedBy' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}
                  onClick={() => handleSort('votes')}
                >
                  <div className="flex items-center gap-1">
                    <span>Votes</span>
                    {sortField === 'votes' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}
                  onClick={() => handleSort('requestedAt')}
                >
                  <div className="flex items-center gap-1">
                    <span>Datum</span>
                    {sortField === 'requestedAt' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Status
                </th>
                <th className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y transition-colors duration-300 ${
              isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
            }`}>
              {filteredRequests.map((request) => (
                <React.Fragment key={request.id}>
                  <tr className={`transition-colors duration-300 ${
                    isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
                  }`}>
                    {showBulkActions && (
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedRequests.has(request.id)}
                          onChange={() => toggleRequestSelection(request.id)}
                        />
                      </td>
                    )}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-gray-200 flex-shrink-0 overflow-hidden">
                          {request.albumArt ? (
                            <img 
                              src={request.albumArt} 
                              alt={request.songTitle}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music className="w-4 h-4 text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className={`font-medium transition-colors duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {request.songTitle}
                          </div>
                          {request.duration && (
                            <div className={`text-xs transition-colors duration-300 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {formatDuration(request.duration)}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className={`transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {request.artist}
                      </div>
                      {request.album && (
                        <div className={`text-xs transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {request.album}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className={`transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {request.requestedBy}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <Heart className={`w-4 h-4 ${
                          isDarkMode ? 'text-pink-400' : 'text-pink-500'
                        }`} />
                        <span className={`font-medium transition-colors duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {request.votes}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {formatDate(request.requestedAt)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusLabel(request.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleRequestExpanded(request.id)}
                          className={`p-1 rounded transition-colors ${
                            isDarkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
                          }`}
                          title="Details anzeigen"
                        >
                          {expandedRequests.has(request.id) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                        
                        {request.status !== 'approved' && (
                          <button
                            onClick={() => handleStatusChange(request.id, 'approved')}
                            disabled={isProcessing}
                            className={`p-1 rounded transition-colors ${
                              isProcessing
                                ? 'cursor-not-allowed opacity-50'
                                : isDarkMode
                                  ? 'hover:bg-green-600/20 text-green-400'
                                  : 'hover:bg-green-100 text-green-600'
                            }`}
                            title="Genehmigen"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        
                        {request.status !== 'rejected' && (
                          <button
                            onClick={() => handleStatusChange(request.id, 'rejected')}
                            disabled={isProcessing}
                            className={`p-1 rounded transition-colors ${
                              isProcessing
                                ? 'cursor-not-allowed opacity-50'
                                : isDarkMode
                                  ? 'hover:bg-yellow-600/20 text-yellow-400'
                                  : 'hover:bg-yellow-100 text-yellow-600'
                            }`}
                            title="Ablehnen"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDelete(request.id)}
                          disabled={isProcessing}
                          className={`p-1 rounded transition-colors ${
                            isProcessing
                              ? 'cursor-not-allowed opacity-50'
                              : isDarkMode
                                ? 'hover:bg-red-600/20 text-red-400'
                                : 'hover:bg-red-100 text-red-600'
                          }`}
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        
                        {request.spotifyUrl && (
                          <a
                            href={request.spotifyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`p-1 rounded transition-colors ${
                              isDarkMode
                                ? 'hover:bg-green-600/20 text-green-400'
                                : 'hover:bg-green-100 text-green-600'
                            }`}
                            title="In Spotify öffnen"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expanded Details Row */}
                  {expandedRequests.has(request.id) && (
                    <tr className={`transition-colors duration-300 ${
                      isDarkMode ? 'bg-gray-700/30' : 'bg-gray-50'
                    }`}>
                      <td colSpan={showBulkActions ? 8 : 7} className="px-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Request Details */}
                          <div className={`p-3 rounded-lg transition-colors duration-300 ${
                            isDarkMode ? 'bg-gray-700/50' : 'bg-white'
                          }`}>
                            <h5 className={`font-medium mb-2 transition-colors duration-300 ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              Details
                            </h5>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Clock className={`w-4 h-4 ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`} />
                                <span className={`text-sm transition-colors duration-300 ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  Angefragt am {formatDate(request.requestedAt)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className={`w-4 h-4 ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`} />
                                <span className={`text-sm transition-colors duration-300 ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  {request.votes} Votes von {request.votedBy.length} Benutzern
                                </span>
                              </div>
                              {request.spotifyId && (
                                <div className="flex items-center gap-2">
                                  <Music className={`w-4 h-4 ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                  }`} />
                                  <span className={`text-sm transition-colors duration-300 ${
                                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                  }`}>
                                    Spotify ID: {request.spotifyId}
                                  </span>
                                </div>
                              )}
                              {request.popularity !== undefined && (
                                <div className="flex items-center gap-2">
                                  <Star className={`w-4 h-4 ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                  }`} />
                                  <span className={`text-sm transition-colors duration-300 ${
                                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                  }`}>
                                    Popularität: {request.popularity}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Message */}
                          <div className={`p-3 rounded-lg transition-colors duration-300 ${
                            isDarkMode ? 'bg-gray-700/50' : 'bg-white'
                          }`}>
                            <h5 className={`font-medium mb-2 transition-colors duration-300 ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              Nachricht
                            </h5>
                            {request.message ? (
                              <div className={`p-3 rounded-lg transition-colors duration-300 ${
                                isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
                              }`}>
                                <div className="flex items-start gap-2">
                                  <MessageSquare className={`w-4 h-4 mt-0.5 ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                  }`} />
                                  <p className={`text-sm transition-colors duration-300 ${
                                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                  }`}>
                                    {request.message}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className={`text-sm italic transition-colors duration-300 ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                Keine Nachricht hinterlassen
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Helper components
const Star: React.FC<{ className?: string }> = ({ className }) => (
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
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);