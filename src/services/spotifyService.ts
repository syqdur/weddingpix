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

// 🚀 NEW: Optimistic Update Manager for Instant UI Updates
class OptimisticUpdateManager {
  private static instance: OptimisticUpdateManager;
  private listeners: Set<(tracks: SpotifyApi.PlaylistTrackObject[]) => void> = new Set();
  private currentTracks: SpotifyApi.PlaylistTrackObject[] = [];
  private pendingOperations: Map<string, 'add' | 'remove'> = new Map();
  private playlistId: string | null = null;

  static getInstance(): OptimisticUpdateManager {
    if (!OptimisticUpdateManager.instance) {
      OptimisticUpdateManager.instance = new OptimisticUpdateManager();
    }
    return OptimisticUpdateManager.instance;
  }

  // Subscribe to updates
  subscribe(callback: (tracks: SpotifyApi.PlaylistTrackObject[]) => void): () => void {
    this.listeners.add(callback);
    
    // Immediately send current tracks if available
    if (this.currentTracks.length > 0) {
      callback(this.currentTracks);
    }

    return () => {
      this.listeners.delete(callback);
    };
  }

  // Set initial tracks
  setTracks(tracks: SpotifyApi.PlaylistTrackObject[], playlistId: string): void {
    this.currentTracks = [...tracks];
    this.playlistId = playlistId;
    this.notifyListeners();
  }

  // 🚀 INSTANT: Optimistically add track (shows immediately in UI)
  optimisticallyAddTrack(track: SpotifyTrack): void {
    console.log('🚀 OPTIMISTIC ADD:', track.name);
    
    // Create a mock playlist track object
    const mockPlaylistTrack: SpotifyApi.PlaylistTrackObject = {
      added_at: new Date().toISOString(),
      added_by: {
        id: 'current_user',
        type: 'user',
        uri: 'spotify:user:current_user',
        href: '',
        external_urls: { spotify: '' }
      },
      is_local: false,
      track: {
        id: track.id,
        name: track.name,
        artists: track.artists.map(a => ({
          id: `artist_${a.name}`,
          name: a.name,
          type: 'artist',
          uri: `spotify:artist:${a.name}`,
          href: '',
          external_urls: { spotify: '' }
        })),
        album: {
          id: 'album_' + track.album.name,
          name: track.album.name,
          images: track.album.images,
          type: 'album',
          uri: 'spotify:album:' + track.album.name,
          href: '',
          external_urls: { spotify: '' },
          album_type: 'album',
          total_tracks: 1,
          available_markets: [],
          release_date: '',
          release_date_precision: 'day'
        },
        duration_ms: 180000, // Default 3 minutes
        explicit: false,
        external_ids: {},
        external_urls: { spotify: `https://open.spotify.com/track/${track.id}` },
        href: '',
        is_playable: true,
        popularity: 50,
        preview_url: null,
        track_number: 1,
        type: 'track',
        uri: track.uri,
        is_local: false
      }
    };

    // Add to beginning of list for immediate visibility
    this.currentTracks.unshift(mockPlaylistTrack);
    this.pendingOperations.set(track.id, 'add');
    
    // Notify listeners immediately
    this.notifyListeners();
  }

  // 🚀 INSTANT: Optimistically remove track (removes immediately from UI)
  optimisticallyRemoveTrack(trackId: string): void {
    console.log('🚀 OPTIMISTIC REMOVE:', trackId);
    
    // Remove from current tracks
    this.currentTracks = this.currentTracks.filter(item => item.track.id !== trackId);
    this.pendingOperations.set(trackId, 'remove');
    
    // Notify listeners immediately
    this.notifyListeners();
  }

  // 🚀 INSTANT: Bulk optimistic remove
  optimisticallyBulkRemove(trackIds: string[]): void {
    console.log('🚀 OPTIMISTIC BULK REMOVE:', trackIds.length, 'tracks');
    
    // Remove all tracks from current list
    this.currentTracks = this.currentTracks.filter(item => !trackIds.includes(item.track.id));
    
    // Mark all as pending removal
    trackIds.forEach(id => this.pendingOperations.set(id, 'remove'));
    
    // Notify listeners immediately
    this.notifyListeners();
  }

