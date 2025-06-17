import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { SpotifyCredentials, SelectedPlaylist, SpotifyTrack } from '../types';
import { generateCodeVerifier, generateCodeChallenge } from '../utils/pkce';
import { SpotifyErrorHandler, SpotifyDebugger, SpotifyRetryHandler } from './spotifyErrorHandler';

// Spotify API Configuration
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '4dbf85a8ca7c43d3b2ddc540194e9387';
const SPOTIFY_CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET || 'acf102b8834d48b497a7e98bf69021f6';
// 🔧 FIX: Dynamic redirect URI based on environment
const SPOTIFY_REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 
  (import.meta.env.DEV ? (typeof window !== 'undefined' ? window.location.origin + '/' : 'http://localhost:5173/') : 'https://kristinundmauro.de/');

// Storage keys for PKCE flow
const PKCE_CODE_VERIFIER_KEY = 'spotify_pkce_code_verifier';
const PKCE_STATE_KEY = 'spotify_pkce_state';

// Generate authorization URL with PKCE
export const getAuthorizationUrl = async (): Promise<string> => {
  try {
    // Debug environment configuration
    SpotifyDebugger.logEnvironmentConfig();
    SpotifyDebugger.validateRedirectUri();
    
    // Generate code verifier and challenge
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    // Generate random state
    const state = Math.random().toString(36).substring(2, 15);
    
    // Store code verifier and state in localStorage
    localStorage.setItem(PKCE_CODE_VERIFIER_KEY, codeVerifier);
    localStorage.setItem(PKCE_STATE_KEY, state);
    
    // Define scopes
    const scopes = [
      'playlist-read-private',
      'playlist-read-collaborative',
      'playlist-modify-public',
      'playlist-modify-private',
      'user-read-private',
      'user-read-email'
    ];
    
    // Build authorization URL with PKCE parameters
    const params = new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      response_type: 'code',
      redirect_uri: SPOTIFY_REDIRECT_URI,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      state: state,
      scope: scopes.join(' ')
    });
    
    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  } catch (error) {
    const spotifyError = SpotifyErrorHandler.handleSpotifyError(error, {
      operation: 'get_auth_url'
    });
    throw spotifyError;
  }
};

// Exchange authorization code for tokens
export const exchangeCodeForTokens = async (code: string, state: string): Promise<SpotifyCredentials> => {
  try {
    // Verify state parameter
    const storedState = localStorage.getItem(PKCE_STATE_KEY);
    if (state !== storedState) {
      throw new Error('State mismatch. Possible CSRF attack.');
    }
    
    // Get code verifier
    const codeVerifier = localStorage.getItem(PKCE_CODE_VERIFIER_KEY);
    if (!codeVerifier) {
      throw new Error('Code verifier not found.');
    }
    
    // Exchange code for tokens with retry mechanism
    const response = await SpotifyRetryHandler.withRetry(async () => {
      return await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: SPOTIFY_CLIENT_ID,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: SPOTIFY_REDIRECT_URI,
          code_verifier: codeVerifier
        })
      });
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(`Token exchange failed: ${errorData.error_description || response.statusText}`);
      (error as any).status = response.status;
      (error as any).body = errorData;
      throw error;
    }
    
    const data = await response.json();
    
    // Calculate expiry time
    const expiresAt = Date.now() + (data.expires_in * 1000);
    
    // Create credentials object
    const credentials: Omit<SpotifyCredentials, 'id'> = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: expiresAt,
      createdAt: new Date().toISOString()
    };
    
    // Store credentials in Firestore
    const credentialsRef = await addDoc(collection(db, 'spotifyCredentials'), credentials);
    
    // Clean up localStorage
    localStorage.removeItem(PKCE_CODE_VERIFIER_KEY);
    localStorage.removeItem(PKCE_STATE_KEY);
    
    return {
      id: credentialsRef.id,
      ...credentials
    };
  } catch (error) {
    const urlParams = new URLSearchParams(window.location.search);
    const spotifyError = SpotifyErrorHandler.handleSpotifyError(error, {
      operation: 'oauth_callback',
      urlParams
    });
    throw spotifyError;
  }
};

