// Spotify API Configuration
const SPOTIFY_CLIENT_ID = '4dbf85a8ca7c43d3b2ddc540194e9387';
const SPOTIFY_CLIENT_SECRET = 'acf102b8834d48b497a7e98bf69021f6';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const SPOTIFY_ACCOUNTS_BASE = 'https://accounts.spotify.com';

// Storage Keys
const ACCESS_TOKEN_KEY = 'spotify_access_token';
const REFRESH_TOKEN_KEY = 'spotify_refresh_token';
const TOKEN_EXPIRY_KEY = 'spotify_token_expiry';
const USER_INFO_KEY = 'spotify_user_info';
const SELECTED_PLAYLIST_KEY = 'selected_playlist';
const SHARED_TOKEN_KEY = 'shared_spotify_token';
const SHARED_TOKEN_EXPIRY_KEY = 'shared_token_expiry';
const SHARED_TOKEN_ADMIN_KEY = 'shared_token_admin';
const SHARED_TOKEN_TIMESTAMP_KEY = 'shared_token_timestamp';

// Interfaces
export interface SpotifyAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

// Check if Spotify is authenticated
export const isSpotifyAuthenticated = (): boolean => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  
  if (!token || !expiry) return false;
  
  const expiryTime = parseInt(expiry);
  return Date.now() < expiryTime;
};

// Check if shared token is available
export const isSharedTokenAvailable = (): boolean => {
  const token = localStorage.getItem(SHARED_TOKEN_KEY);
  const expiry = localStorage.getItem(SHARED_TOKEN_EXPIRY_KEY);
  
  if (!token || !expiry) return false;
  
  const expiryTime = parseInt(expiry);
  return Date.now() < expiryTime;
};

// Get shared token info
export const getSharedTokenInfo = () => {
  const token = localStorage.getItem(SHARED_TOKEN_KEY);
  const expiry = localStorage.getItem(SHARED_TOKEN_EXPIRY_KEY);
  const admin = localStorage.getItem(SHARED_TOKEN_ADMIN_KEY);
  const timestamp = localStorage.getItem(SHARED_TOKEN_TIMESTAMP_KEY);
  
  if (!token || !expiry) return null;
  
  const expiryTime = parseInt(expiry);
  const isValid = Date.now() < expiryTime;
  
  if (!isValid) return null;
  
  return {
    token,
    expiryTime,
    admin: admin || 'Unknown',
    timestamp: timestamp ? new Date(timestamp) : new Date(),
    daysRemaining: Math.floor((expiryTime - Date.now()) / (1000 * 60 * 60 * 24))
  };
};

// Store shared token
export const storeSharedToken = (token: string, expiryIn: number, admin: string) => {
  const expiryTime = Date.now() + (expiryIn * 1000);
  localStorage.setItem(SHARED_TOKEN_KEY, token);
  localStorage.setItem(SHARED_TOKEN_EXPIRY_KEY, expiryTime.toString());
  localStorage.setItem(SHARED_TOKEN_ADMIN_KEY, admin);
  localStorage.setItem(SHARED_TOKEN_TIMESTAMP_KEY, new Date().toISOString());
};

// Clear shared token
export const clearSharedToken = () => {
  localStorage.removeItem(SHARED_TOKEN_KEY);
  localStorage.removeItem(SHARED_TOKEN_EXPIRY_KEY);
  localStorage.removeItem(SHARED_TOKEN_ADMIN_KEY);
  localStorage.removeItem(SHARED_TOKEN_TIMESTAMP_KEY);
};

// Get valid access token (admin or shared)
export const getValidAccessToken = async (): Promise<string | null> => {
  // Try admin token first
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  
  if (token && expiry) {
    const expiryTime = parseInt(expiry);
    
    if (Date.now() < expiryTime) {
      return token;
    }
    
    // Try to refresh token
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      try {
        const newToken = await refreshAccessToken(refreshToken);
        return newToken;
      } catch (error) {
        console.error('Failed to refresh token:', error);
      }
    }
  }
  
  // Try shared token
  if (isSharedTokenAvailable()) {
    return localStorage.getItem(SHARED_TOKEN_KEY);
  }
  
  return null;
};

// Get redirect URI
const getRedirectUri = (): string => {
  return 'https://kristinundmauro.de/';
};

// Generate Spotify auth URL
export const generateSpotifyAuthUrl = (): string => {
  const redirectUri = getRedirectUri();
  
  const scopes = [
    'playlist-read-private',
    'playlist-read-collaborative',
    'playlist-modify-public',
    'playlist-modify-private',
    'user-read-private',
    'user-read-email'
  ];
  
  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: scopes.join(' '),
    show_dialog: 'true'
  });
  
  return `${SPOTIFY_ACCOUNTS_BASE}/authorize?${params.toString()}`;
};

// Handle auth callback
export const handleAuthCallback = async (code: string): Promise<boolean> => {
  try {
    const redirectUri = getRedirectUri();
    
    const response = await fetch(`${SPOTIFY_ACCOUNTS_BASE}/api/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      })
    });
    
    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status}`);
    }
    
    const data: SpotifyAuthResponse = await response.json();
    
    // Store tokens with extended expiry (40 days)
    const fortyDaysInSeconds = 40 * 24 * 60 * 60; // 40 days
    storeTokens(data.access_token, fortyDaysInSeconds, data.refresh_token);
    
    // Also store as shared token for all users
    const currentUser = await getCurrentUser(data.access_token);
    storeSharedToken(data.access_token, fortyDaysInSeconds, currentUser?.display_name || 'Admin');
    
    return true;
  } catch (error) {
    console.error('Auth callback error:', error);
    return false;
  }
};

