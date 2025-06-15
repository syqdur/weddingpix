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
  increment
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { MusicRequest, SpotifyTrack, SpotifySearchResponse } from '../types';

// Enhanced mock data for better demo experience
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
  {
    id: 'marry-me',
    name: 'Marry Me',
    artists: [{ name: 'Train' }],
    album: {
      name: 'Save Me, San Francisco',
      images: [{ url: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/1z3ugFmUKoCzGsI3FaZKsP' },
    preview_url: null,
    duration_ms: 240000,
    popularity: 78
  },
  
  // Party & Tanzmusik
  {
    id: 'uptown-funk',
    name: 'Uptown Funk',
    artists: [{ name: 'Mark Ronson' }, { name: 'Bruno Mars' }],
    album: {
      name: 'Uptown Special',
      images: [{ url: 'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
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
      images: [{ url: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
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
      images: [{ url: 'https://images.pexels.com/photos/1616113/pexels-photo-1616113.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/60nZcImufyMA1MKQY3dcCH' },
    preview_url: null,
    duration_ms: 232000,
    popularity: 85
  },
  {
    id: 'shake-it-off',
    name: 'Shake It Off',
    artists: [{ name: 'Taylor Swift' }],
    album: {
      name: '1989',
      images: [{ url: 'https://images.pexels.com/photos/1729797/pexels-photo-1729797.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/0cqRj7pUJDkTCEsJkx8snD' },
    preview_url: null,
    duration_ms: 219000,
    popularity: 87
  },
  
  // Deutsche Hits
  {
    id: 'auf-uns',
    name: 'Auf uns',
    artists: [{ name: 'Andreas Bourani' }],
    album: {
      name: 'Hey',
      images: [{ url: 'https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/2tpWsVSb9UEmDRxAl1zhX1' },
    preview_url: null,
    duration_ms: 228000,
    popularity: 82
  },
  {
    id: 'lieblingsmensch',
    name: 'Lieblingsmensch',
    artists: [{ name: 'Namika' }],
    album: {
      name: 'Nador',
      images: [{ url: 'https://images.pexels.com/photos/1070850/pexels-photo-1070850.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/6JV2JOEocMgcZxYSZelKcc' },
    preview_url: null,
    duration_ms: 201000,
    popularity: 79
  },
  
  // Klassiker
  {
    id: 'sweet-caroline',
    name: 'Sweet Caroline',
    artists: [{ name: 'Neil Diamond' }],
    album: {
      name: 'Brother Love\'s Travelling Salvation Show',
      images: [{ url: 'https://images.pexels.com/photos/1444424/pexels-photo-1444424.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', height: 300, width: 300 }]
    },
    external_urls: { spotify: 'https://open.spotify.com/track/38zsOOcu31XbbYj9BIPUF1' },
    preview_url: null,
    duration_ms: 201000,
    popularity: 84
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
    popularity: 86
  }
];

// Improved search function with better matching
export const searchSpotifyTracks = async (query: string): Promise<SpotifyTrack[]> => {
  console.log(`🔍 Searching for: "${query}"`);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const searchTerms = query.toLowerCase().split(' ');
  
  const results = MOCK_TRACKS_DATABASE.filter(track => {
    const trackName = track.name.toLowerCase();
    const artistName = track.artists.map(a => a.name.toLowerCase()).join(' ');
    const albumName = track.album.name.toLowerCase();
    const searchText = `${trackName} ${artistName} ${albumName}`;
    
    // Check if any search term matches
    return searchTerms.some(term => 
      searchText.includes(term) || 
      trackName.includes(term) || 
      artistName.includes(term)
    );
  });
  
  // Sort by popularity and relevance
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
  
  console.log(`✅ Found ${results.length} tracks for "${query}"`);
  return results.slice(0, 10); // Limit to top 10 results
};

// Add a music request
export const addMusicRequest = async (
  track: SpotifyTrack,
  userName: string,
  deviceId: string,
  message?: string
): Promise<void> => {
  try {
    const musicRequest: Omit<MusicRequest, 'id'> = {
      songTitle: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      album: track.album.name,
      spotifyUrl: track.external_urls.spotify,
      spotifyId: track.id,
      requestedBy: userName,
      deviceId: deviceId,
      requestedAt: new Date().toISOString(),
      message: message || '',
      status: 'pending',
      votes: 1, // User automatically votes for their own request
      votedBy: [deviceId],
      albumArt: track.album.images[0]?.url || '',
      previewUrl: track.preview_url || '',
      duration: track.duration_ms,
      popularity: track.popularity
    };

    await addDoc(collection(db, 'music_requests'), musicRequest);
    console.log('✅ Music request added successfully');
  } catch (error) {
    console.error('❌ Error adding music request:', error);
    throw error;
  }
};

// Load music requests with real-time updates
export const loadMusicRequests = (callback: (requests: MusicRequest[]) => void): (() => void) => {
  const q = query(
    collection(db, 'music_requests'), 
    orderBy('votes', 'desc'),
    orderBy('requestedAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const requests: MusicRequest[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MusicRequest));
    
    console.log(`🎵 Loaded ${requests.length} music requests`);
    callback(requests);
    
  }, (error) => {
    console.error('❌ Error loading music requests:', error);
    callback([]);
  });
};

// Vote for a music request
export const voteMusicRequest = async (
  requestId: string,
  deviceId: string
): Promise<void> => {
  try {
    const requestRef = doc(db, 'music_requests', requestId);
    
    // Check if user already voted
    const requestDoc = await getDocs(query(
      collection(db, 'music_requests'),
      where('__name__', '==', requestId)
    ));
    
    if (!requestDoc.empty) {
      const requestData = requestDoc.docs[0].data();
      const votedBy = requestData.votedBy || [];
      
      if (votedBy.includes(deviceId)) {
        // Remove vote
        await updateDoc(requestRef, {
          votes: increment(-1),
          votedBy: votedBy.filter((id: string) => id !== deviceId)
        });
      } else {
        // Add vote
        await updateDoc(requestRef, {
          votes: increment(1),
          votedBy: [...votedBy, deviceId]
        });
      }
    }
  } catch (error) {
    console.error('❌ Error voting for music request:', error);
    throw error;
  }
};

// Update music request status (admin only)
export const updateMusicRequestStatus = async (
  requestId: string,
  status: MusicRequest['status']
): Promise<void> => {
  try {
    const requestRef = doc(db, 'music_requests', requestId);
    await updateDoc(requestRef, { status });
    console.log(`✅ Music request status updated to: ${status}`);
  } catch (error) {
    console.error('❌ Error updating music request status:', error);
    throw error;
  }
};

// Delete music request
export const deleteMusicRequest = async (requestId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'music_requests', requestId));
    console.log('✅ Music request deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting music request:', error);
    throw error;
  }
};

// Get popular requests for DJ dashboard
export const getPopularRequests = async (): Promise<MusicRequest[]> => {
  try {
    const q = query(
      collection(db, 'music_requests'),
      where('status', '==', 'pending'),
      orderBy('votes', 'desc'),
      orderBy('popularity', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MusicRequest));
  } catch (error) {
    console.error('❌ Error getting popular requests:', error);
    return [];
  }
};