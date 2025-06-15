import { SpotifyTrack, SpotifySearchResponse } from '../types';

// 🎵 ECHTE SPOTIFY API INTEGRATION
// Zugriff auf ALLE Songs die bei Spotify verfügbar sind

// Spotify API Configuration
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || 'your_spotify_client_id';
const SPOTIFY_CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET || 'your_spotify_client_secret';

// Spotify API Base URLs
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const SPOTIFY_ACCOUNTS_BASE = 'https://accounts.spotify.com';

// Token Management
let accessToken: string | null = null;
let tokenExpiry: number | null = null;

// Get Spotify Access Token (Client Credentials Flow)
const getAccessToken = async (): Promise<string> => {
  // Check if we have a valid token
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    console.log('🔑 Using existing Spotify token');
    return accessToken;
  }

  try {
    console.log('🔑 === GETTING NEW SPOTIFY ACCESS TOKEN ===');
    console.log(`🔑 Client ID: ${SPOTIFY_CLIENT_ID ? 'SET' : 'MISSING'}`);
    console.log(`🔑 Client Secret: ${SPOTIFY_CLIENT_SECRET ? 'SET' : 'MISSING'}`);
    
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || 
        SPOTIFY_CLIENT_ID === 'your_spotify_client_id' || 
        SPOTIFY_CLIENT_SECRET === 'your_spotify_client_secret') {
      throw new Error('Spotify API credentials not configured. Please set VITE_SPOTIFY_CLIENT_ID and VITE_SPOTIFY_CLIENT_SECRET in your .env file.');
    }
    
    const response = await fetch(`${SPOTIFY_ACCOUNTS_BASE}/api/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Spotify auth failed: ${response.status} - ${errorText}`);
      throw new Error(`Spotify authentication failed: ${response.status}`);
    }

    const data = await response.json();
    
    accessToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Subtract 1 minute for safety
    
    console.log('✅ Spotify access token obtained successfully');
    console.log(`🔑 Token expires in: ${Math.floor(data.expires_in / 60)} minutes`);
    
    return accessToken;
    
  } catch (error) {
    console.error('❌ Failed to get Spotify access token:', error);
    throw new Error(`Spotify authentication failed: ${error.message}`);
  }
};

