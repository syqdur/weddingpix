import { SpotifyTrack, SpotifySearchResponse } from '../types';

// 🎵 MOCK-ONLY SPOTIFY SERVICE
// Diese Version verwendet nur Mock-Daten und macht keine echten API-Calls

// Enhanced mock tracks database with realistic data
const MOCK_TRACKS_DATABASE: SpotifyTrack[] = [
  // Hochzeitsklassiker
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
  // Metallica Songs
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
  // Party & Tanzmusik
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
  // Deutsche Hochzeitsmusik
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
  // Weitere beliebte Songs
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
  {
    id: 'dont-stop-believin',
    name: "Don't Stop Believin'",
    artists: [{ name: 'Journey' }],
    album: {
      name: 'Escape',
      images: [{ url: 'https://images.pexels.com/photos/1024967/pexels-photo-1024967.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/4bHsxqR3GMrXTxEPLuK5ue' },
    preview_url: null,
    duration_ms: 251000,
    popularity: 87
  },
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
  }
];

// Create a map for quick URL lookups
const URL_TO_TRACK_MAP = new Map<string, SpotifyTrack>();
MOCK_TRACKS_DATABASE.forEach(track => {
  URL_TO_TRACK_MAP.set(track.external_urls.spotify, track);
});

// Mock search function with intelligent matching
export const searchSpotifyTracks = async (query: string): Promise<SpotifyTrack[]> => {
  if (!query.trim()) return [];
  
  console.log(`🔍 Mock Spotify search for: "${query}"`);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
  
  const results = MOCK_TRACKS_DATABASE.filter(track => {
    const trackName = track.name.toLowerCase();
    const artistName = track.artists.map(a => a.name.toLowerCase()).join(' ');
    const albumName = track.album.name.toLowerCase();
    const searchText = `${trackName} ${artistName} ${albumName}`;
    
    // Check for exact matches first
    if (trackName.includes(query.toLowerCase()) || artistName.includes(query.toLowerCase())) {
      return true;
    }
    
    // Then check for partial matches
    return searchTerms.some(term => {
      return searchText.includes(term) || 
             trackName.includes(term) || 
             artistName.includes(term) ||
             // Fuzzy matching for common typos
             (term === 'metalica' && artistName.includes('metallica')) ||
             (term === 'metallic' && artistName.includes('metallica'));
    });
  });

  // Sort by relevance and popularity
  results.sort((a, b) => {
    const aRelevance = searchTerms.reduce((score, term) => {
      const aTrackName = a.name.toLowerCase();
      const aArtistName = a.artists[0].name.toLowerCase();
      
      if (aTrackName.includes(term)) score += 10;
      if (aArtistName.includes(term)) score += 8;
      if (aTrackName.startsWith(term)) score += 5;
      if (aArtistName.startsWith(term)) score += 3;
      
      return score;
    }, 0);
    
    const bRelevance = searchTerms.reduce((score, term) => {
      const bTrackName = b.name.toLowerCase();
      const bArtistName = b.artists[0].name.toLowerCase();
      
      if (bTrackName.includes(term)) score += 10;
      if (bArtistName.includes(term)) score += 8;
      if (bTrackName.startsWith(term)) score += 5;
      if (bArtistName.startsWith(term)) score += 3;
      
      return score;
    }, 0);
    
    if (aRelevance !== bRelevance) return bRelevance - aRelevance;
    return b.popularity - a.popularity;
  });
  
  const limitedResults = results.slice(0, 10);
  console.log(`✅ Found ${limitedResults.length} tracks in mock database`);
  
  return limitedResults;
};

// Get track details by Spotify ID (mock)
export const getTrackById = async (trackId: string): Promise<SpotifyTrack | null> => {
  console.log(`🔍 Getting track by ID: ${trackId}`);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const track = MOCK_TRACKS_DATABASE.find(t => t.id === trackId);
  
  if (track) {
    console.log(`✅ Found track: ${track.name} by ${track.artists[0].name}`);
    return track;
  }
  
  console.log(`❌ Track not found: ${trackId}`);
  return null;
};

// Get track by URL (mock)
export const getTrackByUrl = async (url: string): Promise<SpotifyTrack | null> => {
  console.log(`🔍 Getting track by URL: ${url}`);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const track = URL_TO_TRACK_MAP.get(url);
  
  if (track) {
    console.log(`✅ Found track from URL: ${track.name} by ${track.artists[0].name}`);
    return track;
  }
  
  console.log(`❌ Track not found for URL: ${url}`);
  return null;
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

// Check if we have this track in our mock database
export const hasTrackInDatabase = (url: string): boolean => {
  return URL_TO_TRACK_MAP.has(url);
};

// Get all available tracks (for debugging)
export const getAllMockTracks = (): SpotifyTrack[] => {
  return [...MOCK_TRACKS_DATABASE];
};

// Mock function - always returns false since we're not using real API
export const isSpotifyAvailable = async (): Promise<boolean> => {
  return false; // Always false for mock mode
};

console.log(`🎵 Mock Spotify Service initialized with ${MOCK_TRACKS_DATABASE.length} tracks`);