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

// Load music requests
export const loadMusicRequests = (callback: (requests: MusicRequest[]) => void): (() => void) => {
  console.log('🎵 Setting up music requests subscription...');
  setIsLoading(true);
  
  const q = query(
    collection(db, 'music_requests'), 
    orderBy('requestedAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    console.log(`🎵 Received ${snapshot.docs.length} music requests`);
    
    const requests: MusicRequest[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MusicRequest));
    
    // Sort by votes (descending) then by date (descending)
    requests.sort((a, b) => {
      if (a.votes !== b.votes) {
        return b.votes - a.votes; // Higher votes first
      }
      return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(); // Newer first
    });
    
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

// Delete music request
export const deleteMusicRequest = async (requestId: string): Promise<void> => {
  try {
    console.log(`🗑️ Deleting music request: ${requestId}`);
    await deleteDoc(doc(db, 'music_requests', requestId));
  } catch (error) {
    console.error('❌ Error deleting music request:', error);
    throw error;
  }
};

// Add music request
export const addMusicRequest = async (
  track: SpotifyTrack,
  userName: string,
  deviceId: string
): Promise<void> => {
  try {
    console.log(`🎵 Adding music request: ${track.name} by ${track.artists[0].name}`);
    
    // Check for duplicates
    const duplicateQuery = query(
      collection(db, 'music_requests'),
      where('spotifyId', '==', track.id)
    );
    
    const duplicateSnapshot = await getDocs(duplicateQuery);
    
    if (!duplicateSnapshot.empty) {
      throw new Error('Song befindet sich bereits in der Playlist');
    }
    
    // Add request
    await addDoc(collection(db, 'music_requests'), {
      songTitle: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      album: track.album?.name || 'Unknown Album',
      spotifyUrl: track.external_urls?.spotify || '',
      spotifyId: track.id,
      requestedBy: userName,
      deviceId: deviceId,
      requestedAt: new Date().toISOString(),
      message: '',
      status: 'approved',
      votes: 1,
      votedBy: [deviceId],
      albumArt: track.album?.images?.[0]?.url || '',
      previewUrl: track.preview_url || '',
      duration: track.duration_ms || 0,
      popularity: track.popularity || 0
    });
    
    console.log(`✅ Music request added successfully`);
  } catch (error) {
    console.error('❌ Error adding music request:', error);
    throw error;
  }
};

// Add music request from URL
export const addMusicRequestFromUrl = async (
  spotifyUrl: string,
  userName: string,
  deviceId: string
): Promise<void> => {
  try {
    console.log(`🔗 Adding music request from URL: ${spotifyUrl}`);
    
    // Validate URL
    if (!spotifyUrl.includes('spotify.com/track/')) {
      throw new Error('Ungültige Spotify-URL. Bitte verwende einen Link zu einem einzelnen Song.');
    }
    
    // Extract track ID
    const trackId = spotifyUrl.split('/track/')[1]?.split('?')[0];
    
    if (!trackId) {
      throw new Error('Konnte keine Track-ID aus der URL extrahieren.');
    }
    
    // Check for duplicates
    const duplicateQuery = query(
      collection(db, 'music_requests'),
      where('spotifyId', '==', trackId)
    );
    
    const duplicateSnapshot = await getDocs(duplicateQuery);
    
    if (!duplicateSnapshot.empty) {
      throw new Error('Song befindet sich bereits in der Playlist');
    }
    
    // Add request with minimal info (we don't have track details)
    await addDoc(collection(db, 'music_requests'), {
      songTitle: 'Spotify Track',
      artist: 'Unbekannter Künstler',
      spotifyUrl: spotifyUrl,
      spotifyId: trackId,
      requestedBy: userName,
      deviceId: deviceId,
      requestedAt: new Date().toISOString(),
      message: '',
      status: 'approved',
      votes: 1,
      votedBy: [deviceId]
    });
    
    console.log(`✅ Music request added successfully from URL`);
  } catch (error) {
    console.error('❌ Error adding music request from URL:', error);
    throw error;
  }
};

// Helper function for loading state
const setIsLoading = (loading: boolean) => {
  // This is a placeholder function that would normally update a loading state
  // In a real implementation, this would be passed as a parameter or use a state management system
  console.log(`Loading state: ${loading}`);
};