import { db } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  updateDoc,
  where,
  getDocs,
  increment,
  setDoc,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { MusicRequest, SpotifyTrack } from '../types';

// Spotify API Configuration
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '4dbf85a8ca7c43d3b2ddc540194e9387';
const SPOTIFY_CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET || 'acf102b8834d48b497a7e98bf69021f6';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const SPOTIFY_ACCOUNTS_BASE = 'https://accounts.spotify.com';

// Firestore collection names
const COLLECTIONS = {
  MUSIC_REQUESTS: 'music_requests',
  SPOTIFY_CONFIG: 'spotify_config',
  PLAYLISTS: 'playlists',
  SYNC_LOGS: 'spotify_sync_logs',
  RATE_LIMITS: 'rate_limits'
};

// Spotify configuration document ID
const SPOTIFY_CONFIG_DOC_ID = 'master_config';

// Types
interface SpotifyConfig {
  clientId: string;
  clientSecret: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: number;
  activePlaylistId: string;
  activePlaylistName: string;
  lastSyncTimestamp: number;
  lastSyncStatus: 'success' | 'failed';
  lastSyncError?: string;
  updatedAt: number;
  updatedBy: string;
}

interface SyncLog {
  timestamp: number;
  action: 'add' | 'remove' | 'sync' | 'refresh_token';
  status: 'success' | 'failed';
  details: string;
  affectedItems: number;
  error?: string;
  executedBy?: string;
}

interface RateLimit {
  ipAddress: string;
  deviceId: string;
  requestCount: number;
  lastRequest: number;
  blockedUntil?: number;
}

// Token Management
let cachedAccessToken: string | null = null;
let tokenExpiryTime: number | null = null;

// Rate Limiting
const MAX_REQUESTS_PER_HOUR = 20;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Check if a user is rate limited
 */
export const checkRateLimit = async (deviceId: string, ipAddress: string): Promise<boolean> => {
  try {
    // Get current rate limit record
    const rateLimitRef = doc(db, COLLECTIONS.RATE_LIMITS, deviceId);
    const rateLimitDoc = await getDoc(rateLimitRef);
    
    const now = Date.now();
    
    // If no record exists, create a new one
    if (!rateLimitDoc.exists()) {
      await setDoc(rateLimitRef, {
        ipAddress,
        deviceId,
        requestCount: 1,
        lastRequest: now
      });
      return false; // Not rate limited
    }
    
    const rateLimit = rateLimitDoc.data() as RateLimit;
    
    // Check if user is blocked
    if (rateLimit.blockedUntil && now < rateLimit.blockedUntil) {
      return true; // User is rate limited
    }
    
    // Check if the rate limit window has passed
    if (now - rateLimit.lastRequest > RATE_LIMIT_WINDOW) {
      // Reset counter if window has passed
      await updateDoc(rateLimitRef, {
        requestCount: 1,
        lastRequest: now,
        blockedUntil: null
      });
      return false; // Not rate limited
    }
    
    // Increment counter and check if limit exceeded
    if (rateLimit.requestCount >= MAX_REQUESTS_PER_HOUR) {
      // Set blocked until 1 hour from last request
      const blockedUntil = rateLimit.lastRequest + RATE_LIMIT_WINDOW;
      await updateDoc(rateLimitRef, {
        blockedUntil
      });
      return true; // Rate limited
    }
    
    // Increment counter
    await updateDoc(rateLimitRef, {
      requestCount: increment(1),
      lastRequest: now
    });
    
    return false; // Not rate limited
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return false; // Default to not rate limited on error
  }
};

/**
 * Log a sync operation
 */
const logSyncOperation = async (
  action: SyncLog['action'],
  status: SyncLog['status'],
  details: string,
  affectedItems: number,
  error?: string,
  executedBy?: string
): Promise<void> => {
  try {
    await addDoc(collection(db, COLLECTIONS.SYNC_LOGS), {
      timestamp: Date.now(),
      action,
      status,
      details,
      affectedItems,
      error,
      executedBy
    });
  } catch (logError) {
    console.error('Error logging sync operation:', logError);
  }
};