  // Confirm operation completed (remove from pending)
  confirmOperation(trackId: string): void {
    this.pendingOperations.delete(trackId);
  }

  // Revert operation if it failed
  revertOperation(trackId: string, originalTracks: SpotifyApi.PlaylistTrackObject[]): void {
    console.log('🔄 REVERTING OPERATION:', trackId);
    
    const operation = this.pendingOperations.get(trackId);
    this.pendingOperations.delete(trackId);
    
    if (operation === 'add') {
      // Remove the optimistically added track
      this.currentTracks = this.currentTracks.filter(item => item.track.id !== trackId);
    } else if (operation === 'remove') {
      // Restore the original tracks
      this.currentTracks = [...originalTracks];
    }
    
    this.notifyListeners();
  }

  // Get current tracks
  getCurrentTracks(): SpotifyApi.PlaylistTrackObject[] {
    return this.currentTracks;
  }

  // Check if operation is pending
  isPending(trackId: string): boolean {
    return this.pendingOperations.has(trackId);
  }

  // Notify all listeners
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback([...this.currentTracks]);
      } catch (error) {
        console.error('Listener callback error:', error);
      }
    });
  }

  // Sync with actual Spotify data (background)
  async syncWithSpotify(): Promise<void> {
    if (!this.playlistId) return;

    try {
      console.log('🔄 Background sync with Spotify...');
      const actualTracks = await getPlaylistTracks(this.playlistId);
      
      // Only update if there are no pending operations
      if (this.pendingOperations.size === 0) {
        this.currentTracks = actualTracks;
        this.notifyListeners();
        console.log('✅ Background sync completed');
      } else {
        console.log('⏸️ Skipping sync - pending operations exist');
      }
    } catch (error) {
      console.warn('Background sync failed:', error);
    }
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
  
  // 🔧 FIX: Clean headers to avoid CORS issues
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${credentials.accessToken}`,
    'Content-Type': 'application/json'
  };
  
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

// 🚀 NEW: Add track with INSTANT optimistic update
export const addTrackToPlaylist = async (trackUri: string): Promise<void> => {
  const updateManager = OptimisticUpdateManager.getInstance();
  let trackToAdd: SpotifyTrack | null = null;
  
  try {
    console.log('🚀 === INSTANT ADD WITH OPTIMISTIC UPDATE ===');
    console.log('Track URI:', trackUri);
    
    // Extract track ID from URI
    const trackId = trackUri.split(':').pop() || '';
    
    // Get track details for optimistic update
    try {
      const response = await makeSpotifyApiCall(`https://api.spotify.com/v1/tracks/${trackId}`);
      const trackData = await response.json();
      
      trackToAdd = {
        id: trackData.id,
        name: trackData.name,
        artists: trackData.artists.map((a: any) => ({ name: a.name })),
        album: {
          name: trackData.album.name,
          images: trackData.album.images
        },
        uri: trackData.uri
      };
      
      // 🚀 INSTANT: Show in UI immediately
      updateManager.optimisticallyAddTrack(trackToAdd);
      
    } catch (trackError) {
      console.warn('Could not get track details for optimistic update:', trackError);
    }
    
    // Get selected playlist
    const selectedPlaylist = await getSelectedPlaylist();
    if (!selectedPlaylist) {
      throw new Error('No playlist selected');
    }

    // Add track to playlist (background operation)
    const response = await makeSpotifyApiCall(`https://api.spotify.com/v1/playlists/${selectedPlaylist.playlistId}/tracks`, {
      method: 'POST',
      body: JSON.stringify({
        uris: [trackUri],
        position: 0 // Add to beginning for immediate visibility
      })
    });
    
    const result = await response.json();
    console.log('✅ Track added to Spotify successfully:', result);

    // Confirm the operation
    if (trackToAdd) {
      updateManager.confirmOperation(trackToAdd.id);
    }
    
    // Background sync after a delay
    setTimeout(() => {
      updateManager.syncWithSpotify();
    }, 2000);
    
  } catch (error) {
    console.error('Failed to add track to playlist:', error);
    
    // Revert optimistic update on error
    if (trackToAdd) {
      const currentTracks = updateManager.getCurrentTracks();
      updateManager.revertOperation(trackToAdd.id, currentTracks);
    }
    
    throw error;
  }
};

