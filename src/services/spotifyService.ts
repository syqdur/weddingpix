import { SpotifyTrack, SpotifySearchResponse } from '../types';

// Spotify API Configuration
const SPOTIFY_CLIENT_ID = 'dein_spotify_client_id'; // Du musst diese bei Spotify registrieren
const SPOTIFY_CLIENT_SECRET = 'dein_spotify_client_secret';
const SPOTIFY_REDIRECT_URI = window.location.origin + '/callback';

// Spotify API Base URL
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const SPOTIFY_ACCOUNTS_BASE = 'https://accounts.spotify.com';

// Token Management
let accessToken: string | null = null;
let tokenExpiry: number | null = null;

// Get Spotify Access Token (Client Credentials Flow - für öffentliche Suche)
const getAccessToken = async (): Promise<string> => {
  // Check if we have a valid token
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  try {
    console.log('🔑 Getting new Spotify access token...');
    
    const response = await fetch(`${SPOTIFY_ACCOUNTS_BASE}/api/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      throw new Error(`Spotify auth failed: ${response.status}`);
    }

    const data = await response.json();
    
    accessToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Subtract 1 minute for safety
    
    console.log('✅ Spotify access token obtained');
    return accessToken;
    
  } catch (error) {
    console.error('❌ Failed to get Spotify access token:', error);
    throw new Error('Spotify-Authentifizierung fehlgeschlagen');
  }
};

// Search Spotify tracks
export const searchSpotifyTracks = async (query: string): Promise<SpotifyTrack[]> => {
  if (!query.trim()) return [];
  
  try {
    console.log(`🔍 Searching Spotify for: "${query}"`);
    
    const token = await getAccessToken();
    
    const searchParams = new URLSearchParams({
      q: query,
      type: 'track',
      limit: '20',
      market: 'DE' // German market for better results
    });

    const response = await fetch(`${SPOTIFY_API_BASE}/search?${searchParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, clear it and retry
        accessToken = null;
        tokenExpiry = null;
        return searchSpotifyTracks(query); // Retry once
      }
      throw new Error(`Spotify search failed: ${response.status}`);
    }

    const data: SpotifySearchResponse = await response.json();
    
    console.log(`✅ Found ${data.tracks.items.length} tracks on Spotify`);
    return data.tracks.items;
    
  } catch (error) {
    console.error('❌ Spotify search error:', error);
    
    // Fallback to mock data if Spotify fails
    console.log('🔄 Falling back to mock data...');
    return searchMockTracks(query);
  }
};

// Fallback mock search (same as before)
const searchMockTracks = async (query: string): Promise<SpotifyTrack[]> => {
  // Your existing mock data here...
  const MOCK_TRACKS_DATABASE: SpotifyTrack[] = [
    // ... (same mock data as before)
  ];

  const searchTerms = query.toLowerCase().split(' ');
  
  const results = MOCK_TRACKS_DATABASE.filter(track => {
    const trackName = track.name.toLowerCase();
    const artistName = track.artists.map(a => a.name.toLowerCase()).join(' ');
    const albumName = track.album.name.toLowerCase();
    const searchText = `${trackName} ${artistName} ${albumName}`;
    
    return searchTerms.some(term => 
      searchText.includes(term) || 
      trackName.includes(term) || 
      artistName.includes(term)
    );
  });

  return results.slice(0, 10);
};

// Get track details by Spotify ID
export const getTrackById = async (trackId: string): Promise<SpotifyTrack | null> => {
  try {
    const token = await getAccessToken();
    
    const response = await fetch(`${SPOTIFY_API_BASE}/tracks/${trackId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get track: ${response.status}`);
    }

    return await response.json();
    
  } catch (error) {
    console.error('❌ Error getting track by ID:', error);
    return null;
  }
};

// Get multiple tracks by IDs
export const getTracksByIds = async (trackIds: string[]): Promise<SpotifyTrack[]> => {
  if (trackIds.length === 0) return [];
  
  try {
    const token = await getAccessToken();
    
    const response = await fetch(`${SPOTIFY_API_BASE}/tracks?ids=${trackIds.join(',')}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get tracks: ${response.status}`);
    }

    const data = await response.json();
    return data.tracks.filter((track: SpotifyTrack | null) => track !== null);
    
  } catch (error) {
    console.error('❌ Error getting tracks by IDs:', error);
    return [];
  }
};

// Get featured playlists (for suggestions)
export const getFeaturedPlaylists = async (): Promise<any[]> => {
  try {
    const token = await getAccessToken();
    
    const response = await fetch(`${SPOTIFY_API_BASE}/browse/featured-playlists?limit=10&country=DE`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get playlists: ${response.status}`);
    }

    const data = await response.json();
    return data.playlists.items;
    
  } catch (error) {
    console.error('❌ Error getting featured playlists:', error);
    return [];
  }
};

// Get recommendations based on seed tracks
export const getRecommendations = async (seedTracks: string[]): Promise<SpotifyTrack[]> => {
  if (seedTracks.length === 0) return [];
  
  try {
    const token = await getAccessToken();
    
    const params = new URLSearchParams({
      seed_tracks: seedTracks.slice(0, 5).join(','), // Max 5 seeds
      limit: '10',
      market: 'DE'
    });

    const response = await fetch(`${SPOTIFY_API_BASE}/recommendations?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get recommendations: ${response.status}`);
    }

    const data = await response.json();
    return data.tracks;
    
  } catch (error) {
    console.error('❌ Error getting recommendations:', error);
    return [];
  }
};

// Validate Spotify URL
export const validateSpotifyUrl = (url: string): boolean => {
  const spotifyUrlPattern = /^https:\/\/open\.spotify\.com\/track\/[a-zA-Z0-9]+(\?.*)?$/;
  return spotifyUrlPattern.test(url);
};

// Extract track ID from Spotify URL
export const extractTrackIdFromUrl = (url: string): string | null => {
  const match = url.match(/\/track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
};

// Check if Spotify is available
export const isSpotifyAvailable = async (): Promise<boolean> => {
  try {
    await getAccessToken();
    return true;
  } catch {
    return false;
  }
};