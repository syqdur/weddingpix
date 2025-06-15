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

// Spotify Web API Configuration
const SPOTIFY_CLIENT_ID = 'your_spotify_client_id'; // This would need to be configured
const SPOTIFY_CLIENT_SECRET = 'your_spotify_client_secret'; // This would need to be configured

// For demo purposes, we'll use a mock search function
// In production, you'd need proper Spotify API integration
export const searchSpotifyTracks = async (query: string): Promise<SpotifyTrack[]> => {
  // Mock data for demonstration
  const mockTracks: SpotifyTrack[] = [
    {
      id: '1',
      name: query.includes('love') ? 'Perfect' : 'Uptown Funk',
      artists: [{ name: query.includes('love') ? 'Ed Sheeran' : 'Mark Ronson ft. Bruno Mars' }],
      album: {
        name: query.includes('love') ? '÷ (Divide)' : 'Uptown Special',
        images: [
          { 
            url: query.includes('love') 
              ? 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'
              : 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
            height: 300,
            width: 300
          }
        ]
      },
      external_urls: {
        spotify: `https://open.spotify.com/track/${query.includes('love') ? 'perfect' : 'uptown-funk'}`
      },
      preview_url: null,
      duration_ms: query.includes('love') ? 263000 : 269000,
      popularity: query.includes('love') ? 95 : 88
    },
    {
      id: '2',
      name: query.includes('dance') ? 'Can\'t Stop the Feeling!' : 'Thinking Out Loud',
      artists: [{ name: query.includes('dance') ? 'Justin Timberlake' : 'Ed Sheeran' }],
      album: {
        name: query.includes('dance') ? 'Trolls (Original Motion Picture Soundtrack)' : 'x (Multiply)',
        images: [
          { 
            url: query.includes('dance')
              ? 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'
              : 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
            height: 300,
            width: 300
          }
        ]
      },
      external_urls: {
        spotify: `https://open.spotify.com/track/${query.includes('dance') ? 'cant-stop-feeling' : 'thinking-out-loud'}`
      },
      preview_url: null,
      duration_ms: query.includes('dance') ? 236000 : 281000,
      popularity: query.includes('dance') ? 92 : 89
    }
  ];

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return mockTracks.filter(track => 
    track.name.toLowerCase().includes(query.toLowerCase()) ||
    track.artists[0].name.toLowerCase().includes(query.toLowerCase())
  );
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