// 🎵 SEARCH ALL SPOTIFY TRACKS - REAL API
export const searchSpotifyTracks = async (query: string): Promise<SpotifyTrack[]> => {
  if (!query.trim()) return [];
  
  console.log(`🔍 === REAL SPOTIFY SEARCH ===`);
  console.log(`🔍 Query: "${query}"`);
  console.log(`🌍 Searching ALL Spotify tracks...`);
  
  try {
    const token = await getAccessToken();
    
    const searchParams = new URLSearchParams({
      q: query,
      type: 'track',
      limit: '20',
      market: 'DE', // German market for better results
      offset: '0'
    });

    console.log(`🔍 Making Spotify API request...`);
    const response = await fetch(`${SPOTIFY_API_BASE}/search?${searchParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.log('🔄 Token expired, clearing and retrying...');
        // Token expired, clear it and retry once
        accessToken = null;
        tokenExpiry = null;
        return searchSpotifyTracks(query); // Retry once
      }
      
      const errorText = await response.text();
      console.error(`❌ Spotify search failed: ${response.status} - ${errorText}`);
      throw new Error(`Spotify search failed: ${response.status}`);
    }

    const data: SpotifySearchResponse = await response.json();
    
    console.log(`✅ === REAL SPOTIFY RESULTS ===`);
    console.log(`📊 Found ${data.tracks.items.length} tracks from Spotify`);
    console.log(`🌍 Total available: ${data.tracks.total} tracks`);
    
    // Log first few results for debugging
    data.tracks.items.slice(0, 5).forEach((track, index) => {
      console.log(`  ${index + 1}. "${track.name}" by ${track.artists[0].name} (${track.popularity}% popularity)`);
    });
    
    return data.tracks.items;
    
  } catch (error) {
    console.error('❌ Real Spotify search error:', error);
    
    // Fallback to mock data if real API fails
    console.log('🔄 === FALLBACK TO MOCK DATA ===');
    console.log('⚠️ Real Spotify API failed, using demo database...');
    
    return searchMockTracks(query);
  }
};

// Enhanced mock search as fallback
const searchMockTracks = async (query: string): Promise<SpotifyTrack[]> => {
  console.log(`🔄 Using mock database for: "${query}"`);
  
  // Enhanced mock database with more tracks
  const ENHANCED_MOCK_DATABASE: SpotifyTrack[] = [
    // === HOCHZEITSKLASSIKER ===
    {
      id: 'perfect-ed-sheeran',
      name: 'Perfect',
      artists: [{ name: 'Ed Sheeran' }],
      album: {
        name: '÷ (Divide)',
        images: [{ url: 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
      },
      external_urls: { spotify: 'https://open.spotify.com/track/0tgVpDi06FyKpA1z0VMD4v' },
      preview_url: null,
      duration_ms: 263000,
      popularity: 95
    },
    {
      id: 'thinking-out-loud',
      name: 'Thinking Out Loud',
      artists: [{ name: 'Ed Sheeran' }],
      album: {
        name: 'x (Multiply)',
        images: [{ url: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
      },
      external_urls: { spotify: 'https://open.spotify.com/track/1KKAHNZhynbGhJJZaWRZZE' },
      preview_url: null,
      duration_ms: 281000,
      popularity: 89
    },
    {
      id: 'all-of-me',
      name: 'All of Me',
      artists: [{ name: 'John Legend' }],
      album: {
        name: 'Love in the Future',
        images: [{ url: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
      },
      external_urls: { spotify: 'https://open.spotify.com/track/3U4isOIWM3VvDubwSI3y7a' },
      preview_url: null,
      duration_ms: 269000,
      popularity: 92
    },
    {
      id: 'a-thousand-years',
      name: 'A Thousand Years',
      artists: [{ name: 'Christina Perri' }],
      album: {
        name: 'The Twilight Saga: Breaking Dawn - Part 1',
        images: [{ url: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
      },
      external_urls: { spotify: 'https://open.spotify.com/track/6lYBdPh8cQKJkHQfKkw2Qs' },
      preview_url: null,
      duration_ms: 285000,
      popularity: 85
    },

    // === METALLICA ===
    {
      id: 'enter-sandman',
      name: 'Enter Sandman',
      artists: [{ name: 'Metallica' }],
      album: {
        name: 'Metallica (The Black Album)',
        images: [{ url: 'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
      },
      external_urls: { spotify: 'https://open.spotify.com/track/5QTxFnGygVM4jFQpHITqxf' },
      preview_url: null,
      duration_ms: 331000,
      popularity: 88
    },
    {
      id: 'nothing-else-matters',
      name: 'Nothing Else Matters',
      artists: [{ name: 'Metallica' }],
      album: {
        name: 'Metallica (The Black Album)',
        images: [{ url: 'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
      },
      external_urls: { spotify: 'https://open.spotify.com/track/4VqPOruhp5EdPBeR92t6lQ' },
      preview_url: null,
      duration_ms: 388000,
      popularity: 85
    },
    {
      id: 'master-of-puppets',
      name: 'Master of Puppets',
      artists: [{ name: 'Metallica' }],
      album: {
        name: 'Master of Puppets',
        images: [{ url: 'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
      },
      external_urls: { spotify: 'https://open.spotify.com/track/1ZDDt7xJRECzGSNZfaiydB' },
      preview_url: null,
      duration_ms: 515000,
      popularity: 82
    },

    // === PARTY HITS ===
    {
      id: 'uptown-funk',
      name: 'Uptown Funk',
      artists: [{ name: 'Mark Ronson' }, { name: 'Bruno Mars' }],
      album: {
        name: 'Uptown Special',
        images: [{ url: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
      },
      external_urls: { spotify: 'https://open.spotify.com/track/32OlwWuMpZ6b0aN2RZOeMS' },
      preview_url: null,
      duration_ms: 269000,
      popularity: 88
    },
    {
      id: 'happy',
      name: 'Happy',
      artists: [{ name: 'Pharrell Williams' }],
      album: {
        name: 'G I R L',
        images: [{ url: 'https://images.pexels.com/photos/1729797/pexels-photo-1729797.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
      },
      external_urls: { spotify: 'https://open.spotify.com/track/60nZcImufyMA1MKQY3dcCH' },
      preview_url: null,
      duration_ms: 232000,
      popularity: 85
    },
    {
      id: 'cant-stop-feeling',
      name: "Can't Stop the Feeling!",
      artists: [{ name: 'Justin Timberlake' }],
      album: {
        name: 'Trolls (Original Motion Picture Soundtrack)',
        images: [{ url: 'https://images.pexels.com/photos/1616113/pexels-photo-1616113.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
      },
      external_urls: { spotify: 'https://open.spotify.com/track/6KuQTIu1KoTTkLXKrwlLPV' },
      preview_url: null,
      duration_ms: 236000,
      popularity: 92
    },

    // === DEUTSCHE MUSIK ===
    {
      id: 'auf-uns',
      name: 'Auf uns',
      artists: [{ name: 'Andreas Bourani' }],
      album: {
        name: 'Staub & Fantasie',
        images: [{ url: 'https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
      },
      external_urls: { spotify: 'https://open.spotify.com/track/7iDa6hUg2VgEL1o1HjmfBn' },
      preview_url: null,
      duration_ms: 228000,
      popularity: 78
    },
    {
      id: 'lieblingsmensch',
      name: 'Lieblingsmensch',
      artists: [{ name: 'Namika' }],
      album: {
        name: 'Nador',
        images: [{ url: 'https://images.pexels.com/photos/1070850/pexels-photo-1070850.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
      },
      external_urls: { spotify: 'https://open.spotify.com/track/3F5CgOj3wFlRv51JsHbVOY' },
      preview_url: null,
      duration_ms: 201000,
      popularity: 75
    },

    // === ROCK KLASSIKER ===
    {
      id: 'bohemian-rhapsody',
      name: 'Bohemian Rhapsody',
      artists: [{ name: 'Queen' }],
      album: {
        name: 'A Night at the Opera',
        images: [{ url: 'https://images.pexels.com/photos/1729799/pexels-photo-1729799.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
      },
      external_urls: { spotify: 'https://open.spotify.com/track/4u7EnebtmKWzUH433cf5Qv' },
      preview_url: null,
      duration_ms: 355000,
      popularity: 90
    },
    {
      id: 'sweet-caroline',
      name: 'Sweet Caroline',
      artists: [{ name: 'Neil Diamond' }],
      album: {
        name: 'Brother Love\'s Travelling Salvation Show',
        images: [{ url: 'https://images.pexels.com/photos/1444424/pexels-photo-1444424.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
      },
      external_urls: { spotify: 'https://open.spotify.com/track/5cLHRbWURBIbdyXbQxiZKO' },
      preview_url: null,
      duration_ms: 201000,
      popularity: 80
    },

    // === MODERNE HITS ===
    {
      id: 'shape-of-you',
      name: 'Shape of You',
      artists: [{ name: 'Ed Sheeran' }],
      album: {
        name: '÷ (Divide)',
        images: [{ url: 'https://images.pexels.com/photos/1444443/pexels-photo-1444443.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
      },
      external_urls: { spotify: 'https://open.spotify.com/track/7qiZfU4dY1lWllzX7mPBI3' },
      preview_url: null,
      duration_ms: 233000,
      popularity: 94
    },
    {
      id: 'blinding-lights',
      name: 'Blinding Lights',
      artists: [{ name: 'The Weeknd' }],
      album: {
        name: 'After Hours',
        images: [{ url: 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
      },
      external_urls: { spotify: 'https://open.spotify.com/track/0VjIjW4GlULA4LGvWeqY6h' },
      preview_url: null,
      duration_ms: 200000,
      popularity: 93
    }
  ];

  const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
  
  const results = ENHANCED_MOCK_DATABASE.filter(track => {
    const trackName = track.name.toLowerCase();
    const artistName = track.artists.map(a => a.name.toLowerCase()).join(' ');
    const albumName = track.album.name.toLowerCase();
    const searchText = `${trackName} ${artistName} ${albumName}`;
    
    return searchTerms.some(term => 
      searchText.includes(term) || 
      trackName.includes(term) || 
      artistName.includes(term) ||
      // Fuzzy matching for common typos
      (term === 'metalica' && artistName.includes('metallica')) ||
      (term === 'ed' && artistName.includes('ed sheeran'))
    );
  });

  // Sort by relevance and popularity
  results.sort((a, b) => {
    const aRelevance = searchTerms.reduce((score, term) => {
      if (a.name.toLowerCase().includes(term)) score += 10;
      if (a.artists[0].name.toLowerCase().includes(term)) score += 5;
      return score;
    }, 0);
    
    const bRelevance = searchTerms.reduce((score, term) => {
      if (b.name.toLowerCase().includes(term)) score += 10;
      if (b.artists[0].name.toLowerCase().includes(term)) score += 5;
      return score;
    }, 0);
    
    if (aRelevance !== bRelevance) return bRelevance - aRelevance;
    return b.popularity - a.popularity;
  });
  
  console.log(`✅ Mock search found ${results.length} tracks for "${query}"`);
  return results.slice(0, 15);
};

// Get track details by Spotify ID - REAL API
export const getTrackById = async (trackId: string): Promise<SpotifyTrack | null> => {
  console.log(`🔍 Getting track by ID from Spotify: ${trackId}`);
  
  try {
    const token = await getAccessToken();
    
    const response = await fetch(`${SPOTIFY_API_BASE}/tracks/${trackId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, clear and retry
        accessToken = null;
        tokenExpiry = null;
        return getTrackById(trackId);
      }
      throw new Error(`Failed to get track: ${response.status}`);
    }

    const track = await response.json();
    console.log(`✅ Found track from Spotify: ${track.name} by ${track.artists[0].name}`);
    return track;
    
  } catch (error) {
    console.error('❌ Error getting track by ID from Spotify:', error);
    return null;
  }
};

