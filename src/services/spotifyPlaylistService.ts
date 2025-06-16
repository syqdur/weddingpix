import { MusicRequest } from '../types';

// Spotify API Configuration
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';

// Token Storage Keys
const SPOTIFY_ACCESS_TOKEN_KEY = 'spotify_access_token';
const SPOTIFY_REFRESH_TOKEN_KEY = 'spotify_refresh_token';
const SPOTIFY_TOKEN_EXPIRY_KEY = 'spotify_token_expiry';
const SPOTIFY_USER_INFO_KEY = 'spotify_user_info';
const SELECTED_PLAYLIST_KEY = 'selected_wedding_playlist'; // 🎯 NEW: Persistent playlist selection

// Wedding Playlist ID (Kristin & Maurizio) - Default fallback
const WEDDING_PLAYLIST_ID = '5IkTeF1ydIrwQ4VZxkCtdO';

// User Info Interface
interface SpotifyUserInfo {
  id: string;
  display_name: string;
  email?: string;
  images?: Array<{ url: string }>;
}

// 🎯 NEW: Selected Playlist Interface
interface SelectedPlaylist {
  id: string;
  name: string;
  images?: Array<{ url: string }>;
  tracks: { total: number };
  selectedAt: string;
  isLocked: boolean; // Once selected, cannot be changed
}

// Playlist Export Interface
export interface PlaylistExport {
  name: string;
  description: string;
  tracks: Array<{
    name: string;
    artist: string;
    album: string;
    duration: number;
    spotifyUrl: string;
  }>;
  createdAt: string;
  totalTracks: number;
}

// 🔧 FIXED: Automatische Redirect URI Erkennung
const getRedirectUri = (): string => {
  const currentOrigin = window.location.origin;
  
  if (currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')) {
    return 'https://kristinundmauro.netlify.app/';
  } else if (currentOrigin.includes('netlify.app')) {
    return `${currentOrigin}/`;
  } else if (currentOrigin.includes('kristinundmauro.de')) {
    return 'https://kristinundmauro.de/';
  } else {
    return 'https://kristinundmauro.netlify.app/';
  }
};

