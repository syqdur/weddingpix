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
import { MusicRequest, SpotifyTrack } from '../types';
import { 
  searchSpotifyTracks as searchSpotifyMock, 
  getTrackByUrl, 
  validateSpotifyUrl, 
  hasTrackInDatabase 
} from './spotifyService';

// Search function that uses mock Spotify data
export const searchSpotifyTracks = async (query: string): Promise<SpotifyTrack[]> => {
  console.log(`🔍 Searching for: "${query}"`);
  
  try {
    // Use mock Spotify service
    const results = await searchSpotifyMock(query);
    console.log(`✅ Found ${results.length} tracks from mock database`);
    return results;
    
  } catch (error) {
    console.error('❌ Mock search failed:', error);
    return [];
  }
};

// Add music request with track data
export const addMusicRequest = async (
  track: SpotifyTrack,
  userName: string,
  deviceId: string,
  message?: string
): Promise<void> => {
  try {
    console.log(`🎵 Adding music request: ${track.name} by ${track.artists[0].name}`);

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

// Add music request from Spotify URL
export const addMusicRequestFromUrl = async (
  spotifyUrl: string,
  userName: string,
  deviceId: string,
  message?: string
): Promise<void> => {
  try {
    console.log(`🔗 Adding music request from URL: ${spotifyUrl}`);
    
    // Validate URL
    if (!validateSpotifyUrl(spotifyUrl)) {
      throw new Error('Ungültige Spotify-URL. Bitte verwende einen Link zu einem einzelnen Song.');
    }

    // Check if we have this track in our mock database
    if (!hasTrackInDatabase(spotifyUrl)) {
      throw new Error('Dieser Song ist nicht in unserer Demo-Datenbank verfügbar. Versuche einen der vorgeschlagenen Songs oder verwende die Suchfunktion.');
    }

    // Get track details from mock database
    const track = await getTrackByUrl(spotifyUrl);
    if (!track) {
      throw new Error('Song konnte nicht aus der Demo-Datenbank geladen werden.');
    }

    console.log(`✅ Found track from URL: ${track.name} by ${track.artists[0].name}`);

    // Add the request
    await addMusicRequest(track, userName, deviceId, message);
    
  } catch (error) {
    console.error('❌ Error adding music request from URL:', error);
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
        console.log('👎 Vote removed');
      } else {
        // Add vote
        await updateDoc(requestRef, {
          votes: increment(1),
          votedBy: [...votedBy, deviceId]
        });
        console.log('👍 Vote added');
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

console.log('🎵 Music Service initialized with mock Spotify integration');