// Refresh access token using direct API call instead of SpotifyWebApi
export const refreshAccessToken = async (credentials: SpotifyCredentials): Promise<SpotifyCredentials> => {
  try {
    console.log('🔄 Refreshing access token...');
    
    // Use direct fetch instead of SpotifyWebApi to avoid library issues
    const response = await SpotifyRetryHandler.withRetry(async () => {
      return await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: credentials.refreshToken
        })
      });
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(`Token refresh failed: ${errorData.error_description || response.statusText}`);
      (error as any).status = response.status;
      (error as any).body = errorData;
      throw error;
    }
    
    const data = await response.json();
    
    // Calculate new expiry time
    const expiresAt = Date.now() + (data.expires_in * 1000);
    
    // Update credentials in Firestore
    const updatedCredentials: Partial<SpotifyCredentials> = {
      accessToken: data.access_token,
      expiresAt: expiresAt
    };
    
    // If a new refresh token was provided, update it
    if (data.refresh_token) {
      updatedCredentials.refreshToken = data.refresh_token;
    }
    
    await updateDoc(doc(db, 'spotifyCredentials', credentials.id), updatedCredentials);
    
    console.log('✅ Token refreshed successfully');
    
    return {
      ...credentials,
      ...updatedCredentials
    };
  } catch (error) {
    const spotifyError = SpotifyErrorHandler.handleSpotifyError(error, {
      operation: 'refresh_token'
    });
    throw spotifyError;
  }
};

// Get valid credentials with automatic refresh
export const getValidCredentials = async (): Promise<SpotifyCredentials | null> => {
  try {
    // Query for credentials
    const credentialsQuery = query(collection(db, 'spotifyCredentials'));
    const credentialsSnapshot = await getDocs(credentialsQuery);
    
    if (credentialsSnapshot.empty) {
      return null;
    }
    
    // Get the first (and should be only) credentials
    const credentials = {
      id: credentialsSnapshot.docs[0].id,
      ...credentialsSnapshot.docs[0].data()
    } as SpotifyCredentials;
    
    // Check if token needs refresh
    const now = Date.now();
    const tokenExpiryBuffer = 5 * 60 * 1000; // 5 minutes buffer
    
    if (now + tokenExpiryBuffer >= credentials.expiresAt) {
      // Token is expired or about to expire, refresh it
      console.log('🔄 Token expiring soon, refreshing...');
      return await refreshAccessToken(credentials);
    }
    
    return credentials;
  } catch (error) {
    const spotifyError = SpotifyErrorHandler.handleSpotifyError(error, {
      operation: 'get_credentials'
    });
    console.error('Failed to get valid credentials:', spotifyError);
    return null;
  }
};

// Disconnect Spotify account
export const disconnectSpotify = async (): Promise<void> => {
  try {
    // Get credentials
    const credentials = await getValidCredentials();
    
    if (!credentials) {
      return;
    }
    
    // Delete credentials from Firestore
    await deleteDoc(doc(db, 'spotifyCredentials', credentials.id));
    
    // Clear any cached tokens
    localStorage.removeItem(PKCE_CODE_VERIFIER_KEY);
    localStorage.removeItem(PKCE_STATE_KEY);
    
  } catch (error) {
    const spotifyError = SpotifyErrorHandler.handleSpotifyError(error, {
      operation: 'disconnect'
    });
    throw spotifyError;
  }
};

// Check if Spotify is connected
export const isSpotifyConnected = async (): Promise<boolean> => {
  try {
    const credentials = await getValidCredentials();
    return !!credentials;
  } catch (error) {
    console.error('Error checking Spotify connection:', error);
    return false;
  }
};

