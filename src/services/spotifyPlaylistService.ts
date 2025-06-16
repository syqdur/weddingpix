import { MusicRequest } from '../types';
import { 
  storeSharedSpotifyTokens, 
  getValidSharedAccessToken, 
  isSharedSpotifyAvailable,
  clearSharedSpotifyTokens,
  getSharedSpotifyStatus,
  subscribeToSharedSpotifyStatus
} from './spotifyTokenService';

// Spotify API Configuration
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';

// Token Storage Keys (for local admin tokens)
const SPOTIFY_ACCESS_TOKEN_KEY = 'spotify_access_token';
const SPOTIFY_REFRESH_TOKEN_KEY = 'spotify_refresh_token';
const SPOTIFY_TOKEN_EXPIRY_KEY = 'spotify_token_expiry';
const SPOTIFY_USER_INFO_KEY = 'spotify_user_info';
const SELECTED_PLAYLIST_KEY = 'selected_wedding_playlist';

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
  isLocked: boolean;
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

// 🔧 FIXED: Correct redirect URI detection for production
const getRedirectUri = (): string => {
  const currentOrigin = window.location.origin;
  
  console.log(`🔍 Current origin: ${currentOrigin}`);
  
  // 🎯 PRODUCTION URLS - Use exact deployed URL
  if (currentOrigin === 'https://kristinundmauro.de') {
    console.log('✅ Using production domain redirect URI');
    return 'https://kristinundmauro.de/';
  } else if (currentOrigin.includes('netlify.app')) {
    console.log('✅ Using Netlify redirect URI');
    return `${currentOrigin}/`;
  } else if (currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')) {
    console.log('⚠️ Localhost detected - redirecting to production');
    // 🔧 FIX: Never use localhost for Spotify auth - always redirect to production
    return 'https://kristinundmauro.de/';
  } else {
    console.log('🔄 Unknown origin - using production fallback');
    return 'https://kristinundmauro.de/';
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
    isLocked: true
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

// 🔑 LOCAL TOKEN MANAGEMENT (Admin only)
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
  const expiryTime = Date.now() + (expiresIn * 1000) - 60000;
  
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

// 🔍 ENHANCED AUTHENTICATION STATUS (Works for all users)
export const isSpotifyAuthenticated = async (): Promise<boolean> => {
  // Check local admin tokens first
  const localToken = getStoredAccessToken();
  const localUserInfo = getStoredUserInfo();
  
  if (localToken && localUserInfo) {
    console.log('🔍 Admin authenticated locally');
    return true;
  }
  
  // Check shared tokens for all users
  const sharedAvailable = await isSharedSpotifyAvailable();
  if (sharedAvailable) {
    console.log('🔍 Shared Spotify authentication available');
    return true;
  }
  
  console.log('🔍 No Spotify authentication available');
  return false;
};

// 👤 GET CURRENT USER INFO (Enhanced for shared auth)
export const getCurrentSpotifyUser = async (): Promise<SpotifyUserInfo | null> => {
  // Try local user info first (admin)
  const localUserInfo = getStoredUserInfo();
  if (localUserInfo) {
    return localUserInfo;
  }
  
  // For shared auth, get the admin who authenticated
  const sharedStatus = await getSharedSpotifyStatus();
  if (sharedStatus.isAvailable) {
    return {
      id: 'shared',
      display_name: `${sharedStatus.authenticatedBy} (Shared)`,
      email: undefined
    };
  }
  
  return null;
};

// 🔗 GENERATE AUTH URL
export const generateAdminSpotifyAuthUrl = (): string => {
  const redirectUri = getRedirectUri();
  
  console.log(`🔗 === GENERATING SPOTIFY AUTH URL ===`);
  console.log(`🔑 Client ID: ${SPOTIFY_CLIENT_ID}`);
  console.log(`🔄 Redirect URI: ${redirectUri}`);
  
  if (!SPOTIFY_CLIENT_ID) {
    throw new Error('Spotify Client ID not configured');
  }
  
  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code',
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
  
  try {
    const authUrl = generateAdminSpotifyAuthUrl();
    console.log(`🔗 Redirecting to: ${authUrl}`);
    window.location.href = authUrl;
  } catch (error) {
    console.error('❌ Error generating auth URL:', error);
    alert('Fehler: Spotify Client ID nicht konfiguriert. Bitte .env Datei prüfen.');
  }
};

// 🔄 HANDLE AUTH CALLBACK (Enhanced with shared token storage)
export const handleSpotifyCallback = async (): Promise<boolean> => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const error = urlParams.get('error');
  
  if (error) {
    console.error(`❌ Spotify auth error: ${error}`);
    alert(`Spotify Authentifizierung fehlgeschlagen: ${error}`);
    return false;
  }
  
  if (!code) {
    console.log('🔍 No auth code found in URL');
    return false;
  }
  
  console.log('🔄 Processing Spotify auth callback...');
  console.log(`🔑 Auth code: ${code.substring(0, 20)}...`);
  
  try {
    const redirectUri = getRedirectUri();
    console.log(`🔄 Using redirect URI: ${redirectUri}`);
    
    // 🔧 FIX: Ensure we have client secret
    const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
    if (!clientSecret) {
      throw new Error('Spotify Client Secret not configured');
    }
    
    console.log(`🔑 Client ID: ${SPOTIFY_CLIENT_ID}`);
    console.log(`🔑 Client Secret: ${clientSecret ? 'SET' : 'MISSING'}`);
    
    // Exchange code for tokens
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: SPOTIFY_CLIENT_ID,
        client_secret: clientSecret,
      }),
    });
    
    console.log(`🔄 Token response status: ${tokenResponse.status}`);
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error(`❌ Token exchange failed: ${tokenResponse.status} - ${errorText}`);
      
      if (tokenResponse.status === 400) {
        throw new Error(`Spotify Authentifizierung fehlgeschlagen (400). Mögliche Ursachen:\n\n1. Redirect URI stimmt nicht überein\n2. Ungültiger Authorization Code\n3. Client ID/Secret falsch\n\nBitte prüfe die Spotify App Einstellungen.`);
      } else {
        throw new Error(`Token exchange failed: ${tokenResponse.status} - ${errorText}`);
      }
    }
    
    const tokenData = await tokenResponse.json();
    console.log('✅ Token exchange successful');
    
    // Store tokens locally (admin)
    storeTokens(tokenData.access_token, tokenData.expires_in, tokenData.refresh_token);
    
    // 🌍 STORE SHARED TOKENS FOR ALL USERS
    try {
      await storeSharedSpotifyTokens(
        tokenData.access_token,
        tokenData.refresh_token,
        tokenData.expires_in,
        'Admin' // You can get the actual admin name from user context
      );
      console.log('🌍 ✅ Shared tokens stored - ALL USERS can now use Spotify!');
    } catch (sharedError) {
      console.error('❌ Error storing shared tokens:', sharedError);
      // Continue anyway - admin still has local access
    }
    
    // Get user info
    const userResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      storeUserInfo(userData);
      console.log(`✅ User info loaded: ${userData.display_name}`);
    } else {
      console.warn('⚠️ Could not load user info, but auth was successful');
    }
    
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
    console.log('✅ Spotify authentication successful!');
    return true;
    
  } catch (error) {
    console.error('❌ Spotify callback error:', error);
    clearStoredTokens();
    
    // Show user-friendly error
    if (error instanceof Error) {
      alert(`Spotify Authentifizierung fehlgeschlagen:\n\n${error.message}`);
    } else {
      alert('Spotify Authentifizierung fehlgeschlagen. Bitte versuche es erneut.');
    }
    
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

// 🔑 GET VALID ACCESS TOKEN (Enhanced for all users)
const getValidAccessToken = async (): Promise<string | null> => {
  // Try local admin token first
  let token = getStoredAccessToken();
  
  if (!token) {
    console.log('🔄 No local token, trying to refresh...');
    token = await refreshAccessToken();
  }
  
  if (token) {
    console.log('✅ Using local admin token');
    return token;
  }
  
  // Try shared token for all users
  console.log('🔄 No local token, trying shared token...');
  const sharedToken = await getValidSharedAccessToken();
  
  if (sharedToken) {
    console.log('✅ Using shared token');
    return sharedToken;
  }
  
  console.log('❌ No valid tokens available');
  return null;
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
    const currentUser = await getCurrentSpotifyUser();
    const modifiablePlaylists = data.items.filter((playlist: any) => 
      playlist.owner.id === currentUser?.id || playlist.collaborative
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

// 🗑️ REMOVE SONGS FROM SELECTED PLAYLIST
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

// 🚪 LOGOUT (Enhanced for shared tokens)
export const logoutSpotify = async () => {
  console.log('🚪 Logging out from Spotify...');
  
  // Clear local tokens
  clearStoredTokens();
  
  // Clear shared tokens (admin only)
  const localUserInfo = getStoredUserInfo();
  if (localUserInfo) {
    try {
      await clearSharedSpotifyTokens();
      console.log('🌍 Shared tokens cleared - affects all users');
    } catch (error) {
      console.error('❌ Error clearing shared tokens:', error);
    }
  }
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
  openWeddingPlaylist();
};

// 🔄 INITIALIZE ON PAGE LOAD (Enhanced)
export const initializeSpotifyAuth = async (): Promise<boolean> => {
  console.log('🔄 Initializing Spotify auth...');
  
  // Check for auth callback
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('code')) {
    return await handleSpotifyCallback();
  }
  
  // Check existing auth (local or shared)
  return await isSpotifyAuthenticated();
};

// 🌍 EXPORT SHARED TOKEN FUNCTIONS FOR OTHER SERVICES
export { 
  subscribeToSharedSpotifyStatus,
  getSharedSpotifyStatus,
  isSharedSpotifyAvailable 
};

console.log('🎵 === ENHANCED SPOTIFY PLAYLIST SERVICE INITIALIZED ===');
console.log(`🔑 Client ID: ${SPOTIFY_CLIENT_ID ? 'CONFIGURED' : 'MISSING'}`);
console.log(`🎯 Active Playlist: ${getActivePlaylistId()}`);
const selectedPlaylist = getSelectedPlaylist();
if (selectedPlaylist) {
  console.log(`🔒 Playlist locked: "${selectedPlaylist.name}" (selected ${new Date(selectedPlaylist.selectedAt).toLocaleString()})`);
}
console.log('🌍 ✅ SHARED AUTHENTICATION: Admin auth now works for ALL users!');
console.log('🔄 Automatic token refresh and sharing enabled');
console.log('🗑️ Auto-removal from Spotify playlist enabled!');
console.log('🔗 Production redirect URI: https://kristinundmauro.de/');