// 🎯 PERSISTENT PLAYLIST SELECTION
export const getSelectedPlaylist = (): SelectedPlaylist | null => {
  const stored = localStorage.getItem(SELECTED_PLAYLIST_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const setSelectedPlaylist = (playlist: any): void => {
  const selectedPlaylist: SelectedPlaylist = {
    id: playlist.id,
    name: playlist.name,
    images: playlist.images,
    tracks: playlist.tracks,
    selectedAt: new Date().toISOString(),
    isLocked: true // 🔒 Once selected, it's locked
  };
  
  localStorage.setItem(SELECTED_PLAYLIST_KEY, JSON.stringify(selectedPlaylist));
  console.log(`🎯 Playlist permanently selected: ${playlist.name}`);
};

export const isPlaylistLocked = (): boolean => {
  const selected = getSelectedPlaylist();
  return selected?.isLocked || false;
};

export const getActivePlaylistId = (): string => {
  const selected = getSelectedPlaylist();
  return selected?.id || WEDDING_PLAYLIST_ID;
};

// 🔑 TOKEN MANAGEMENT
const getStoredAccessToken = (): string | null => {
  const token = localStorage.getItem(SPOTIFY_ACCESS_TOKEN_KEY);
  const expiry = localStorage.getItem(SPOTIFY_TOKEN_EXPIRY_KEY);
  
  if (!token || !expiry) return null;
  
  const expiryTime = parseInt(expiry);
  const now = Date.now();
  
  if (now >= expiryTime) {
    console.log('🔑 Stored token expired, clearing...');
    clearStoredTokens();
    return null;
  }
  
  console.log('🔑 Using stored valid token');
  return token;
};

const storeTokens = (accessToken: string, expiresIn: number, refreshToken?: string) => {
  const expiryTime = Date.now() + (expiresIn * 1000) - 60000; // 1 minute buffer
  
  localStorage.setItem(SPOTIFY_ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(SPOTIFY_TOKEN_EXPIRY_KEY, expiryTime.toString());
  
  if (refreshToken) {
    localStorage.setItem(SPOTIFY_REFRESH_TOKEN_KEY, refreshToken);
  }
  
  console.log(`🔑 Tokens stored, expires in ${Math.floor(expiresIn / 60)} minutes`);
};

const clearStoredTokens = () => {
  localStorage.removeItem(SPOTIFY_ACCESS_TOKEN_KEY);
  localStorage.removeItem(SPOTIFY_REFRESH_TOKEN_KEY);
  localStorage.removeItem(SPOTIFY_TOKEN_EXPIRY_KEY);
  localStorage.removeItem(SPOTIFY_USER_INFO_KEY);
  // 🎯 DON'T clear selected playlist - it should persist even after logout
  console.log('🔑 All tokens cleared (playlist selection preserved)');
};

// 👤 USER INFO MANAGEMENT
const getStoredUserInfo = (): SpotifyUserInfo | null => {
  const userInfo = localStorage.getItem(SPOTIFY_USER_INFO_KEY);
  return userInfo ? JSON.parse(userInfo) : null;
};

const storeUserInfo = (userInfo: SpotifyUserInfo) => {
  localStorage.setItem(SPOTIFY_USER_INFO_KEY, JSON.stringify(userInfo));
  console.log(`👤 User info stored: ${userInfo.display_name}`);
};

// 🔍 CHECK AUTHENTICATION STATUS
export const isSpotifyAuthenticated = (): boolean => {
  const token = getStoredAccessToken();
  const userInfo = getStoredUserInfo();
  
  const isAuthenticated = !!(token && userInfo);
  console.log(`🔍 Spotify auth status: ${isAuthenticated ? 'AUTHENTICATED' : 'NOT_AUTHENTICATED'}`);
  
  return isAuthenticated;
};

// 👤 GET CURRENT USER INFO
export const getCurrentSpotifyUser = (): SpotifyUserInfo | null => {
  return getStoredUserInfo();
};

// 🔗 GENERATE AUTH URL
export const generateAdminSpotifyAuthUrl = (): string => {
  const redirectUri = getRedirectUri();
  
  console.log(`🔗 === GENERATING SPOTIFY AUTH URL ===`);
  console.log(`🔑 Client ID: ${SPOTIFY_CLIENT_ID}`);
  console.log(`🔄 Redirect URI: ${redirectUri}`);
  
  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code', // Use authorization code flow for refresh tokens
    redirect_uri: redirectUri,
    scope: [
      'playlist-modify-public',
      'playlist-modify-private',
      'playlist-read-private',
      'playlist-read-collaborative',
      'user-read-private',
      'user-read-email'
    ].join(' '),
    show_dialog: 'true'
  });

  const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
  console.log(`🔗 Generated auth URL: ${authUrl}`);
  
  return authUrl;
};

// 🚀 INITIATE SPOTIFY SETUP
export const initiateAdminSpotifySetup = () => {
  console.log('🚀 Starting Spotify admin setup...');
  
  if (isSpotifyAuthenticated()) {
    const user = getCurrentSpotifyUser();
    console.log(`✅ Already authenticated as: ${user?.display_name}`);
    return;
  }
  
  const authUrl = generateAdminSpotifyAuthUrl();
  window.location.href = authUrl;
};

// 🔄 HANDLE AUTH CALLBACK
export const handleSpotifyCallback = async (): Promise<boolean> => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const error = urlParams.get('error');
  
  if (error) {
    console.error(`❌ Spotify auth error: ${error}`);
    return false;
  }
  
  if (!code) {
    console.log('🔍 No auth code found in URL');
    return false;
  }
  
  console.log('🔄 Processing Spotify auth callback...');
  
  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: getRedirectUri(),
        client_id: SPOTIFY_CLIENT_ID,
        client_secret: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET || '',
      }),
    });
    
    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }
    
    const tokenData = await tokenResponse.json();
    
    // Store tokens
    storeTokens(tokenData.access_token, tokenData.expires_in, tokenData.refresh_token);
    
    // Get user info
    const userResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      storeUserInfo(userData);
    }
    
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
    console.log('✅ Spotify authentication successful!');
    return true;
    
  } catch (error) {
    console.error('❌ Spotify callback error:', error);
    clearStoredTokens();
    return false;
  }
};

// 🔄 REFRESH TOKEN
const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem(SPOTIFY_REFRESH_TOKEN_KEY);
  
  if (!refreshToken) {
    console.log('🔄 No refresh token available');
    return null;
  }
  
  try {
    console.log('🔄 Refreshing access token...');
    
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: SPOTIFY_CLIENT_ID,
        client_secret: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET || '',
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }
    
    const data = await response.json();
    storeTokens(data.access_token, data.expires_in, data.refresh_token || refreshToken);
    
    console.log('✅ Token refreshed successfully');
    return data.access_token;
    
  } catch (error) {
    console.error('❌ Token refresh failed:', error);
    clearStoredTokens();
    return null;
  }
};

