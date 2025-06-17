import React, { useState, useEffect } from 'react';
import { Music, Search, X, Plus, Trash2, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react';
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

  if (!isSpotifyAvailable) {
    return (
      <div className={`p-6 rounded-xl border transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
      }`}>
        <div className="text-center py-8">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-colors duration-300 ${
            isDarkMode ? 'bg-yellow-600' : 'bg-yellow-500'
          }`}>
            <Music className="w-8 h-8 text-white" />
          </div>
          
          <h3 className={`text-xl font-semibold mb-2 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Spotify Not Connected
          </h3>
          
          <p className={`text-sm mb-6 max-w-md mx-auto transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            An admin needs to connect a Spotify account and select a playlist before music requests can be made.
          </p>
        </div>
      </div>
    );
  }

  if (!selectedPlaylist) {
    return (
      <div className={`p-6 rounded-xl border transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
      }`}>
        <div className="text-center py-8">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-colors duration-300 ${
            isDarkMode ? 'bg-yellow-600' : 'bg-yellow-500'
          }`}>
            <Music className="w-8 h-8 text-white" />
          </div>
          
          <h3 className={`text-xl font-semibold mb-2 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            No Playlist Selected
          </h3>
          
          <p className={`text-sm mb-6 max-w-md mx-auto transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            An admin needs to select a playlist before music requests can be made.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-xl border transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-full transition-colors duration-300 ${
            isDarkMode ? 'bg-green-600' : 'bg-green-500'
          }`}>
            <Music className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className={`text-xl font-semibold transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Music Wishlist
            </h3>
            <p className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Add songs to the "{selectedPlaylist.name}" playlist
            </p>
          </div>
        </div>
        <a
          href={`https://open.spotify.com/playlist/${selectedPlaylist.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`p-2 rounded-lg transition-colors duration-300 ${
            isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
          } text-white`}
          title="Open in Spotify"
        >
          <ExternalLink className="w-5 h-5" />
        </a>
      </div>

      {/* Error Display */}
      {error && (
        <div className={`mb-6 p-4 rounded-xl border transition-colors duration-300 ${
          isDarkMode ? 'bg-red-900/20 border-red-700/30' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            <AlertCircle className={`w-5 h-5 transition-colors duration-300 ${
              isDarkMode ? 'text-red-400' : 'text-red-600'
            }`} />
            <p className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-red-300' : 'text-red-700'
            }`}>
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Search Section */}
      <div className="mb-6">
        <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          🔍 Search for songs
        </label>
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or artist..."
            className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors duration-300 ${
                isDarkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {isSearching && (
          <div className="mt-2 flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <span className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Searching...
            </span>
          </div>
        )}
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="mb-6">
          <h4 className={`font-semibold mb-3 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Search Results
          </h4>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {searchResults.map((track) => (
              <div
                key={track.id}
                className={`p-3 rounded-lg border transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-300 flex-shrink-0">
                    {track.album?.images?.[0] ? (
                      <img 
                        src={track.album.images[0].url} 
                        alt={track.album.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-5 h-5 text-gray-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className={`font-medium truncate transition-colors duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {track.name}
                    </h5>
                    <p className={`text-xs truncate transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {track.artists.map(a => a.name).join(', ')}
                      {track.album && ` • ${track.album.name}`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAddTrack(track)}
                    disabled={isAddingTrack === track.id}
                    className={`p-2 rounded-lg transition-colors duration-300 ${
                      isAddingTrack === track.id
                        ? 'cursor-not-allowed opacity-50'
                        : ''
                    } ${
                      isDarkMode 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                    title="Add to playlist"
                  >
                    {isAddingTrack === track.id ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Playlist Tracks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className={`font-semibold transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Current Playlist
          </h4>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className={`p-2 rounded-lg transition-colors duration-300 ${
              isLoading
                ? 'cursor-not-allowed opacity-50'
                : ''
            } ${
              isDarkMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
            title="Refresh playlist"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <RefreshCw className="w-5 h-5" />
            )}
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : playlistTracks.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {playlistTracks.map((item) => (
              <div
                key={`${item.track.id}-${item.added_at}`}
                className={`p-3 rounded-lg border transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-300 flex-shrink-0">
                    {item.track.album?.images?.[0] ? (
                      <img 
                        src={item.track.album.images[0].url} 
                        alt={item.track.album.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-5 h-5 text-gray-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className={`font-medium truncate transition-colors duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {item.track.name}
                    </h5>
                    <p className={`text-xs truncate transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {item.track.artists.map(a => a.name).join(', ')}
                      {item.track.album && ` • ${item.track.album.name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={item.track.external_urls.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-2 rounded-lg transition-colors duration-300 ${
                        isDarkMode
                          ? 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      }`}
                      title="Open in Spotify"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleRemoveTrack(item)}
                      disabled={isRemovingTrack === item.track.id}
                      className={`p-2 rounded-lg transition-colors duration-300 ${
                        isRemovingTrack === item.track.id
                          ? 'cursor-not-allowed opacity-50'
                          : ''
                      } ${
                        isDarkMode 
                          ? 'bg-red-600 hover:bg-red-700 text-white' 
                          : 'bg-red-500 hover:bg-red-600 text-white'
                      }`}
                      title="Remove from playlist"
                    >
                      {isRemovingTrack === item.track.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`p-8 text-center rounded-lg border transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 border-gray-200'
          }`}>
            <Music className={`w-12 h-12 mx-auto mb-3 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`} />
            <p className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              No tracks in playlist
            </p>
          </div>
        )}
      </div>
    </div>
  );
};