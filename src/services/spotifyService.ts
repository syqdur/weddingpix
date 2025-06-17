import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { SpotifyCredentials, SelectedPlaylist, SpotifyTrack } from '../types';
import { generateCodeVerifier, generateCodeChallenge } from '../utils/pkce';

// Spotify API Configuration
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '4dbf85a8ca7c43d3b2ddc540194e9387';
const SPOTIFY_CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET || 'acf102b8834d48b497a7e98bf69021f6';

// 🔧 FIX: Dynamic redirect URI based on environment
const getRedirectUri = (): string => {
  // Use environment variable if set
  if (import.meta.env.VITE_SPOTIFY_REDIRECT_URI) {
    return import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
  }
  
  // For development, use current origin
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return window.location.origin + '/';
  }
  
  // Production fallback
  return 'https://kristinundmauro.de/';
};

const SPOTIFY_REDIRECT_URI = getRedirectUri();

// Storage keys for PKCE flow
const PKCE_CODE_VERIFIER_KEY = 'spotify_pkce_code_verifier';
const PKCE_STATE_KEY = 'spotify_pkce_state';

// 🚀 NEW: Real-time sync system
class SpotifyRealTimeSync {
  private static instance: SpotifyRealTimeSync;
  private listeners: Set<(tracks: SpotifyApi.PlaylistTrackObject[]) => void> = new Set();
  private currentTracks: SpotifyApi.PlaylistTrackObject[] = [];
  private playlistId: string | null = null;
  private isPolling = false;
  private pollInterval: NodeJS.Timeout | null = null;
  private lastSnapshot: string | null = null;

  static getInstance(): SpotifyRealTimeSync {
    if (!SpotifyRealTimeSync.instance) {
      SpotifyRealTimeSync.instance = new SpotifyRealTimeSync();
    }
    return SpotifyRealTimeSync.instance;
  }

  // Subscribe to real-time updates
  subscribe(callback: (tracks: SpotifyApi.PlaylistTrackObject[]) => void): () => void {
    this.listeners.add(callback);
    
    // Immediately send current tracks if available
    if (this.currentTracks.length > 0) {
      callback(this.currentTracks);
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
      if (this.listeners.size === 0) {
        this.stopPolling();
      }
    };
  }

  // Start monitoring a playlist
  async startMonitoring(playlistId: string): Promise<void> {
    console.log(`🎵 === STARTING REAL-TIME MONITORING ===`);
    console.log(`📋 Playlist ID: ${playlistId}`);
    
    this.playlistId = playlistId;
    
    // Initial load
    await this.fetchAndNotify();
    
    // Start aggressive polling for instant sync
    this.startPolling();
  }

  // Stop monitoring
  stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
      this.isPolling = false;
      console.log('⏹️ Stopped real-time polling');
    }
  }

  // Start aggressive polling
  private startPolling(): void {
    if (this.isPolling) return;
    
    this.isPolling = true;
    console.log('🔄 Starting aggressive polling (every 2 seconds)');
    
    // Poll every 2 seconds for instant updates
    this.pollInterval = setInterval(async () => {
      try {
        await this.fetchAndNotify();
      } catch (error) {
        console.warn('Polling error:', error);
      }
    }, 2000); // Very aggressive polling for instant sync
  }

  // Fetch tracks and notify all listeners
  private async fetchAndNotify(): Promise<void> {
    if (!this.playlistId) return;

    try {
      // Get fresh tracks with cache busting
      const timestamp = Date.now();
      const response = await makeSpotifyApiCall(
        `https://api.spotify.com/v1/playlists/${this.playlistId}/tracks?limit=50&offset=0&_=${timestamp}`
      );
      
      const data = await response.json();
      const newTracks = data.items;

      // Check if tracks actually changed
      const hasChanged = this.hasTracksChanged(newTracks);
      
      if (hasChanged) {
        console.log(`🔄 Tracks changed! Notifying ${this.listeners.size} listeners`);
        this.currentTracks = newTracks;
        
        // Notify all listeners immediately
        this.listeners.forEach(callback => {
          try {
            callback(newTracks);
          } catch (error) {
            console.error('Listener callback error:', error);
          }
        });
      }

    } catch (error) {
      console.error('Failed to fetch tracks for real-time sync:', error);
    }
  }

  // Check if tracks have actually changed
  private hasTracksChanged(newTracks: SpotifyApi.PlaylistTrackObject[]): boolean {
    if (newTracks.length !== this.currentTracks.length) {
      return true;
    }

    // Compare track IDs and positions
    for (let i = 0; i < newTracks.length; i++) {
      if (newTracks[i].track.id !== this.currentTracks[i]?.track.id) {
        return true;
      }
    }

    return false;
  }

  // Force immediate refresh
  async forceRefresh(): Promise<void> {
    console.log('🔄 Force refreshing playlist...');
    await this.fetchAndNotify();
  }

  // Get current tracks
  getCurrentTracks(): SpotifyApi.PlaylistTrackObject[] {
    return this.currentTracks;
  }
}

