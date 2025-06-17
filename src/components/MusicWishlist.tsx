import React, { useState, useEffect } from 'react';
import { Music, Search, X, Plus, Trash2, ExternalLink, AlertCircle, RefreshCw, Clock, Heart, Play, Volume2 } from 'lucide-react';
import { 
  searchTracks, 
  addTrackToPlaylist, 
  removeTrackFromPlaylist,
  getSelectedPlaylist,
  getPlaylistTracks,
  isSpotifyConnected
} from '../services/spotifyService';
import { SpotifyTrack } from '../types';

interface MusicWishlistProps {
  isDarkMode: boolean;
}

export const MusicWishlist: React.FC<MusicWishlistProps> = ({ isDarkMode }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [playlistTracks, setPlaylistTracks] = useState<SpotifyApi.PlaylistTrackObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSpotifyAvailable, setIsSpotifyAvailable] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<{ id: string; name: string } | null>(null);
  const [isAddingTrack, setIsAddingTrack] = useState<string | null>(null);
  const [isRemovingTrack, setIsRemovingTrack] = useState<string | null>(null);
  const [showAddSuccess, setShowAddSuccess] = useState(false);

  // Check if Spotify is connected and load playlist tracks
  useEffect(() => {
    const checkSpotify = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Check if Spotify is connected
        const connected = await isSpotifyConnected();
        setIsSpotifyAvailable(connected);
        
        if (connected) {
          // Get selected playlist
          const playlist = await getSelectedPlaylist();
          setSelectedPlaylist(playlist);
          
          if (playlist) {
            // Load playlist tracks
            const tracks = await getPlaylistTracks(playlist.playlistId);
            setPlaylistTracks(tracks);
          }
        }
      } catch (error) {
        console.error('Failed to check Spotify:', error);
        setError('Failed to load Spotify data');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSpotify();
  }, []);

  // Search with debounce
  useEffect(() => {
    if (!searchQuery.trim() || !isSpotifyAvailable) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      setError(null);
      
      try {
        const results = await searchTracks(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setError('Failed to search tracks');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, isSpotifyAvailable]);

  // Add track to playlist
  const handleAddTrack = async (track: SpotifyTrack) => {
    if (isAddingTrack) return;
    
    setIsAddingTrack(track.id);
    setError(null);
    
    try {
      await addTrackToPlaylist(track.uri);
      
      // Show success message
      setShowAddSuccess(true);
      setTimeout(() => setShowAddSuccess(false), 3000);
      
      // Refresh playlist tracks
      if (selectedPlaylist) {
        const tracks = await getPlaylistTracks(selectedPlaylist.playlistId);
        setPlaylistTracks(tracks);
      }
      
      // Clear search
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Failed to add track:', error);
      setError('Failed to add track to playlist');
    } finally {
      setIsAddingTrack(null);
    }
  };

  // Remove track from playlist
  const handleRemoveTrack = async (track: SpotifyApi.PlaylistTrackObject) => {
    if (isRemovingTrack) return;
    
    if (!confirm(`Remove "${track.track.name}" from the playlist?`)) {
      return;
    }
    
    setIsRemovingTrack(track.track.id);
    setError(null);
    
    try {
      await removeTrackFromPlaylist(track.track.uri);
      
      // Refresh playlist tracks
      if (selectedPlaylist) {
        const tracks = await getPlaylistTracks(selectedPlaylist.playlistId);
        setPlaylistTracks(tracks);
      }
    } catch (error) {
      console.error('Failed to remove track:', error);
      setError('Failed to remove track from playlist');
    } finally {
      setIsRemovingTrack(null);
    }
  };

  // Refresh playlist tracks
  const handleRefresh = async () => {
    if (!selectedPlaylist) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const tracks = await getPlaylistTracks(selectedPlaylist.playlistId);
      setPlaylistTracks(tracks);
    } catch (error) {
      console.error('Failed to refresh tracks:', error);
      setError('Failed to refresh playlist tracks');
    } finally {
      setIsLoading(false);
    }
  };

  // Format duration
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (!isSpotifyAvailable) {
    return (
      <div className={`p-6 transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-6">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/8/84/Spotify_icon.svg"
              alt="Spotify Logo"
              className="w-full h-full"
            />
          </div>
          
          <h3 className={`text-xl font-bold mb-2 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Spotify nicht verbunden
          </h3>
          
          <p className={`text-sm mb-6 max-w-md mx-auto transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Ein Administrator muss zuerst ein Spotify-Konto verbinden und eine Playlist auswählen, bevor Musikwünsche möglich sind.
          </p>
        </div>
      </div>
    );
  }

  if (!selectedPlaylist) {
    return (
      <div className={`p-6 transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-6">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/8/84/Spotify_icon.svg"
              alt="Spotify Logo"
              className="w-full h-full"
            />
          </div>
          
          <h3 className={`text-xl font-bold mb-2 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Keine Playlist ausgewählt
          </h3>
          
          <p className={`text-sm mb-6 max-w-md mx-auto transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Ein Administrator muss zuerst eine Playlist auswählen, bevor Musikwünsche möglich sind.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Header with gradient */}
      <div className="bg-gradient-to-b from-[#1DB954] to-transparent pt-6 pb-12 px-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 shadow-lg rounded-md overflow-hidden">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/8/84/Spotify_icon.svg"
                alt="Spotify Logo"
                className="w-full h-full bg-[#1DB954] p-2"
              />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white opacity-90">Playlist</p>
              <h3 className="text-2xl font-bold text-white">
                {selectedPlaylist.name}
              </h3>
              <p className="text-sm text-white opacity-80 mt-1">
                {playlistTracks.length} Songs • Hochzeits-Playlist
              </p>
            </div>
          </div>
          <a
            href={`https://open.spotify.com/playlist/${selectedPlaylist.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full bg-[#1DB954] text-white hover:bg-opacity-80 transition-colors"
            title="In Spotify öffnen"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>

        {/* Search Section */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Suche nach Songs oder Interpreten..."
            className="w-full pl-10 pr-10 py-3 bg-white bg-opacity-90 border border-gray-200 rounded-full text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1DB954] focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-200"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Success Message */}
      {showAddSuccess && (
        <div className="mx-6 mb-4 p-3 bg-[#1DB954] bg-opacity-20 border border-[#1DB954] border-opacity-30 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-full bg-[#1DB954]">
              <Check className="w-4 h-4 text-white" />
            </div>
            <p className="text-sm font-medium text-[#1DB954]">
              Song erfolgreich zur Playlist hinzugefügt!
            </p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mx-6 mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-600">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="px-6 -mt-6">
        {/* Search Results */}
        {isSearching ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="mb-8">
            <h4 className="text-gray-800 text-lg font-bold mb-4">
              Suchergebnisse
            </h4>
            <div className="space-y-2">
              {searchResults.map((track) => (
                <div
                  key={track.id}
                  className="p-3 rounded-md bg-white shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-3"
                >
                  <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                    {track.album?.images?.[0] ? (
                      <img 
                        src={track.album.images[0].url} 
                        alt={track.album.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium truncate text-gray-800">
                      {track.name}
                    </h5>
                    <p className="text-xs truncate text-gray-500">
                      {track.artists.map(a => a.name).join(', ')}
                      {track.album && ` • ${track.album.name}`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAddTrack(track)}
                    disabled={isAddingTrack === track.id}
                    className="p-2 rounded-full bg-[#1DB954] text-white hover:bg-opacity-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Zur Playlist hinzufügen"
                  >
                    {isAddingTrack === track.id ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : searchQuery ? (
          <div className="text-center py-8">
            <Music className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600">
              Keine Ergebnisse für "{searchQuery}" gefunden
            </p>
          </div>
        ) : null}

        {/* Playlist Tracks */}
        <div className="pb-8">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-gray-800 text-lg font-bold">
              Playlist Songs
            </h4>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Playlist aktualisieren"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-gray-700 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <RefreshCw className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-[16px_1fr_auto_auto] gap-4 px-4 py-2 border-b border-gray-200 text-xs font-medium uppercase text-gray-500">
            <div>#</div>
            <div>Titel</div>
            <div>Hinzugefügt am</div>
            <div className="flex justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : playlistTracks.length > 0 ? (
            <div className="space-y-1 mt-2">
              {playlistTracks.map((item, index) => (
                <div
                  key={`${item.track.id}-${item.added_at}`}
                  className="grid grid-cols-[16px_1fr_auto_auto] gap-4 px-4 py-2 rounded-md hover:bg-gray-100 transition-all duration-200 items-center group"
                >
                  <div className="text-gray-500 text-sm">{index + 1}</div>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                      {item.track.album?.images?.[0] ? (
                        <img 
                          src={item.track.album.images[0].url} 
                          alt={item.track.album.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-medium truncate text-gray-800">
                        {item.track.name}
                      </h5>
                      <p className="text-xs truncate text-gray-500">
                        {item.track.artists.map(a => a.name).join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(item.added_at)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {formatDuration(item.track.duration_ms)}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleRemoveTrack(item)}
                        disabled={isRemovingTrack === item.track.id}
                        className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                        title="Aus Playlist entfernen"
                      >
                        {isRemovingTrack === item.track.id ? (
                          <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                      <a
                        href={item.track.external_urls.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                        title="In Spotify öffnen"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm mt-4">
              <Music className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600 font-medium">
                Keine Songs in der Playlist
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Suche nach Songs und füge sie zur Playlist hinzu
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};