// 🔑 GET VALID ACCESS TOKEN
const getValidAccessToken = async (): Promise<string | null> => {
  let token = getStoredAccessToken();
  
  if (!token) {
    console.log('🔄 No valid token, trying to refresh...');
    token = await refreshAccessToken();
  }
  
  return token;
};

// 🎵 GET USER PLAYLISTS
export const getUserPlaylists = async () => {
  const token = await getValidAccessToken();
  
  if (!token) {
    throw new Error('Nicht bei Spotify angemeldet');
  }
  
  try {
    console.log('🎵 Getting user playlists...');
    
    const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get playlists: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ Loaded ${data.items.length} user playlists`);
    
    // Filter out playlists the user can't modify
    const modifiablePlaylists = data.items.filter((playlist: any) => 
      playlist.owner.id === getCurrentSpotifyUser()?.id || playlist.collaborative
    );
    
    console.log(`✅ ${modifiablePlaylists.length} modifiable playlists found`);
    
    return modifiablePlaylists;
    
  } catch (error) {
    console.error('❌ Error getting user playlists:', error);
    throw error;
  }
};

// 🎵 GET WEDDING PLAYLIST DETAILS
export const getWeddingPlaylistDetails = async () => {
  const token = await getValidAccessToken();
  
  if (!token) {
    throw new Error('Nicht bei Spotify angemeldet');
  }
  
  const playlistId = getActivePlaylistId();
  
  try {
    console.log(`🎵 Getting playlist details: ${playlistId}`);
    
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get playlist: ${response.status}`);
    }
    
    const playlist = await response.json();
    console.log(`✅ Playlist loaded: ${playlist.name} (${playlist.tracks.total} tracks)`);
    
    return playlist;
    
  } catch (error) {
    console.error('❌ Error getting playlist:', error);
    throw error;
  }
};

// 🎯 ADD SONGS TO WEDDING PLAYLIST
export const addToWeddingPlaylist = async (musicRequests: MusicRequest[]) => {
  const activePlaylistId = getActivePlaylistId();
  return addToSelectedPlaylist(activePlaylistId, musicRequests);
};

// 🎯 ADD SONGS TO SELECTED PLAYLIST
export const addToSelectedPlaylist = async (playlistId: string, musicRequests: MusicRequest[]) => {
  const token = await getValidAccessToken();
  
  if (!token) {
    throw new Error('Nicht bei Spotify angemeldet');
  }
  
  console.log(`🎯 === ADDING TO PLAYLIST ===`);
  console.log(`📊 Playlist ID: ${playlistId}`);
  console.log(`📊 Total requests: ${musicRequests.length}`);
  
  const results = {
    success: 0,
    errors: [] as string[],
    details: [] as string[]
  };
  
  // Filter requests that have Spotify IDs
  const spotifyRequests = musicRequests.filter(request => request.spotifyId);
  console.log(`🎵 Requests with Spotify IDs: ${spotifyRequests.length}`);
  
  if (spotifyRequests.length === 0) {
    throw new Error('Keine Songs mit Spotify-IDs gefunden');
  }
  
  try {
    // Get current playlist to check for duplicates
    const playlistResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!playlistResponse.ok) {
      throw new Error(`Failed to get playlist: ${playlistResponse.status}`);
    }
    
    const playlist = await playlistResponse.json();
    const existingTrackIds = new Set();
    
    // Get all tracks from playlist (handle pagination)
    let offset = 0;
    const limit = 100;
    
    while (offset < playlist.tracks.total) {
      const tracksResponse = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=${offset}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (tracksResponse.ok) {
        const tracksData = await tracksResponse.json();
        tracksData.items.forEach((item: any) => {
          if (item.track && item.track.id) {
            existingTrackIds.add(item.track.id);
          }
        });
        offset += limit;
      } else {
        break;
      }
    }
    
    console.log(`📋 Existing tracks in playlist: ${existingTrackIds.size}`);
    
    // Filter out duplicates
    const newTracks = spotifyRequests.filter(request => !existingTrackIds.has(request.spotifyId));
    console.log(`🆕 New tracks to add: ${newTracks.length}`);
    
    if (newTracks.length === 0) {
      results.details.push('Alle Songs sind bereits in der Playlist vorhanden');
      return results;
    }
    
    // Prepare track URIs
    const trackUris = newTracks.map(request => `spotify:track:${request.spotifyId}`);
    
    // Add tracks in batches (Spotify allows max 100 per request)
    const batchSize = 100;
    for (let i = 0; i < trackUris.length; i += batchSize) {
      const batch = trackUris.slice(i, i + batchSize);
      
      console.log(`📤 Adding batch ${Math.floor(i / batchSize) + 1}: ${batch.length} tracks`);
      
      const addResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: batch,
        }),
      });
      
      if (addResponse.ok) {
        const batchCount = batch.length;
        results.success += batchCount;
        results.details.push(`✅ ${batchCount} Songs erfolgreich hinzugefügt`);
        
        // Log added tracks
        const batchRequests = newTracks.slice(i, i + batchSize);
        batchRequests.forEach(request => {
          console.log(`  ✅ "${request.songTitle}" by ${request.artist}`);
        });
        
      } else {
        const errorText = await addResponse.text();
        const errorMsg = `Batch ${Math.floor(i / batchSize) + 1} failed: ${addResponse.status}`;
        results.errors.push(errorMsg);
        console.error(`❌ ${errorMsg} - ${errorText}`);
      }
    }
    
    console.log(`🎯 === PLAYLIST UPDATE COMPLETE ===`);
    console.log(`✅ Success: ${results.success} tracks added`);
    console.log(`❌ Errors: ${results.errors.length}`);
    
    return results;
    
  } catch (error) {
    console.error('❌ Error adding to playlist:', error);
    results.errors.push(error.message || 'Unbekannter Fehler');
    return results;
  }
};