// Generate authorization URL with PKCE
export const getAuthorizationUrl = async (): Promise<string> => {
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
    
    // Exchange code for tokens
    const response = await fetch('https://accounts.spotify.com/api/token', {
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
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Token exchange failed: ${errorData.error_description || response.statusText}`);
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
    console.error('Token exchange error:', error);
    throw error;
  }
};

// Refresh access token using direct API call
export const refreshAccessToken = async (credentials: SpotifyCredentials): Promise<SpotifyCredentials> => {
  try {
    console.log('🔄 Refreshing access token...');
    
    // Use direct fetch instead of SpotifyWebApi to avoid library issues
    const response = await fetch('https://accounts.spotify.com/api/token', {
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
    console.error('Failed to refresh access token:', error);
    throw error;
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
    console.error('Failed to get valid credentials:', error);
    return null;
  }
};

// Disconnect Spotify account
export const disconnectSpotify = async (): Promise<void> => {
  try {
    // Stop real-time monitoring
    SpotifyRealTimeSync.getInstance().stopPolling();
    
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
    console.error('Failed to disconnect Spotify:', error);
    throw error;
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
  
  // 🔧 FIX: Remove cache-control header that causes CORS issues
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${credentials.accessToken}`,
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>
  };
  
  // Remove any cache-control headers that might cause CORS issues
  delete headers['Cache-Control'];
  delete headers['cache-control'];
  
  const response = await fetch(url, {
    ...options,
    headers
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
    const response = await makeSpotifyApiCall('https://api.spotify.com/v1/me/playlists?limit=50');
    const data = await response.json();
    return data.items;
  } catch (error) {
    console.error('Failed to get user playlists:', error);
    throw error;
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
    console.error('Failed to save selected playlist:', error);
    throw error;
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
    console.error('Failed to get selected playlist:', error);
    return null;
  }
};

// Search for tracks with error handling
export const searchTracks = async (query: string): Promise<SpotifyTrack[]> => {
  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await makeSpotifyApiCall(`https://api.spotify.com/v1/search?q=${encodedQuery}&type=track&limit=20`);
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
    console.error('Failed to search tracks:', error);
    throw error;
  }
};

// 🚀 NEW: Add track with instant sync
export const addTrackToPlaylist = async (trackUri: string): Promise<void> => {
  try {
    console.log('🎵 === ADDING TRACK WITH INSTANT SYNC ===');
    console.log('Track URI:', trackUri);
    
    // Get selected playlist
    const selectedPlaylist = await getSelectedPlaylist();
    
    if (!selectedPlaylist) {
      throw new Error('No playlist selected');
    }

    // Add track to playlist
    const response = await makeSpotifyApiCall(`https://api.spotify.com/v1/playlists/${selectedPlaylist.playlistId}/tracks`, {
      method: 'POST',
      body: JSON.stringify({
        uris: [trackUri],
        position: 0 // Add to beginning of playlist for immediate visibility
      })
    });
    
    const result = await response.json();
    console.log('✅ Track added successfully:', result);

    // 🚀 INSTANT SYNC: Force immediate refresh
    const syncManager = SpotifyRealTimeSync.getInstance();
    
    // Wait a moment for Spotify to process
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Force immediate refresh
    await syncManager.forceRefresh();
    
    console.log('🚀 Instant sync completed after track add');
    
  } catch (error) {
    console.error('Failed to add track to playlist:', error);
    throw error;
  }
};

// 🚀 NEW: Remove track with instant sync
export const removeTrackFromPlaylist = async (trackUri: string): Promise<void> => {
  try {
    console.log('🗑️ === REMOVING TRACK WITH INSTANT SYNC ===');
    console.log('Track URI:', trackUri);
    
    // Get selected playlist
    const selectedPlaylist = await getSelectedPlaylist();
    
    if (!selectedPlaylist) {
      throw new Error('No playlist selected');
    }
    
    const response = await makeSpotifyApiCall(`https://api.spotify.com/v1/playlists/${selectedPlaylist.playlistId}/tracks`, {
      method: 'DELETE',
      body: JSON.stringify({
        tracks: [{ uri: trackUri }]
      })
    });
    
    const result = await response.json();
    console.log('✅ Track removed successfully:', result);

    // 🚀 INSTANT SYNC: Force immediate refresh
    const syncManager = SpotifyRealTimeSync.getInstance();
    
    // Wait a moment for Spotify to process
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Force immediate refresh
    await syncManager.forceRefresh();
    
    console.log('🚀 Instant sync completed after track removal');
    
  } catch (error) {
    console.error('Failed to remove track from playlist:', error);
    throw error;
  }
};

// Get current user profile with error handling
export const getCurrentUser = async (): Promise<SpotifyApi.CurrentUsersProfileResponse | null> => {
  try {
    const response = await makeSpotifyApiCall('https://api.spotify.com/v1/me');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
};

// 🚀 NEW: Get playlist tracks with real-time sync
export const getPlaylistTracks = async (playlistId: string): Promise<SpotifyApi.PlaylistTrackObject[]> => {
  try {
    console.log('📋 Fetching playlist tracks...');
    
    // Add cache busting parameter
    const timestamp = Date.now();
    const response = await makeSpotifyApiCall(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50&offset=0&_=${timestamp}`
    );
    
    const data = await response.json();
    console.log(`✅ Fetched ${data.items.length} tracks from playlist`);
    
    return data.items;
  } catch (error) {
    console.error('Failed to get playlist tracks:', error);
    throw error;
  }
};

// 🚀 NEW: Subscribe to real-time playlist updates
export const subscribeToPlaylistUpdates = (
  playlistId: string,
  callback: (tracks: SpotifyApi.PlaylistTrackObject[]) => void
): (() => void) => {
  console.log('🚀 === SUBSCRIBING TO REAL-TIME PLAYLIST UPDATES ===');
  console.log('Playlist ID:', playlistId);
  
  const syncManager = SpotifyRealTimeSync.getInstance();
  
  // Start monitoring this playlist
  syncManager.startMonitoring(playlistId);
  
  // Subscribe to updates
  const unsubscribe = syncManager.subscribe(callback);
  
  console.log('✅ Real-time subscription active');
  
  return unsubscribe;
};

// Get playlist snapshot ID for change detection
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

// Wait for playlist change confirmation
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
    
    // Remove tracks in batches (Spotify API limit is 100 tracks per request)
    const batchSize = 100;
    for (let i = 0; i < trackUris.length; i += batchSize) {
      const batch = trackUris.slice(i, i + batchSize);
      
      await makeSpotifyApiCall(`https://api.spotify.com/v1/playlists/${selectedPlaylist.playlistId}/tracks`, {
        method: 'DELETE',
        body: JSON.stringify({
          tracks: batch.map(uri => ({ uri }))
        })
      });
    }
    
    console.log('✅ Bulk remove completed');

    // 🚀 INSTANT SYNC: Force immediate refresh after bulk operation
    const syncManager = SpotifyRealTimeSync.getInstance();
    
    // Wait a moment for Spotify to process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Force immediate refresh
    await syncManager.forceRefresh();
    
    console.log('🚀 Instant sync completed after bulk delete');
    
  } catch (error) {
    console.error('Failed to bulk remove tracks from playlist:', error);
    throw error;
  }
};