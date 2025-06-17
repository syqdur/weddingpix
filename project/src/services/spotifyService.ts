import SpotifyWebApi from 'spotify-web-api-node';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { SpotifyCredentials, SelectedPlaylist, SpotifyTrack } from '../types';
import { generateCodeVerifier, generateCodeChallenge } from '../utils/pkce';

// Spotify API Configuration
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '4dbf85a8ca7c43d3b2ddc540194e9387';
const SPOTIFY_CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET || 'acf102b8834d48b497a7e98bf69021f6';
const SPOTIFY_REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 'https://kristinundmauro.de/';

// Create Spotify API instance
const spotifyApi = new SpotifyWebApi({
  clientId: SPOTIFY_CLIENT_ID,
  clientSecret: SPOTIFY_CLIENT_SECRET,
  redirectUri: SPOTIFY_REDIRECT_URI
});

// Storage keys for PKCE flow
const PKCE_CODE_VERIFIER_KEY = 'spotify_pkce_code_verifier';
const PKCE_STATE_KEY = 'spotify_pkce_state';

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

// Refresh access token
export const refreshAccessToken = async (credentials: SpotifyCredentials): Promise<SpotifyCredentials> => {
  try {
    // Set refresh token
    spotifyApi.setRefreshToken(credentials.refreshToken);
    
    // Refresh access token
    const data = await spotifyApi.refreshAccessToken();
    
    // Calculate new expiry time
    const expiresAt = Date.now() + (data.body.expires_in * 1000);
    
    // Update credentials in Firestore
    const updatedCredentials: Partial<SpotifyCredentials> = {
      accessToken: data.body.access_token,
      expiresAt: expiresAt
    };
    
    // If a new refresh token was provided, update it
    if (data.body.refresh_token) {
      updatedCredentials.refreshToken = data.body.refresh_token;
    }
    
    await updateDoc(doc(db, 'spotifyCredentials', credentials.id), updatedCredentials);
    
    return {
      ...credentials,
      ...updatedCredentials
    };
  } catch (error) {
    console.error('Failed to refresh access token:', error);
    throw error;
  }
};

// Get valid credentials
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

// Get user's playlists
export const getUserPlaylists = async (): Promise<SpotifyApi.PlaylistObjectSimplified[]> => {
  try {
    const credentials = await getValidCredentials();
    
    if (!credentials) {
      throw new Error('Not connected to Spotify');
    }
    
    // Set access token
    spotifyApi.setAccessToken(credentials.accessToken);
    
    // Get user's playlists
    const data = await spotifyApi.getUserPlaylists({ limit: 50 });
    return data.body.items;
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

// Search for tracks
export const searchTracks = async (query: string): Promise<SpotifyTrack[]> => {
  try {
    const credentials = await getValidCredentials();
    
    if (!credentials) {
      throw new Error('Not connected to Spotify');
    }
    
    // Set access token
    spotifyApi.setAccessToken(credentials.accessToken);
    
    // Search for tracks
    const data = await spotifyApi.searchTracks(query, { limit: 20 });
    
    // Map to our SpotifyTrack interface
    return data.body.tracks.items.map(track => ({
      id: track.id,
      name: track.name,
      artists: track.artists.map(artist => ({ name: artist.name })),
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

// Add track to playlist
export const addTrackToPlaylist = async (trackUri: string): Promise<void> => {
  try {
    const credentials = await getValidCredentials();
    
    if (!credentials) {
      throw new Error('Not connected to Spotify');
    }
    
    // Get selected playlist
    const selectedPlaylist = await getSelectedPlaylist();
    
    if (!selectedPlaylist) {
      throw new Error('No playlist selected');
    }
    
    // Set access token
    spotifyApi.setAccessToken(credentials.accessToken);
    
    // Add track to playlist
    await spotifyApi.addTracksToPlaylist(selectedPlaylist.playlistId, [trackUri]);
  } catch (error) {
    console.error('Failed to add track to playlist:', error);
    throw error;
  }
};

// Remove track from playlist
export const removeTrackFromPlaylist = async (trackUri: string): Promise<void> => {
  try {
    const credentials = await getValidCredentials();
    
    if (!credentials) {
      throw new Error('Not connected to Spotify');
    }
    
    // Get selected playlist
    const selectedPlaylist = await getSelectedPlaylist();
    
    if (!selectedPlaylist) {
      throw new Error('No playlist selected');
    }
    
    // Set access token
    spotifyApi.setAccessToken(credentials.accessToken);
    
    // Remove track from playlist
    await spotifyApi.removeTracksFromPlaylist(selectedPlaylist.playlistId, [{ uri: trackUri }]);
  } catch (error) {
    console.error('Failed to remove track from playlist:', error);
    throw error;
  }
};

// Get current user profile
export const getCurrentUser = async (): Promise<SpotifyApi.CurrentUsersProfileResponse | null> => {
  try {
    const credentials = await getValidCredentials();
    
    if (!credentials) {
      return null;
    }
    
    // Set access token
    spotifyApi.setAccessToken(credentials.accessToken);
    
    // Get current user
    const data = await spotifyApi.getMe();
    return data.body;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
};

// Get playlist tracks
export const getPlaylistTracks = async (playlistId: string): Promise<SpotifyApi.PlaylistTrackObject[]> => {
  try {
    const credentials = await getValidCredentials();
    
    if (!credentials) {
      throw new Error('Not connected to Spotify');
    }
    
    // Set access token
    spotifyApi.setAccessToken(credentials.accessToken);
    
    // Get playlist tracks
    const data = await spotifyApi.getPlaylistTracks(playlistId);
    return data.body.items;
  } catch (error) {
    console.error('Failed to get playlist tracks:', error);
    throw error;
  }
};

// Bulk remove tracks from playlist
export const bulkRemoveTracksFromPlaylist = async (trackUris: string[]): Promise<void> => {
  try {
    const credentials = await getValidCredentials();
    
    if (!credentials) {
      throw new Error('Not connected to Spotify');
    }
    
    // Get selected playlist
    const selectedPlaylist = await getSelectedPlaylist();
    
    if (!selectedPlaylist) {
      throw new Error('No playlist selected');
    }
    
    // Set access token
    spotifyApi.setAccessToken(credentials.accessToken);
    
    // Remove tracks in batches (Spotify API limit is 100 tracks per request)
    const batchSize = 100;
    for (let i = 0; i < trackUris.length; i += batchSize) {
      const batch = trackUris.slice(i, i + batchSize);
      await spotifyApi.removeTracksFromPlaylist(
        selectedPlaylist.playlistId, 
        batch.map(uri => ({ uri }))
      );
    }
  } catch (error) {
    console.error('Failed to bulk remove tracks from playlist:', error);
    throw error;
  }
};