// Get track by URL - Extract ID and fetch from Spotify
export const getTrackByUrl = async (url: string): Promise<SpotifyTrack | null> => {
  console.log(`🔍 Getting track by URL: ${url}`);
  
  const trackId = extractTrackIdFromUrl(url);
  if (!trackId) {
    console.error('❌ Could not extract track ID from URL');
    return null;
  }
  
  return getTrackById(trackId);
};

// Validate Spotify URL
export const validateSpotifyUrl = (url: string): boolean => {
  const spotifyUrlPattern = /^https:\/\/open\.spotify\.com\/track\/[a-zA-Z0-9]+(\?.*)?$/;
  const isValid = spotifyUrlPattern.test(url);
  
  console.log(`🔍 URL validation: ${url} -> ${isValid ? 'VALID' : 'INVALID'}`);
  return isValid;
};

// Extract track ID from Spotify URL
export const extractTrackIdFromUrl = (url: string): string | null => {
  const match = url.match(/\/track\/([a-zA-Z0-9]+)/);
  const trackId = match ? match[1] : null;
  
  console.log(`🔍 Extracting track ID from URL: ${url} -> ${trackId || 'NOT_FOUND'}`);
  return trackId;
};

// Check if Spotify API is available and configured
export const isSpotifyAvailable = async (): Promise<boolean> => {
  try {
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || 
        SPOTIFY_CLIENT_ID === 'your_spotify_client_id' || 
        SPOTIFY_CLIENT_SECRET === 'your_spotify_client_secret') {
      console.log('⚠️ Spotify API credentials not configured');
      return false;
    }
    
    await getAccessToken();
    console.log('✅ Spotify API is available and configured');
    return true;
  } catch (error) {
    console.error('❌ Spotify API not available:', error);
    return false;
  }
};