// Helper function to make authenticated Spotify API calls
const makeSpotifyApiCall = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const credentials = await getValidCredentials();
  
  if (!credentials) {
    throw new Error('Not connected to Spotify');
  }
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${credentials.accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(`Spotify API error: ${errorData.error?.message || response.statusText}`);
    (error as any).status = response.status;
    (error as any).body = errorData;
    throw error;
  }
  
  return response;
};

// Get user's playlists with error handling
export const getUserPlaylists = async (): Promise<SpotifyApi.PlaylistObjectSimplified[]> => {
  try {
    const response = await SpotifyRetryHandler.withRetry(async () => {
      return await makeSpotifyApiCall('https://api.spotify.com/v1/me/playlists?limit=50');
    });
    
    const data = await response.json();
    return data.items;
  } catch (error) {
    const spotifyError = SpotifyErrorHandler.handleSpotifyError(error, {
      operation: 'get_playlists',
      requiredScope: 'playlist-read-private'
    });
    throw spotifyError;
  }
};

// Save selected playlist
export const saveSelectedPlaylist = async (playlistId: string, name: string): Promise<SelectedPlaylist> => {
  try {
    // Check if a playlist is already selected
    const playlistQuery = query(collection(db, 'selectedPlaylist'));
    const playlistSnapshot = await getDocs(playlistQuery);
    
    // If a playlist is already selected, update it
    if (!playlistSnapshot.empty) {
      const selectedPlaylist = {
        id: playlistSnapshot.docs[0].id,
        ...playlistSnapshot.docs[0].data()
      } as SelectedPlaylist;
      
      await updateDoc(doc(db, 'selectedPlaylist', selectedPlaylist.id), {
        playlistId,
        name
      });
      
      return {
        ...selectedPlaylist,
        playlistId,
        name
      };
    }
    
    // Otherwise, create a new selected playlist
    const newPlaylist: Omit<SelectedPlaylist, 'id'> = {
      playlistId,
      name
    };
    
    const playlistRef = await addDoc(collection(db, 'selectedPlaylist'), newPlaylist);
    
    return {
      id: playlistRef.id,
      ...newPlaylist
    };
  } catch (error) {
    const spotifyError = SpotifyErrorHandler.handleSpotifyError(error, {
      operation: 'save_playlist'
    });
    throw spotifyError;
  }
};

// Get selected playlist
export const getSelectedPlaylist = async (): Promise<SelectedPlaylist | null> => {
  try {
    const playlistQuery = query(collection(db, 'selectedPlaylist'));
    const playlistSnapshot = await getDocs(playlistQuery);
    
    if (playlistSnapshot.empty) {
      return null;
    }
    
    return {
      id: playlistSnapshot.docs[0].id,
      ...playlistSnapshot.docs[0].data()
    } as SelectedPlaylist;
  } catch (error) {
    const spotifyError = SpotifyErrorHandler.handleSpotifyError(error, {
      operation: 'get_selected_playlist'
    });
    console.error('Failed to get selected playlist:', spotifyError);
    return null;
  }
};

// Search for tracks with error handling
export const searchTracks = async (query: string): Promise<SpotifyTrack[]> => {
  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await SpotifyRetryHandler.withRetry(async () => {
      return await makeSpotifyApiCall(`https://api.spotify.com/v1/search?q=${encodedQuery}&type=track&limit=20`);
    });
    
    const data = await response.json();
    
    // Map to our SpotifyTrack interface
    return data.tracks.items.map((track: any) => ({
      id: track.id,
      name: track.name,
      artists: track.artists.map((artist: any) => ({ name: artist.name })),
      album: {
        name: track.album.name,
        images: track.album.images
      },
      uri: track.uri
    }));
  } catch (error) {
    const spotifyError = SpotifyErrorHandler.handleSpotifyError(error, {
      operation: 'search_tracks',
      requiredScope: 'user-read-private'
    });
    throw spotifyError;
  }
};

