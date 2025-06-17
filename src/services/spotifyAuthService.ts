// Spotify Authentication Service
import { v4 as uuidv4 } from 'uuid';

// Spotify API Configuration
const SPOTIFY_CLIENT_ID = '4dbf85a8ca7c43d3b2ddc540194e9387';
const SPOTIFY_CLIENT_SECRET = 'acf102b8834d48b497a7e98bf69021f6';
const REDIRECT_URI = 'https://kristinundmauro.de/';

// Storage Keys
const ACCESS_TOKEN_KEY = 'spotify_access_token';
const REFRESH_TOKEN_KEY = 'spotify_refresh_token';
const TOKEN_EXPIRY_KEY = 'spotify_token_expiry';
const USER_INFO_KEY = 'spotify_user_info';
const SELECTED_PLAYLIST_KEY = 'spotify_selected_playlist';

// User Info Interface
interface SpotifyUserInfo {
  id: string;
  display_name: string;
  email?: string;
  images?: Array<{ url: string }>;
}

// Playlist Interface
export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: Array<{ url: string }>;
  tracks: { total: number };
  owner: { id: string; display_name: string };
  collaborative: boolean;
  public: boolean;
}

// Track Interface
export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  external_urls: {
    spotify: string;
  };
  uri: string;
  preview_url: string | null;
  duration_ms: number;
  popularity: number;
}

// Token Management
const getStoredAccessToken = (): string | null => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  
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
  // Store tokens for 30 days instead of the default expiry time
  const thirtyDaysInSeconds = 30 * 24 * 60 * 60;
  const expiryTime = Date.now() + (thirtyDaysInSeconds * 1000);
  
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
  
  console.log(`🔑 Tokens stored for 30 days (extended from ${Math.floor(expiresIn / 60)} minutes)`);
};

export const clearStoredTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  localStorage.removeItem(USER_INFO_KEY);
  console.log('🔑 All tokens cleared');
};

// User Info Management
const getStoredUserInfo = (): SpotifyUserInfo | null => {
  const userInfo = localStorage.getItem(USER_INFO_KEY);
  return userInfo ? JSON.parse(userInfo) : null;
};

const storeUserInfo = (userInfo: SpotifyUserInfo) => {
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
  console.log(`👤 User info stored: ${userInfo.display_name}`);
};

// Playlist Management
export const getSelectedPlaylist = (): { id: string; name: string } | null => {
  const playlist = localStorage.getItem(SELECTED_PLAYLIST_KEY);
  return playlist ? JSON.parse(playlist) : null;
};

export const setSelectedPlaylist = (playlist: { id: string; name: string }) => {
  localStorage.setItem(SELECTED_PLAYLIST_KEY, JSON.stringify(playlist));
  console.log(`🎵 Selected playlist: ${playlist.name} (${playlist.id})`);
};

// Authentication Status
export const isSpotifyAuthenticated = (): boolean => {
  const token = getStoredAccessToken();
  const userInfo = getStoredUserInfo();
  return !!token && !!userInfo;
};

// Get Current User Info
export const getCurrentSpotifyUser = (): SpotifyUserInfo | null => {
  return getStoredUserInfo();
};

// Generate Auth URL
export const generateSpotifyAuthUrl = (): string => {
  const state = uuidv4();
  
  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    state: state,
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

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
};

// Initiate Spotify Setup
export const initiateSpotifySetup = () => {
  console.log('🚀 Starting Spotify setup...');
  
  const authUrl = generateSpotifyAuthUrl();
  console.log(`🔗 Redirecting to: ${authUrl}`);
  window.location.href = authUrl;
};

// Handle Auth Callback
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
  
  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI
      })
    });
    
    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }
    
    const tokenData = await tokenResponse.json();
    
    // Store tokens with extended expiry
    storeTokens(tokenData.access_token, tokenData.expires_in, tokenData.refresh_token);
    
    // Get user info
    const userResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
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
    alert(`Spotify Authentifizierung fehlgeschlagen: ${error.message}`);
    return false;
  }
};

// Refresh Token
const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  
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
        'Authorization': `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });
    
    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Store refreshed tokens with extended expiry
    storeTokens(data.access_token, data.expires_in, data.refresh_token || refreshToken);
    
    console.log('✅ Token refreshed successfully');
    return data.access_token;
    
  } catch (error) {
    console.error('❌ Token refresh failed:', error);
    clearStoredTokens();
    return null;
  }
};

// Get Valid Access Token
export const getValidAccessToken = async (): Promise<string | null> => {
  let token = getStoredAccessToken();
  
  if (!token) {
    console.log('🔄 No valid token, trying to refresh...');
    token = await refreshAccessToken();
  }
  
  return token;
};

// API Methods
export const getUserPlaylists = async (): Promise<SpotifyPlaylist[]> => {
  const token = await getValidAccessToken();
  
  if (!token) {
    throw new Error('Nicht bei Spotify angemeldet');
  }
  
  try {
    console.log('🎵 Getting user playlists...');
    
    const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get playlists: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ Loaded ${data.items.length} user playlists`);
    
    return data.items;
    
  } catch (error) {
    console.error('❌ Error getting user playlists:', error);
    throw error;
  }
};