// 🗑️ NEW: REMOVE SONGS FROM SELECTED PLAYLIST
export const removeFromSelectedPlaylist = async (playlistId: string, spotifyIds: string[]) => {
  const token = await getValidAccessToken();
  
  if (!token) {
    throw new Error('Nicht bei Spotify angemeldet');
  }
  
  console.log(`🗑️ === REMOVING FROM PLAYLIST ===`);
  console.log(`📊 Playlist ID: ${playlistId}`);
  console.log(`📊 Spotify IDs to remove: ${spotifyIds.length}`);
  
  const results = {
    success: 0,
    errors: [] as string[],
    details: [] as string[]
  };
  
  if (spotifyIds.length === 0) {
    results.details.push('Keine Spotify-IDs zum Entfernen gefunden');
    return results;
  }
  
  try {
    // Get current playlist tracks to find the ones to remove
    const playlistResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!playlistResponse.ok) {
      throw new Error(`Failed to get playlist: ${playlistResponse.status}`);
    }
    
    const playlist = await playlistResponse.json();
    const tracksToRemove: Array<{ uri: string; positions: number[] }> = [];
    
    // Get all tracks from playlist and find positions of tracks to remove
    let offset = 0;
    const limit = 100;
    let currentPosition = 0;
    
    while (offset < playlist.tracks.total) {
      const tracksResponse = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=${offset}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (tracksResponse.ok) {
        const tracksData = await tracksResponse.json();
        
        tracksData.items.forEach((item: any, index: number) => {
          if (item.track && item.track.id && spotifyIds.includes(item.track.id)) {
            const position = currentPosition + index;
            const uri = `spotify:track:${item.track.id}`;
            
            // Find existing entry or create new one
            let existingTrack = tracksToRemove.find(t => t.uri === uri);
            if (existingTrack) {
              existingTrack.positions.push(position);
            } else {
              tracksToRemove.push({
                uri: uri,
                positions: [position]
              });
            }
            
            console.log(`🎯 Found track to remove: ${item.track.name} at position ${position}`);
          }
        });
        
        currentPosition += tracksData.items.length;
        offset += limit;
      } else {
        break;
      }
    }
    
    console.log(`🗑️ Found ${tracksToRemove.length} unique tracks to remove`);
    
    if (tracksToRemove.length === 0) {
      results.details.push('Keine der angegebenen Songs wurden in der Playlist gefunden');
      return results;
    }
    
    // Remove tracks (Spotify API requires specific format)
    for (const track of tracksToRemove) {
      console.log(`🗑️ Removing track: ${track.uri} from positions: ${track.positions.join(', ')}`);
      
      // For each position, we need to remove from the highest position first
      // to avoid position shifts affecting subsequent removals
      const sortedPositions = [...track.positions].sort((a, b) => b - a);
      
      for (const position of sortedPositions) {
        const removeResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tracks: [
              {
                uri: track.uri,
                positions: [position]
              }
            ]
          }),
        });
        
        if (removeResponse.ok) {
          results.success++;
          console.log(`  ✅ Removed from position ${position}`);
        } else {
          const errorText = await removeResponse.text();
          const errorMsg = `Failed to remove ${track.uri} from position ${position}: ${removeResponse.status}`;
          results.errors.push(errorMsg);
          console.error(`❌ ${errorMsg} - ${errorText}`);
        }
      }
    }
    
    console.log(`🗑️ === PLAYLIST REMOVAL COMPLETE ===`);
    console.log(`✅ Success: ${results.success} track instances removed`);
    console.log(`❌ Errors: ${results.errors.length}`);
    
    if (results.success > 0) {
      results.details.push(`✅ ${results.success} Song-Instanz${results.success > 1 ? 'en' : ''} erfolgreich entfernt`);
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Error removing from playlist:', error);
    results.errors.push(error.message || 'Unbekannter Fehler');
    return results;
  }
};