// Store tokens
const storeTokens = (accessToken: string, expiresIn: number, refreshToken: string) => {
  const expiryTime = Date.now() + (expiresIn * 1000);
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

// Refresh access token
const refreshAccessToken = async (refreshToken: string): Promise<string> => {
  const response = await fetch(`${SPOTIFY_ACCOUNTS_BASE}/api/token`, {
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
  
  // Store new tokens with extended expiry (40 days)
  const fortyDaysInSeconds = 40 * 24 * 60 * 60; // 40 days
  storeTokens(data.access_token, fortyDaysInSeconds, data.refresh_token || refreshToken);
  
  // Update shared token too
  const currentUser = await getCurrentUser(data.access_token);
  storeSharedToken(data.access_token, fortyDaysInSeconds, currentUser?.display_name || 'Admin');
  
  return data.access_token;
};

// Get current user
export const getCurrentUser = async (token?: string): Promise<SpotifyUser | null> => {
  try {
    const accessToken = token || await getValidAccessToken();
    
    if (!accessToken) {
      return null;
    }
    
    const response = await fetch(`${SPOTIFY_API_BASE}/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get user: ${response.status}`);
    }
    
    const user = await response.json();
    
    // Store user info
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
    
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Get stored user
export const getStoredUser = (): SpotifyUser | null => {
  const userJson = localStorage.getItem(USER_INFO_KEY);
  if (!userJson) return null;
  
  try {
    return JSON.parse(userJson);
  } catch (error) {
    console.error('Error parsing user info:', error);
    return null;
  }
};

// Get user playlists
export const getUserPlaylists = async (): Promise<SpotifyPlaylist[]> => {
  try {
    const accessToken = await getValidAccessToken();
    
    if (!accessToken) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${SPOTIFY_API_BASE}/me/playlists?limit=50`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get playlists: ${response.status}`);
    }
    
    const data = await response.json();
    return data.items;
  } catch (error) {
    console.error('Error getting playlists:', error);
    throw error;
  }
};

// Set selected playlist
export const setSelectedPlaylist = (playlist: SpotifyPlaylist): void => {
  localStorage.setItem(SELECTED_PLAYLIST_KEY, JSON.stringify({
    id: playlist.id,
    name: playlist.name,
    images: playlist.images,
    selectedAt: new Date().toISOString()
  }));
};

// Get selected playlist
export const getSelectedPlaylist = (): { id: string; name: string } | null => {
  const playlistJson = localStorage.getItem(SELECTED_PLAYLIST_KEY);
  if (!playlistJson) return null;
  
  try {
    return JSON.parse(playlistJson);
  } catch (error) {
    console.error('Error parsing playlist:', error);
    return null;
  }
};

// Search Spotify tracks
export const searchSpotifyTracks = async (query: string): Promise<SpotifyTrack[]> => {
  try {
    const accessToken = await getValidAccessToken();
    
    if (!accessToken) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${SPOTIFY_API_BASE}/search?q=${encodeURIComponent(query)}&type=track&limit=20`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data.tracks.items;
  } catch (error) {
    console.error('Error searching tracks:', error);
    throw error;
  }
};

// Get track by URL
export const getTrackByUrl = async (url: string): Promise<SpotifyTrack | null> => {
  try {
    const trackId = extractTrackIdFromUrl(url);
    
    if (!trackId) {
      throw new Error('Invalid Spotify URL');
    }
    
    const accessToken = await getValidAccessToken();
    
    if (!accessToken) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${SPOTIFY_API_BASE}/tracks/${trackId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get track: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting track by URL:', error);
    throw error;
  }
};

// Validate Spotify URL
export const validateSpotifyUrl = (url: string): boolean => {
  return url.startsWith('https://open.spotify.com/track/') || 
         url.startsWith('spotify:track:');
};

// Extract track ID from URL
export const extractTrackIdFromUrl = (url: string): string | null => {
  if (url.startsWith('https://open.spotify.com/track/')) {
    const id = url.replace('https://open.spotify.com/track/', '').split('?')[0];
    return id;
  } else if (url.startsWith('spotify:track:')) {
    return url.replace('spotify:track:', '');
  }
  return null;
};

// Add tracks to playlist
export const addTracksToPlaylist = async (playlistId: string, trackUris: string[]): Promise<void> => {
  try {
    const accessToken = await getValidAccessToken();
    
    if (!accessToken) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uris: trackUris
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to add tracks: ${response.status}`);
    }
  } catch (error) {
    console.error('Error adding tracks to playlist:', error);
    throw error;
  }
};

// Remove tracks from playlist
export const removeTracksFromPlaylist = async (playlistId: string, trackUris: string[]): Promise<void> => {
  try {
    const accessToken = await getValidAccessToken();
    
    if (!accessToken) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tracks: trackUris.map(uri => ({ uri }))
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to remove tracks: ${response.status}`);
    }
  } catch (error) {
    console.error('Error removing tracks from playlist:', error);
    throw error;
  }
};

// Logout
export const logout = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  localStorage.removeItem(USER_INFO_KEY);
  clearSharedToken();
};

// Check if current URL is a Spotify callback
export const isSpotifyCallback = (): boolean => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has('code') && urlParams.has('state') && urlParams.get('state') === 'spotify';
};

// Process Spotify callback
export const processSpotifyCallback = async (): Promise<boolean> => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  
  if (!code) return false;
  
  const success = await handleAuthCallback(code);
  
  // Clean up URL
  window.history.replaceState({}, document.title, window.location.pathname);
  
  return success;
};