export const getPlaylistTracks = async (playlistId: string): Promise<SpotifyTrack[]> => {
  const token = await getValidAccessToken();
  
  if (!token) {
    throw new Error('Nicht bei Spotify angemeldet');
  }
  
  try {
    console.log(`🎵 Getting tracks for playlist: ${playlistId}`);
    
    const tracks: SpotifyTrack[] = [];
    let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;
    
    // Handle pagination
    while (nextUrl) {
      const response = await fetch(nextUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get playlist tracks: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Process tracks
      const validTracks = data.items
        .filter((item: any) => item.track)
        .map((item: any) => item.track);
      
      tracks.push(...validTracks);
      
      // Check if there are more tracks
      nextUrl = data.next;
    }
    
    console.log(`✅ Loaded ${tracks.length} tracks from playlist`);
    return tracks;
    
  } catch (error) {
    console.error('❌ Error getting playlist tracks:', error);
    throw error;
  }
};

export const addTracksToPlaylist = async (playlistId: string, trackUris: string[]): Promise<void> => {
  if (trackUris.length === 0) return;
  
  const token = await getValidAccessToken();
  
  if (!token) {
    throw new Error('Nicht bei Spotify angemeldet');
  }
  
  try {
    console.log(`🎵 Adding ${trackUris.length} tracks to playlist: ${playlistId}`);
    
    // Spotify API allows max 100 tracks per request
    for (let i = 0; i < trackUris.length; i += 100) {
      const batch = trackUris.slice(i, i + 100);
      
      const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: batch
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add tracks: ${response.status}`);
      }
    }
    
    console.log('✅ Tracks added successfully');
    
  } catch (error) {
    console.error('❌ Error adding tracks to playlist:', error);
    throw error;
  }
};

export const removeTracksFromPlaylist = async (playlistId: string, trackUris: string[]): Promise<void> => {
  if (trackUris.length === 0) return;
  
  const token = await getValidAccessToken();
  
  if (!token) {
    throw new Error('Nicht bei Spotify angemeldet');
  }
  
  try {
    console.log(`🎵 Removing ${trackUris.length} tracks from playlist: ${playlistId}`);
    
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tracks: trackUris.map(uri => ({ uri }))
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to remove tracks: ${response.status}`);
    }
    
    console.log('✅ Tracks removed successfully');
    
  } catch (error) {
    console.error('❌ Error removing tracks from playlist:', error);
    throw error;
  }
};

export const searchSpotifyTracks = async (query: string): Promise<SpotifyTrack[]> => {
  if (!query.trim()) return [];
  
  const token = await getValidAccessToken();
  
  if (!token) {
    throw new Error('Nicht bei Spotify angemeldet');
  }
  
  try {
    console.log(`🔍 Searching for tracks: "${query}"`);
    
    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20&market=DE`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ Found ${data.tracks.items.length} tracks`);
    
    return data.tracks.items;
    
  } catch (error) {
    console.error('❌ Error searching tracks:', error);
    throw error;
  }
};

export const getTrackById = async (trackId: string): Promise<SpotifyTrack | null> => {
  const token = await getValidAccessToken();
  
  if (!token) {
    throw new Error('Nicht bei Spotify angemeldet');
  }
  
  try {
    console.log(`🔍 Getting track by ID: ${trackId}`);
    
    const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get track: ${response.status}`);
    }
    
    const track = await response.json();
    console.log(`✅ Found track: ${track.name} by ${track.artists[0].name}`);
    
    return track;
    
  } catch (error) {
    console.error('❌ Error getting track by ID:', error);
    return null;
  }
};

// Check if current URL is a Spotify callback
export const isSpotifyCallback = (): boolean => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has('code') && urlParams.has('state');
};

// Extract track ID from Spotify URL
export const extractTrackIdFromUrl = (url: string): string | null => {
  const match = url.match(/\/track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
};

// Validate Spotify URL
export const validateSpotifyUrl = (url: string): boolean => {
  const spotifyUrlPattern = /^https:\/\/open\.spotify\.com\/track\/[a-zA-Z0-9]+(\?.*)?$/;
  return spotifyUrlPattern.test(url);
};

// Get track by URL
export const getTrackByUrl = async (url: string): Promise<SpotifyTrack | null> => {
  const trackId = extractTrackIdFromUrl(url);
  if (!trackId) return null;
  return getTrackById(trackId);
};