// 🔗 OPEN WEDDING PLAYLIST
export const openWeddingPlaylist = () => {
  const playlistId = getActivePlaylistId();
  const playlistUrl = `https://open.spotify.com/playlist/${playlistId}`;
  window.open(playlistUrl, '_blank');
};

// 🔗 GET WEDDING PLAYLIST URL
export const getWeddingPlaylistUrl = (): string => {
  const playlistId = getActivePlaylistId();
  return `https://open.spotify.com/playlist/${playlistId}`;
};

// 🚪 LOGOUT
export const logoutSpotify = () => {
  console.log('🚪 Logging out from Spotify...');
  clearStoredTokens();
  // 🎯 Playlist selection remains persistent even after logout
};

// 📋 CREATE PLAYLIST EXPORT
export const createPlaylistExport = (requests: MusicRequest[]): PlaylistExport => {
  return {
    name: `Kristin & Maurizio Hochzeits-Playlist`,
    description: `Musikwünsche von der Hochzeit am ${new Date().toLocaleDateString('de-DE')}`,
    tracks: requests.map(request => ({
      name: request.songTitle,
      artist: request.artist,
      album: request.album || 'Unknown Album',
      duration: request.duration || 0,
      spotifyUrl: request.spotifyUrl || '',
    })),
    createdAt: new Date().toISOString(),
    totalTracks: requests.length,
  };
};

// 📥 DOWNLOAD FUNCTIONS
export const downloadPlaylistAsJson = (playlistExport: PlaylistExport) => {
  const blob = new Blob([JSON.stringify(playlistExport, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kristin-maurizio-playlist-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadPlaylistAsM3U = (playlistExport: PlaylistExport) => {
  const m3uContent = [
    '#EXTM3U',
    `#PLAYLIST:${playlistExport.name}`,
    '',
    ...playlistExport.tracks.map(track => [
      `#EXTINF:${Math.floor(track.duration / 1000)},${track.artist} - ${track.name}`,
      track.spotifyUrl || `# ${track.name} by ${track.artist}`,
      '',
    ]).flat(),
  ].join('\n');

  const blob = new Blob([m3uContent], { type: 'audio/x-mpegurl' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kristin-maurizio-playlist-${new Date().toISOString().split('T')[0]}.m3u`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const copyTrackListToClipboard = async (requests: MusicRequest[]): Promise<boolean> => {
  try {
    const trackList = requests.map((request, index) => 
      `${index + 1}. ${request.songTitle} - ${request.artist}`
    ).join('\n');
    
    await navigator.clipboard.writeText(trackList);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
};

export const openSpotifyPlaylist = (requests: MusicRequest[]) => {
  // Open the active playlist
  openWeddingPlaylist();
};

// 🔄 INITIALIZE ON PAGE LOAD
export const initializeSpotifyAuth = async (): Promise<boolean> => {
  console.log('🔄 Initializing Spotify auth...');
  
  // Check for auth callback
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('code')) {
    return await handleSpotifyCallback();
  }
  
  // Check existing auth
  return isSpotifyAuthenticated();
};

console.log('🎵 === SPOTIFY PLAYLIST SERVICE INITIALIZED ===');
console.log(`🔑 Client ID: ${SPOTIFY_CLIENT_ID ? 'CONFIGURED' : 'MISSING'}`);
console.log(`🎯 Active Playlist: ${getActivePlaylistId()}`);
const selectedPlaylist = getSelectedPlaylist();
if (selectedPlaylist) {
  console.log(`🔒 Playlist locked: "${selectedPlaylist.name}" (selected ${new Date(selectedPlaylist.selectedAt).toLocaleString()})`);
}
console.log('🗑️ Auto-removal from Spotify playlist enabled!');