// Get multiple tracks by IDs - REAL API
export const getTracksByIds = async (trackIds: string[]): Promise<SpotifyTrack[]> => {
  if (trackIds.length === 0) return [];
  
  try {
    const token = await getAccessToken();
    
    // Spotify API allows max 50 IDs per request
    const chunks = [];
    for (let i = 0; i < trackIds.length; i += 50) {
      chunks.push(trackIds.slice(i, i + 50));
    }
    
    const allTracks: SpotifyTrack[] = [];
    
    for (const chunk of chunks) {
      const response = await fetch(`${SPOTIFY_API_BASE}/tracks?ids=${chunk.join(',')}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get tracks: ${response.status}`);
      }

      const data = await response.json();
      allTracks.push(...data.tracks.filter((track: SpotifyTrack | null) => track !== null));
    }
    
    return allTracks;
    
  } catch (error) {
    console.error('❌ Error getting tracks by IDs:', error);
    return [];
  }
};

// Get featured playlists - REAL API
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

// Get recommendations - REAL API
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

// Search with advanced options - REAL API
export const searchSpotifyAdvanced = async (
  query: string,
  type: 'track' | 'artist' | 'album' = 'track',
  limit: number = 20,
  offset: number = 0
): Promise<SpotifyTrack[]> => {
  try {
    const token = await getAccessToken();
    
    const searchParams = new URLSearchParams({
      q: query,
      type,
      limit: limit.toString(),
      offset: offset.toString(),
      market: 'DE'
    });

    const response = await fetch(`${SPOTIFY_API_BASE}/search?${searchParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }

    const data = await response.json();
    return data.tracks?.items || [];
    
  } catch (error) {
    console.error('❌ Advanced search error:', error);
    return [];
  }
};

console.log(`🎵 === SPOTIFY SERVICE INITIALIZED ===`);
console.log(`🔑 Client ID: ${SPOTIFY_CLIENT_ID ? 'CONFIGURED' : 'MISSING'}`);
console.log(`🔑 Client Secret: ${SPOTIFY_CLIENT_SECRET ? 'CONFIGURED' : 'MISSING'}`);
console.log(`🌍 Ready to search ALL Spotify tracks!`);

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || 
    SPOTIFY_CLIENT_ID === 'your_spotify_client_id' || 
    SPOTIFY_CLIENT_SECRET === 'your_spotify_client_secret') {
  console.warn(`⚠️ === SPOTIFY SETUP REQUIRED ===`);
  console.warn(`📋 To enable real Spotify search:`);
  console.warn(`1. Create a Spotify App at https://developer.spotify.com/dashboard`);
  console.warn(`2. Copy your Client ID and Client Secret`);
  console.warn(`3. Add them to your .env file:`);
  console.warn(`   VITE_SPOTIFY_CLIENT_ID=your_client_id`);
  console.warn(`   VITE_SPOTIFY_CLIENT_SECRET=your_client_secret`);
  console.warn(`4. Restart the development server`);
  console.warn(`🔄 Currently using fallback mock data`);
}