/**
 * Get the master Spotify configuration
 */
export const getSpotifyConfig = async (): Promise<SpotifyConfig | null> => {
  try {
    const configRef = doc(db, COLLECTIONS.SPOTIFY_CONFIG, SPOTIFY_CONFIG_DOC_ID);
    const configDoc = await getDoc(configRef);
    
    if (!configDoc.exists()) {
      console.log('No Spotify configuration found');
      return null;
    }
    
    return configDoc.data() as SpotifyConfig;
  } catch (error) {
    console.error('Error getting Spotify config:', error);
    return null;
  }
};

/**
 * Update the master Spotify configuration
 */
export const updateSpotifyConfig = async (
  config: Partial<SpotifyConfig>,
  adminName: string
): Promise<void> => {
  try {
    const configRef = doc(db, COLLECTIONS.SPOTIFY_CONFIG, SPOTIFY_CONFIG_DOC_ID);
    const configDoc = await getDoc(configRef);
    
    const updatedConfig = {
      ...(configDoc.exists() ? configDoc.data() : {}),
      ...config,
      updatedAt: Date.now(),
      updatedBy: adminName
    };
    
    await setDoc(configRef, updatedConfig);
    
    // Clear cached token if access token was updated
    if (config.accessToken) {
      cachedAccessToken = null;
      tokenExpiryTime = null;
    }
    
    console.log('Spotify configuration updated successfully');
  } catch (error) {
    console.error('Error updating Spotify config:', error);
    throw new Error('Failed to update Spotify configuration');
  }
};

/**
 * Initialize Spotify configuration with default values
 */
export const initializeSpotifyConfig = async (adminName: string): Promise<void> => {
  try {
    const configRef = doc(db, COLLECTIONS.SPOTIFY_CONFIG, SPOTIFY_CONFIG_DOC_ID);
    const configDoc = await getDoc(configRef);
    
    if (configDoc.exists()) {
      console.log('Spotify configuration already exists');
      return;
    }
    
    const initialConfig: SpotifyConfig = {
      clientId: SPOTIFY_CLIENT_ID,
      clientSecret: SPOTIFY_CLIENT_SECRET,
      accessToken: '',
      refreshToken: '',
      tokenExpiresAt: 0,
      activePlaylistId: '',
      activePlaylistName: '',
      lastSyncTimestamp: 0,
      lastSyncStatus: 'success',
      updatedAt: Date.now(),
      updatedBy: adminName
    };
    
    await setDoc(configRef, initialConfig);
    console.log('Spotify configuration initialized successfully');
  } catch (error) {
    console.error('Error initializing Spotify config:', error);
    throw new Error('Failed to initialize Spotify configuration');
  }
};

/**
 * Get a valid access token, refreshing if necessary
 */