// 🚀 NEW: Remove track with INSTANT optimistic update
export const removeTrackFromPlaylist = async (trackUri: string): Promise<void> => {
  const updateManager = OptimisticUpdateManager.getInstance();
  const trackId = trackUri.split(':').pop() || '';
  const originalTracks = updateManager.getCurrentTracks();
  
  try {
    console.log('🚀 === INSTANT REMOVE WITH OPTIMISTIC UPDATE ===');
    console.log('Track URI:', trackUri);
    
    // 🚀 INSTANT: Remove from UI immediately
    updateManager.optimisticallyRemoveTrack(trackId);
    
    // Get selected playlist
    const selectedPlaylist = await getSelectedPlaylist();
    if (!selectedPlaylist) {
      throw new Error('No playlist selected');
    }
    
    // Remove track from playlist (background operation)
    const response = await makeSpotifyApiCall(`https://api.spotify.com/v1/playlists/${selectedPlaylist.playlistId}/tracks`, {
      method: 'DELETE',
      body: JSON.stringify({
        tracks: [{ uri: trackUri }]
      })
    });
    
    const result = await response.json();
    console.log('✅ Track removed from Spotify successfully:', result);

    // Confirm the operation
    updateManager.confirmOperation(trackId);
    
    // Background sync after a delay
    setTimeout(() => {
      updateManager.syncWithSpotify();
    }, 2000);
    
  } catch (error) {
    console.error('Failed to remove track from playlist:', error);
    
    // Revert optimistic update on error
    updateManager.revertOperation(trackId, originalTracks);
    
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

// Get playlist tracks with error handling
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

// 🚀 NEW: Subscribe to optimistic updates
export const subscribeToPlaylistUpdates = (
  playlistId: string,
  callback: (tracks: SpotifyApi.PlaylistTrackObject[]) => void
): (() => void) => {
  console.log('🚀 === SUBSCRIBING TO OPTIMISTIC UPDATES ===');
  console.log('Playlist ID:', playlistId);
  
  const updateManager = OptimisticUpdateManager.getInstance();
  
  // Load initial tracks
  getPlaylistTracks(playlistId).then(tracks => {
    updateManager.setTracks(tracks, playlistId);
    
    // Start background sync every 10 seconds
    const syncInterval = setInterval(() => {
      updateManager.syncWithSpotify();
    }, 10000);
    
    // Store interval for cleanup
    (updateManager as any).syncInterval = syncInterval;
  });
  
  // Subscribe to updates
  const unsubscribe = updateManager.subscribe(callback);
  
  console.log('✅ Optimistic update subscription active');
  
  return () => {
    unsubscribe();
    // Clean up sync interval
    if ((updateManager as any).syncInterval) {
      clearInterval((updateManager as any).syncInterval);
    }
  };
};

// Bulk remove tracks from playlist with optimistic updates
export const bulkRemoveTracksFromPlaylist = async (trackUris: string[]): Promise<void> => {
  const updateManager = OptimisticUpdateManager.getInstance();
  const trackIds = trackUris.map(uri => uri.split(':').pop() || '');
  const originalTracks = updateManager.getCurrentTracks();
  
  try {
    console.log(`🚀 === INSTANT BULK REMOVE WITH OPTIMISTIC UPDATE ===`);
    console.log(`Removing ${trackUris.length} tracks...`);
    
    // 🚀 INSTANT: Remove all tracks from UI immediately
    updateManager.optimisticallyBulkRemove(trackIds);
    
    // Get selected playlist
    const selectedPlaylist = await getSelectedPlaylist();
    if (!selectedPlaylist) {
      throw new Error('No playlist selected');
    }
    
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
    
    console.log('✅ Bulk remove completed in Spotify');

    // Confirm all operations
    trackIds.forEach(id => updateManager.confirmOperation(id));
    
    // Background sync after a delay
    setTimeout(() => {
      updateManager.syncWithSpotify();
    }, 3000);
    
  } catch (error) {
    console.error('Failed to bulk remove tracks from playlist:', error);
    
    // Revert all optimistic updates on error
    trackIds.forEach(id => updateManager.revertOperation(id, originalTracks));
    
    throw error;
  }
};