// 🔧 NEW: Enhanced add track with instant sync verification
export const addTrackToPlaylist = async (trackUri: string): Promise<void> => {
  try {
    console.log('🎵 Adding track to playlist:', trackUri);
    
    // Get selected playlist
    const selectedPlaylist = await getSelectedPlaylist();
    
    if (!selectedPlaylist) {
      throw new Error('No playlist selected');
    }
    
    // 🔧 FIX: Add track with position parameter for better control
    const response = await SpotifyRetryHandler.withRetry(async () => {
      return await makeSpotifyApiCall(`https://api.spotify.com/v1/playlists/${selectedPlaylist.playlistId}/tracks`, {
        method: 'POST',
        body: JSON.stringify({
          uris: [trackUri],
          position: 0 // Add to beginning of playlist for immediate visibility
        })
      });
    });
    
    const result = await response.json();
    console.log('✅ Track added successfully:', result);
    
    // 🔧 NEW: Force playlist snapshot refresh
    await forcePlaylistRefresh(selectedPlaylist.playlistId);
    
  } catch (error) {
    const spotifyError = SpotifyErrorHandler.handleSpotifyError(error, {
      operation: 'add_track',
      requiredScope: 'playlist-modify-public playlist-modify-private'
    });
    throw spotifyError;
  }
};

// 🔧 NEW: Enhanced remove track with instant sync verification
export const removeTrackFromPlaylist = async (trackUri: string): Promise<void> => {
  try {
    console.log('🗑️ Removing track from playlist:', trackUri);
    
    // Get selected playlist
    const selectedPlaylist = await getSelectedPlaylist();
    
    if (!selectedPlaylist) {
      throw new Error('No playlist selected');
    }
    
    // Remove track from playlist with retry mechanism
    const response = await SpotifyRetryHandler.withRetry(async () => {
      return await makeSpotifyApiCall(`https://api.spotify.com/v1/playlists/${selectedPlaylist.playlistId}/tracks`, {
        method: 'DELETE',
        body: JSON.stringify({
          tracks: [{ uri: trackUri }]
        })
      });
    });
    
    const result = await response.json();
    console.log('✅ Track removed successfully:', result);
    
    // 🔧 NEW: Force playlist snapshot refresh
    await forcePlaylistRefresh(selectedPlaylist.playlistId);
    
  } catch (error) {
    const spotifyError = SpotifyErrorHandler.handleSpotifyError(error, {
      operation: 'remove_track',
      requiredScope: 'playlist-modify-public playlist-modify-private'
    });
    throw spotifyError;
  }
};

// 🔧 NEW: Force playlist refresh to ensure instant sync
const forcePlaylistRefresh = async (playlistId: string): Promise<void> => {
  try {
    console.log('🔄 Forcing playlist refresh for instant sync...');
    
    // Method 1: Get playlist details to trigger cache refresh
    await makeSpotifyApiCall(`https://api.spotify.com/v1/playlists/${playlistId}?fields=snapshot_id,tracks.total`);
    
    // Method 2: Get playlist tracks with fresh timestamp
    const timestamp = Date.now();
    await makeSpotifyApiCall(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=1&offset=0&_=${timestamp}`);
    
    console.log('✅ Playlist refresh completed');
    
  } catch (error) {
    console.warn('⚠️ Playlist refresh failed (non-critical):', error);
    // Don't throw error as this is a best-effort operation
  }
};

// Get current user profile with error handling
export const getCurrentUser = async (): Promise<SpotifyApi.CurrentUsersProfileResponse | null> => {
  try {
    const response = await SpotifyRetryHandler.withRetry(async () => {
      return await makeSpotifyApiCall('https://api.spotify.com/v1/me');
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    const spotifyError = SpotifyErrorHandler.handleSpotifyError(error, {
      operation: 'get_user',
      requiredScope: 'user-read-private'
    });
    console.error('Failed to get current user:', spotifyError);
    return null;
  }
};

// 🔧 ENHANCED: Get playlist tracks with cache busting and snapshot verification
export const getPlaylistTracks = async (playlistId: string): Promise<SpotifyApi.PlaylistTrackObject[]> => {
  try {
    console.log('📋 Fetching playlist tracks with cache busting...');
    
    // 🔧 FIX: Add cache busting parameter and request fresh data
    const timestamp = Date.now();
    const response = await SpotifyRetryHandler.withRetry(async () => {
      return await makeSpotifyApiCall(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50&offset=0&_=${timestamp}`,
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    });
    
    const data = await response.json();
    console.log(`✅ Fetched ${data.items.length} tracks from playlist`);
    
    return data.items;
  } catch (error) {
    const spotifyError = SpotifyErrorHandler.handleSpotifyError(error, {
      operation: 'get_playlist_tracks',
      requiredScope: 'playlist-read-private'
    });
    throw spotifyError;
  }
};

