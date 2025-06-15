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
  searchSpotifyTracks as searchSpotifyAPI, 
  getTrackByUrl, 
  validateSpotifyUrl,
  isSpotifyAvailable
} from './spotifyService';

// 🎵 ENHANCED SEARCH - Uses REAL Spotify API when available
export const searchSpotifyTracks = async (query: string): Promise<SpotifyTrack[]> => {
  console.log(`🔍 === ENHANCED MUSIC SEARCH ===`);
  console.log(`🔍 Query: "${query}"`);
  
  try {
    // Check if real Spotify API is available
    const spotifyAvailable = await isSpotifyAvailable();
    
    if (spotifyAvailable) {
      console.log(`🌍 Using REAL Spotify API - searching ALL tracks...`);
      const results = await searchSpotifyAPI(query);
      console.log(`✅ Found ${results.length} tracks from REAL Spotify API`);
      
      // Log some results for verification
      results.slice(0, 3).forEach((track, index) => {
        console.log(`  ${index + 1}. "${track.name}" by ${track.artists[0].name} (Real Spotify)`);
      });
      
      return results;
    } else {
      console.log(`🔄 Spotify API not available, using enhanced mock database...`);
      const results = await searchSpotifyAPI(query); // This will fallback to mock
      console.log(`✅ Found ${results.length} tracks from mock database`);
      return results;
    }
    
  } catch (error) {
    console.error('❌ Enhanced search failed:', error);
    return [];
  }
};

// Add music request with enhanced validation
export const addMusicRequest = async (
  track: SpotifyTrack,
  userName: string,
  deviceId: string,
  message?: string
): Promise<void> => {
  try {
    console.log(`🎵 === ADDING MUSIC REQUEST ===`);
    console.log(`🎵 Song: "${track.name}" by ${track.artists[0].name}`);
    console.log(`👤 User: ${userName} (${deviceId})`);
    console.log(`💬 Message: ${message || 'none'}`);
    console.log(`🔗 Spotify URL: ${track.external_urls.spotify}`);

    // Validate track data
    if (!track.name || !track.artists || track.artists.length === 0) {
      throw new Error('Ungültige Track-Daten');
    }

    const musicRequest: Omit<MusicRequest, 'id'> = {
      songTitle: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      album: track.album?.name || 'Unknown Album',
      spotifyUrl: track.external_urls?.spotify || '',
      spotifyId: track.id,
      requestedBy: userName,
      deviceId: deviceId,
      requestedAt: new Date().toISOString(),
      message: message || '',
      status: 'pending',
      votes: 1, // User automatically votes for their own request
      votedBy: [deviceId],
      albumArt: track.album?.images?.[0]?.url || '',
      previewUrl: track.preview_url || '',
      duration: track.duration_ms || 0,
      popularity: track.popularity || 0
    };

    console.log(`💾 Saving to Firestore...`);
    const docRef = await addDoc(collection(db, 'music_requests'), musicRequest);
    console.log(`✅ Music request added successfully with ID: ${docRef.id}`);
    
  } catch (error) {
    console.error('❌ Error adding music request:', error);
    throw error;
  }
};

// Add music request from Spotify URL - Enhanced with real API
export const addMusicRequestFromUrl = async (
  spotifyUrl: string,
  userName: string,
  deviceId: string,
  message?: string
): Promise<void> => {
  try {
    console.log(`🔗 === ADDING FROM SPOTIFY URL ===`);
    console.log(`🔗 URL: ${spotifyUrl}`);
    
    // Validate URL
    if (!validateSpotifyUrl(spotifyUrl)) {
      throw new Error('Ungültige Spotify-URL. Bitte verwende einen Link zu einem einzelnen Song.');
    }

    console.log(`🔍 Fetching track details from Spotify...`);
    
    // Get track details from Spotify (real API or fallback)
    const track = await getTrackByUrl(spotifyUrl);
    if (!track) {
      throw new Error('Song konnte nicht von Spotify geladen werden. Überprüfe den Link und versuche es erneut.');
    }

    console.log(`✅ Found track: "${track.name}" by ${track.artists[0].name}`);

    // Add the request
    await addMusicRequest(track, userName, deviceId, message);
    
  } catch (error) {
    console.error('❌ Error adding music request from URL:', error);
    throw error;
  }
};

// Load music requests with simplified query (no index required)
export const loadMusicRequests = (callback: (requests: MusicRequest[]) => void): (() => void) => {
  console.log(`🎵 === SUBSCRIBING TO MUSIC REQUESTS ===`);
  
  // Use simple query with only one orderBy to avoid index requirement
  const q = query(
    collection(db, 'music_requests'), 
    orderBy('requestedAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    console.log(`🎵 === MUSIC REQUESTS SNAPSHOT ===`);
    console.log(`📊 Total docs: ${snapshot.docs.length}`);
    
    const requests: MusicRequest[] = snapshot.docs.map((doc, index) => {
      const data = doc.data();
      const request = {
        id: doc.id,
        ...data
      } as MusicRequest;
      
      console.log(`  ${index + 1}. "${request.songTitle}" by ${request.artist}`);
      console.log(`      👤 Requested by: ${request.requestedBy}`);
      console.log(`      📅 Date: ${request.requestedAt}`);
      console.log(`      ⭐ Status: ${request.status}`);
      console.log(`      👍 Votes: ${request.votes}`);
      
      return request;
    });
    
    // Sort in memory by votes (descending) then by date (descending)
    requests.sort((a, b) => {
      if (a.votes !== b.votes) {
        return b.votes - a.votes; // Higher votes first
      }
      return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(); // Newer first
    });
    
    console.log(`✅ Loaded and sorted ${requests.length} music requests`);
    callback(requests);
    
  }, (error) => {
    console.error('❌ Error loading music requests:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message
    });
    
    callback([]);
  });
};

// Vote for a music request
export const voteMusicRequest = async (
  requestId: string,
  deviceId: string
): Promise<void> => {
  try {
    console.log(`👍 Voting for request: ${requestId} by device: ${deviceId}`);
    
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

// Update music request status (DJ/Admin only)
export const updateMusicRequestStatus = async (
  requestId: string,
  status: MusicRequest['status']
): Promise<void> => {
  try {
    console.log(`🔄 Updating request ${requestId} status to: ${status}`);
    
    const requestRef = doc(db, 'music_requests', requestId);
    await updateDoc(requestRef, { 
      status,
      updatedAt: new Date().toISOString()
    });
    
    console.log(`✅ Music request status updated to: ${status}`);
  } catch (error) {
    console.error('❌ Error updating music request status:', error);
    throw error;
  }
};

// Delete music request
export const deleteMusicRequest = async (requestId: string): Promise<void> => {
  try {
    console.log(`🗑️ Deleting music request: ${requestId}`);
    
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
    // Use simple query and sort in memory
    const q = query(
      collection(db, 'music_requests'),
      where('status', '==', 'pending')
    );
    
    const snapshot = await getDocs(q);
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MusicRequest));
    
    // Sort by votes and popularity in memory
    requests.sort((a, b) => {
      if (a.votes !== b.votes) return b.votes - a.votes;
      return (b.popularity || 0) - (a.popularity || 0);
    });
    
    return requests;
  } catch (error) {
    console.error('❌ Error getting popular requests:', error);
    return [];
  }
};

console.log('🎵 === MUSIC SERVICE INITIALIZED ===');
console.log('🌍 Ready to search ALL Spotify tracks (when API is configured)');
console.log('🔄 Fallback to enhanced mock database available');