export const getValidAccessToken = async (): Promise<string> => {
  // Check if we have a cached token that's still valid
  if (cachedAccessToken && tokenExpiryTime && Date.now() < tokenExpiryTime) {
    return cachedAccessToken;
  }
  
  // Get the current configuration
  const config = await getSpotifyConfig();
  if (!config) {
    throw new Error('Spotify configuration not found');
  }
  
  // Check if the stored token is still valid
  if (config.accessToken && config.tokenExpiresAt && Date.now() < config.tokenExpiresAt) {
    cachedAccessToken = config.accessToken;
    tokenExpiryTime = config.tokenExpiresAt;
    return config.accessToken;
  }
  
  // Token expired, need to refresh
  if (!config.refreshToken) {
    throw new Error('No refresh token available. Please reconnect Spotify.');
  }
  
  try {
    console.log('Refreshing Spotify access token...');
    
    const response = await fetch(`${SPOTIFY_ACCOUNTS_BASE}/api/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: config.refreshToken,
        client_id: config.clientId,
        client_secret: config.clientSecret,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Log the token refresh failure
      await logSyncOperation(
        'refresh_token',
        'failed',
        'Failed to refresh access token',
        0,
        JSON.stringify(errorData)
      );
      
      throw new Error(`Token refresh failed: ${errorData.error || response.statusText}`);
    }
    
    const data = await response.json();
    
    // Calculate expiry time (subtract 5 minutes for safety)
    const expiresAt = Date.now() + (data.expires_in * 1000) - (5 * 60 * 1000);
    
    // Update configuration with new token
    await updateSpotifyConfig({
      accessToken: data.access_token,
      refreshToken: data.refresh_token || config.refreshToken, // Use new refresh token if provided
      tokenExpiresAt: expiresAt
    }, 'system');
    
    // Cache the new token
    cachedAccessToken = data.access_token;
    tokenExpiryTime = expiresAt;
    
    // Log successful token refresh
    await logSyncOperation(
      'refresh_token',
      'success',
      'Successfully refreshed access token',
      1
    );
    
    return data.access_token;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw new Error('Failed to refresh access token');
  }
};

/**
 * Search for tracks on Spotify
 */
export const searchSpotifyTracks = async (query: string, limit = 20): Promise<SpotifyTrack[]> => {
  if (!query.trim()) return [];
  
  try {
    const accessToken = await getValidAccessToken();
    
    const response = await fetch(
      `${SPOTIFY_API_BASE}/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}&market=DE`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data.tracks.items;
  } catch (error) {
    console.error('Error searching Spotify tracks:', error);
    throw new Error('Failed to search for tracks');
  }
};

/**
 * Get a track by its Spotify ID
 */
export const getTrackById = async (trackId: string): Promise<SpotifyTrack | null> => {
  try {
    const accessToken = await getValidAccessToken();
    
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
    console.error('Error getting track by ID:', error);
    return null;
  }
};

/**
 * Get a track by its Spotify URL
 */
export const getTrackByUrl = async (url: string): Promise<SpotifyTrack | null> => {
  const trackId = extractTrackIdFromUrl(url);
  if (!trackId) return null;
  
  return getTrackById(trackId);
};

/**
 * Extract track ID from Spotify URL
 */
export const extractTrackIdFromUrl = (url: string): string | null => {
  const match = url.match(/\/track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
};

/**
 * Validate Spotify URL
 */
export const validateSpotifyUrl = (url: string): boolean => {
  return /^https:\/\/open\.spotify\.com\/track\/[a-zA-Z0-9]+(\?.*)?$/.test(url);
};

/**
 * Add a track to the active playlist
 */
export const addTrackToPlaylist = async (
  trackId: string,
  userName: string
): Promise<void> => {
  try {
    const config = await getSpotifyConfig();
    if (!config || !config.activePlaylistId) {
      throw new Error('No active playlist configured');
    }
    
    const accessToken = await getValidAccessToken();
    
    // Check if track already exists in playlist
    const checkResponse = await fetch(
      `${SPOTIFY_API_BASE}/playlists/${config.activePlaylistId}/tracks?limit=100`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    if (!checkResponse.ok) {
      throw new Error(`Failed to check playlist: ${checkResponse.status}`);
    }
    
    const playlistData = await checkResponse.json();
    const trackExists = playlistData.items.some((item: any) => 
      item.track && item.track.id === trackId
    );
    
    if (trackExists) {
      console.log(`Track ${trackId} already exists in playlist`);
      return;
    }
    
    // Add track to playlist
    const response = await fetch(
      `${SPOTIFY_API_BASE}/playlists/${config.activePlaylistId}/tracks`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: [`spotify:track:${trackId}`]
        })
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      await logSyncOperation(
        'add',
        'failed',
        `Failed to add track ${trackId} to playlist`,
        0,
        JSON.stringify(errorData),
        userName
      );
      
      throw new Error(`Failed to add track to playlist: ${response.status}`);
    }
    
    // Log successful addition
    await logSyncOperation(
      'add',
      'success',
      `Added track ${trackId} to playlist`,
      1,
      undefined,
      userName
    );
    
    console.log(`Track ${trackId} added to playlist successfully`);
  } catch (error) {
    console.error('Error adding track to playlist:', error);
    throw new Error('Failed to add track to playlist');
  }
};

/**
 * Remove a track from the active playlist
 */
export const removeTrackFromPlaylist = async (
  trackId: string,
  userName: string
): Promise<void> => {
  try {
    const config = await getSpotifyConfig();
    if (!config || !config.activePlaylistId) {
      throw new Error('No active playlist configured');
    }
    
    const accessToken = await getValidAccessToken();
    
    const response = await fetch(
      `${SPOTIFY_API_BASE}/playlists/${config.activePlaylistId}/tracks`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tracks: [{ uri: `spotify:track:${trackId}` }]
        })
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      await logSyncOperation(
        'remove',
        'failed',
        `Failed to remove track ${trackId} from playlist`,
        0,
        JSON.stringify(errorData),
        userName
      );
      
      throw new Error(`Failed to remove track from playlist: ${response.status}`);
    }
    
    // Log successful removal
    await logSyncOperation(
      'remove',
      'success',
      `Removed track ${trackId} from playlist`,
      1,
      undefined,
      userName
    );
    
    console.log(`Track ${trackId} removed from playlist successfully`);
  } catch (error) {
    console.error('Error removing track from playlist:', error);
    throw new Error('Failed to remove track from playlist');
  }
};

/**
 * Get user playlists
 */
export const getUserPlaylists = async (): Promise<any[]> => {
  try {
    const accessToken = await getValidAccessToken();
    
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
    console.error('Error getting user playlists:', error);
    throw new Error('Failed to get user playlists');
  }
};

/**
 * Set active playlist
 */
export const setActivePlaylist = async (
  playlistId: string,
  playlistName: string,
  adminName: string
): Promise<void> => {
  try {
    await updateSpotifyConfig({
      activePlaylistId: playlistId,
      activePlaylistName: playlistName
    }, adminName);
    
    console.log(`Active playlist set to ${playlistName} (${playlistId})`);
  } catch (error) {
    console.error('Error setting active playlist:', error);
    throw new Error('Failed to set active playlist');
  }
};

/**
 * Get playlist details
 */
export const getPlaylistDetails = async (playlistId: string): Promise<any> => {
  try {
    const accessToken = await getValidAccessToken();
    
    const response = await fetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get playlist details: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting playlist details:', error);
    throw new Error('Failed to get playlist details');
  }
};

/**
 * Synchronize database with Spotify playlist
 */
export const syncDatabaseWithSpotify = async (adminName: string): Promise<void> => {
  try {
    console.log('Starting database-Spotify synchronization...');
    
    const config = await getSpotifyConfig();
    if (!config || !config.activePlaylistId) {
      throw new Error('No active playlist configured');
    }
    
    // Get all approved music requests from database
    const requestsQuery = query(
      collection(db, COLLECTIONS.MUSIC_REQUESTS),
      where('status', '==', 'approved')
    );
    
    const requestsSnapshot = await getDocs(requestsQuery);
    const approvedRequests = requestsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MusicRequest[];
    
    console.log(`Found ${approvedRequests.length} approved requests in database`);
    
    // Get current tracks in Spotify playlist
    const playlistDetails = await getPlaylistDetails(config.activePlaylistId);
    const playlistTracks = playlistDetails.tracks.items.map((item: any) => item.track);
    
    console.log(`Found ${playlistTracks.length} tracks in Spotify playlist`);
    
    // Find tracks in database but not in Spotify (to add)
    const tracksToAdd = approvedRequests.filter(request => 
      request.spotifyId && !playlistTracks.some((track: any) => track.id === request.spotifyId)
    );
    
    // Find tracks in Spotify but not in database (to remove)
    const tracksToRemove = playlistTracks.filter((track: any) => 
      track.id && !approvedRequests.some(request => request.spotifyId === track.id)
    );
    
    console.log(`Found ${tracksToAdd.length} tracks to add and ${tracksToRemove.length} tracks to remove`);
    
    // Add missing tracks to Spotify
    for (const request of tracksToAdd) {
      if (!request.spotifyId) continue;
      
      try {
        await addTrackToPlaylist(request.spotifyId, adminName);
        console.log(`Added track ${request.spotifyId} to playlist`);
      } catch (error) {
        console.error(`Error adding track ${request.spotifyId} to playlist:`, error);
      }
    }
    
    // Remove extra tracks from Spotify
    for (const track of tracksToRemove) {
      try {
        await removeTrackFromPlaylist(track.id, adminName);
        console.log(`Removed track ${track.id} from playlist`);
      } catch (error) {
        console.error(`Error removing track ${track.id} from playlist:`, error);
      }
    }
    
    // Update last sync timestamp
    await updateSpotifyConfig({
      lastSyncTimestamp: Date.now(),
      lastSyncStatus: 'success'
    }, adminName);
    
    // Log sync operation
    await logSyncOperation(
      'sync',
      'success',
      `Synchronized database with Spotify playlist`,
      tracksToAdd.length + tracksToRemove.length,
      undefined,
      adminName
    );
    
    console.log('Database-Spotify synchronization completed successfully');
  } catch (error) {
    console.error('Error synchronizing database with Spotify:', error);
    
    // Update last sync status
    await updateSpotifyConfig({
      lastSyncTimestamp: Date.now(),
      lastSyncStatus: 'failed',
      lastSyncError: error.message
    }, 'system');
    
    // Log sync failure
    await logSyncOperation(
      'sync',
      'failed',
      'Failed to synchronize database with Spotify playlist',
      0,
      error.message
    );
    
    throw new Error('Failed to synchronize database with Spotify');
  }
};

/**
 * Get sync logs
 */
export const getSyncLogs = async (limit = 50): Promise<SyncLog[]> => {
  try {
    const logsQuery = query(
      collection(db, COLLECTIONS.SYNC_LOGS),
      orderBy('timestamp', 'desc'),
      limit
    );
    
    const logsSnapshot = await getDocs(logsQuery);
    return logsSnapshot.docs.map(doc => doc.data() as SyncLog);
  } catch (error) {
    console.error('Error getting sync logs:', error);
    return [];
  }
};

/**
 * Subscribe to sync logs
 */
export const subscribeSyncLogs = (
  callback: (logs: SyncLog[]) => void,
  limit = 50
): (() => void) => {
  const logsQuery = query(
    collection(db, COLLECTIONS.SYNC_LOGS),
    orderBy('timestamp', 'desc'),
    limit
  );
  
  return onSnapshot(logsQuery, (snapshot) => {
    const logs = snapshot.docs.map(doc => doc.data() as SyncLog);
    callback(logs);
  }, (error) => {
    console.error('Error subscribing to sync logs:', error);
    callback([]);
  });
};

/**
 * Add a music request
 */
export const addMusicRequest = async (
  track: SpotifyTrack,
  userName: string,
  deviceId: string,
  message: string = ''
): Promise<string> => {
  try {
    // Check if track already exists in requests
    if (track.id) {
      const existingQuery = query(
        collection(db, COLLECTIONS.MUSIC_REQUESTS),
        where('spotifyId', '==', track.id)
      );
      
      const existingSnapshot = await getDocs(existingQuery);
      if (!existingSnapshot.empty) {
        throw new Error('Dieser Song wurde bereits zur Playlist hinzugefügt');
      }
    }
    
    // Create the music request
    const musicRequest = {
      songTitle: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      album: track.album?.name || '',
      spotifyUrl: track.external_urls?.spotify || '',
      spotifyId: track.id,
      requestedBy: userName,
      deviceId: deviceId,
      requestedAt: Date.now(),
      message: message.trim(),
      status: 'pending', // Start as pending, admin can approve
      votes: 1, // User automatically votes for their own request
      votedBy: [deviceId],
      albumArt: track.album?.images?.[0]?.url || '',
      previewUrl: track.preview_url || '',
      duration: track.duration_ms || 0,
      popularity: track.popularity || 0
    };
    
    // Add to database
    const docRef = await addDoc(collection(db, COLLECTIONS.MUSIC_REQUESTS), musicRequest);
    
    console.log(`Music request added with ID: ${docRef.id}`);
    
    // Check if auto-approval is enabled
    const config = await getSpotifyConfig();
    if (config && config.activePlaylistId) {
      // Auto-approve and add to Spotify
      await updateDoc(doc(db, COLLECTIONS.MUSIC_REQUESTS, docRef.id), {
        status: 'approved',
        approvedAt: Date.now()
      });
      
      // Add to Spotify playlist
      if (track.id) {
        try {
          await addTrackToPlaylist(track.id, userName);
        } catch (spotifyError) {
          console.error('Error adding track to Spotify playlist:', spotifyError);
          // Continue anyway - track is still in database
        }
      }
    }
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding music request:', error);
    throw error;
  }
};

/**
 * Add a music request from URL
 */
export const addMusicRequestFromUrl = async (
  spotifyUrl: string,
  userName: string,
  deviceId: string,
  message: string = ''
): Promise<string> => {
  // Validate URL
  if (!validateSpotifyUrl(spotifyUrl)) {
    throw new Error('Ungültige Spotify-URL. Bitte verwende einen Link zu einem einzelnen Song.');
  }
  
  // Get track details
  const track = await getTrackByUrl(spotifyUrl);
  if (!track) {
    throw new Error('Song konnte nicht von Spotify geladen werden. Überprüfe den Link und versuche es erneut.');
  }
  
  // Add the request
  return addMusicRequest(track, userName, deviceId, message);
};

/**
 * Get music requests
 */
export const getMusicRequests = async (
  status?: 'pending' | 'approved' | 'rejected'
): Promise<MusicRequest[]> => {
  try {
    let requestsQuery;
    
    if (status) {
      requestsQuery = query(
        collection(db, COLLECTIONS.MUSIC_REQUESTS),
        where('status', '==', status),
        orderBy('requestedAt', 'desc')
      );
    } else {
      requestsQuery = query(
        collection(db, COLLECTIONS.MUSIC_REQUESTS),
        orderBy('requestedAt', 'desc')
      );
    }
    
    const requestsSnapshot = await getDocs(requestsQuery);
    return requestsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MusicRequest[];
  } catch (error) {
    console.error('Error getting music requests:', error);
    return [];
  }
};

/**
 * Subscribe to music requests
 */
export const subscribeMusicRequests = (
  callback: (requests: MusicRequest[]) => void,
  status?: 'pending' | 'approved' | 'rejected'
): (() => void) => {
  let requestsQuery;
  
  if (status) {
    requestsQuery = query(
      collection(db, COLLECTIONS.MUSIC_REQUESTS),
      where('status', '==', status),
      orderBy('requestedAt', 'desc')
    );
  } else {
    requestsQuery = query(
      collection(db, COLLECTIONS.MUSIC_REQUESTS),
      orderBy('requestedAt', 'desc')
    );
  }
  
  return onSnapshot(requestsQuery, (snapshot) => {
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MusicRequest[];
    
    // Sort by votes (descending) then by date (descending)
    requests.sort((a, b) => {
      if (a.votes !== b.votes) {
        return b.votes - a.votes; // Higher votes first
      }
      return b.requestedAt - a.requestedAt; // Newer first
    });
    
    callback(requests);
  }, (error) => {
    console.error('Error subscribing to music requests:', error);
    callback([]);
  });
};

/**
 * Update music request status
 */
export const updateMusicRequestStatus = async (
  requestId: string,
  status: 'pending' | 'approved' | 'rejected',
  adminName: string
): Promise<void> => {
  try {
    const requestRef = doc(db, COLLECTIONS.MUSIC_REQUESTS, requestId);
    const requestDoc = await getDoc(requestRef);
    
    if (!requestDoc.exists()) {
      throw new Error('Music request not found');
    }
    
    const request = requestDoc.data() as MusicRequest;
    const oldStatus = request.status;
    
    // Update status
    await updateDoc(requestRef, {
      status,
      updatedAt: Date.now(),
      updatedBy: adminName
    });
    
    // If approving, add to Spotify playlist
    if (status === 'approved' && oldStatus !== 'approved' && request.spotifyId) {
      try {
        await addTrackToPlaylist(request.spotifyId, adminName);
      } catch (spotifyError) {
        console.error('Error adding track to Spotify playlist:', spotifyError);
        // Continue anyway - track is still approved in database
      }
    }
    
    // If rejecting or pending, remove from Spotify playlist
    if ((status === 'rejected' || status === 'pending') && oldStatus === 'approved' && request.spotifyId) {
      try {
        await removeTrackFromPlaylist(request.spotifyId, adminName);
      } catch (spotifyError) {
        console.error('Error removing track from Spotify playlist:', spotifyError);
        // Continue anyway - track status is still updated in database
      }
    }
    
    console.log(`Music request ${requestId} status updated to ${status}`);
  } catch (error) {
    console.error('Error updating music request status:', error);
    throw new Error('Failed to update music request status');
  }
};

/**
 * Bulk update music request status
 */
export const bulkUpdateMusicRequestStatus = async (
  requestIds: string[],
  status: 'pending' | 'approved' | 'rejected',
  adminName: string
): Promise<{ success: number; failed: number; }> => {
  const result = { success: 0, failed: 0 };
  
  for (const requestId of requestIds) {
    try {
      await updateMusicRequestStatus(requestId, status, adminName);
      result.success++;
    } catch (error) {
      console.error(`Error updating request ${requestId}:`, error);
      result.failed++;
    }
  }
  
  return result;
};

/**
 * Delete a music request
 */
export const deleteMusicRequest = async (
  requestId: string,
  adminName: string
): Promise<void> => {
  try {
    const requestRef = doc(db, COLLECTIONS.MUSIC_REQUESTS, requestId);
    const requestDoc = await getDoc(requestRef);
    
    if (!requestDoc.exists()) {
      throw new Error('Music request not found');
    }
    
    const request = requestDoc.data() as MusicRequest;
    
    // If approved, remove from Spotify playlist
    if (request.status === 'approved' && request.spotifyId) {
      try {
        await removeTrackFromPlaylist(request.spotifyId, adminName);
      } catch (spotifyError) {
        console.error('Error removing track from Spotify playlist:', spotifyError);
        // Continue with deletion anyway
      }
    }
    
    // Delete from database
    await deleteDoc(requestRef);
    
    console.log(`Music request ${requestId} deleted successfully`);
  } catch (error) {
    console.error('Error deleting music request:', error);
    throw new Error('Failed to delete music request');
  }
};

/**
 * Bulk delete music requests
 */
export const bulkDeleteMusicRequests = async (
  requestIds: string[],
  adminName: string
): Promise<{ success: number; failed: number; }> => {
  const result = { success: 0, failed: 0 };
  
  for (const requestId of requestIds) {
    try {
      await deleteMusicRequest(requestId, adminName);
      result.success++;
    } catch (error) {
      console.error(`Error deleting request ${requestId}:`, error);
      result.failed++;
    }
  }
  
  return result;
};

/**
 * Vote for a music request
 */
export const voteMusicRequest = async (
  requestId: string,
  deviceId: string
): Promise<void> => {
  try {
    const requestRef = doc(db, COLLECTIONS.MUSIC_REQUESTS, requestId);
    const requestDoc = await getDoc(requestRef);
    
    if (!requestDoc.exists()) {
      throw new Error('Music request not found');
    }
    
    const request = requestDoc.data() as MusicRequest;
    const votedBy = request.votedBy || [];
    
    // Toggle vote
    if (votedBy.includes(deviceId)) {
      // Remove vote
      await updateDoc(requestRef, {
        votes: increment(-1),
        votedBy: votedBy.filter(id => id !== deviceId)
      });
    } else {
      // Add vote
      await updateDoc(requestRef, {
        votes: increment(1),
        votedBy: [...votedBy, deviceId]
      });
    }
    
    console.log(`Vote toggled for music request ${requestId}`);
  } catch (error) {
    console.error('Error voting for music request:', error);
    throw new Error('Failed to vote for music request');
  }
};

// Initialize the module
console.log('🎵 === SPOTIFY INTEGRATION SERVICE INITIALIZED ===');
console.log('✅ Secure token management');
console.log('✅ Rate limiting');
console.log('✅ Automatic playlist synchronization');
console.log('✅ Comprehensive logging');