// 🔧 NEW: Get playlist snapshot ID for change detection
export const getPlaylistSnapshot = async (playlistId: string): Promise<string | null> => {
  try {
    const response = await makeSpotifyApiCall(
      `https://api.spotify.com/v1/playlists/${playlistId}?fields=snapshot_id`
    );
    
    const data = await response.json();
    return data.snapshot_id;
  } catch (error) {
    console.warn('Failed to get playlist snapshot:', error);
    return null;
  }
};

// 🔧 NEW: Wait for playlist change confirmation
export const waitForPlaylistChange = async (
  playlistId: string, 
  originalSnapshot: string | null,
  maxWaitTime: number = 5000
): Promise<boolean> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      const currentSnapshot = await getPlaylistSnapshot(playlistId);
      
      if (currentSnapshot && currentSnapshot !== originalSnapshot) {
        console.log('✅ Playlist change confirmed via snapshot ID');
        return true;
      }
      
      // Wait 500ms before checking again
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.warn('Error checking playlist snapshot:', error);
      break;
    }
  }
  
  console.log('⚠️ Playlist change not confirmed within timeout');
  return false;
};

// Bulk remove tracks from playlist with error handling
export const bulkRemoveTracksFromPlaylist = async (trackUris: string[]): Promise<void> => {
  try {
    // Get selected playlist
    const selectedPlaylist = await getSelectedPlaylist();
    
    if (!selectedPlaylist) {
      throw new Error('No playlist selected');
    }
    
    console.log(`🗑️ Bulk removing ${trackUris.length} tracks...`);
    
    // Get original snapshot for change verification
    const originalSnapshot = await getPlaylistSnapshot(selectedPlaylist.playlistId);
    
    // Remove tracks in batches (Spotify API limit is 100 tracks per request)
    const batchSize = 100;
    for (let i = 0; i < trackUris.length; i += batchSize) {
      const batch = trackUris.slice(i, i + batchSize);
      
      await SpotifyRetryHandler.withRetry(async () => {
        return await makeSpotifyApiCall(`https://api.spotify.com/v1/playlists/${selectedPlaylist.playlistId}/tracks`, {
          method: 'DELETE',
          body: JSON.stringify({
            tracks: batch.map(uri => ({ uri }))
          })
        });
      });
    }
    
    // Wait for change confirmation
    await waitForPlaylistChange(selectedPlaylist.playlistId, originalSnapshot);
    
    // Force refresh
    await forcePlaylistRefresh(selectedPlaylist.playlistId);
    
    console.log('✅ Bulk remove completed with sync verification');
    
  } catch (error) {
    const spotifyError = SpotifyErrorHandler.handleSpotifyError(error, {
      operation: 'bulk_remove_tracks',
      requiredScope: 'playlist-modify-public playlist-modify-private'
    });
    throw spotifyError;
  }
};

// Test Spotify API connection (for debugging)
export const testSpotifyConnection = async (): Promise<void> => {
  SpotifyDebugger.logEnvironmentConfig();
  await SpotifyDebugger.testSpotifyConnection();
  SpotifyDebugger.validateRedirectUri();
};