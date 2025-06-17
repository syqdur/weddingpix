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
  searchSpotifyTracks, 
  getTrackByUrl, 
  validateSpotifyUrl,
  getValidAccessToken,
  getSelectedPlaylist,
  addTracksToPlaylist,
  removeTracksFromPlaylist,
  isSpotifyAuthenticated
} from './spotifyAuthService';

// Check for duplicate songs
const checkForDuplicate = async (spotifyId: string): Promise<boolean> => {
  try {
    const q = query(
      collection(db, 'music_requests'),
      where('spotifyId', '==', spotifyId)
    );
    
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('❌ Error checking for duplicates:', error);
    return false;
  }
};

// Try to add to Spotify playlist
const tryAddToSpotifyPlaylist = async (musicRequest: MusicRequest): Promise<void> => {
  try {
    console.log(`🎯 === ATTEMPTING SPOTIFY PLAYLIST INTEGRATION ===`);
    console.log(`🎵 Song: "${musicRequest.songTitle}" by ${musicRequest.artist}`);
    
    if (!musicRequest.spotifyId) {
      console.log(`⚠️ Song has no Spotify ID - cannot add to playlist`);
      return;
    }
    
    // Check for Spotify authentication
    const isAuthenticated = isSpotifyAuthenticated();
    
    if (!isAuthenticated) {
      console.log(`ℹ️ No Spotify authentication available`);
      return;
    }
    
    // Get selected playlist
    const selectedPlaylist = getSelectedPlaylist();
    
    if (!selectedPlaylist) {
      console.log(`ℹ️ No playlist selected`);
      return;
    }
    
    console.log(`✅ Adding to playlist: ${selectedPlaylist.name} (${selectedPlaylist.id})`);
    
    // Add to playlist
    await addTracksToPlaylist(selectedPlaylist.id, [`spotify:track:${musicRequest.spotifyId}`]);
    
    console.log(`🎉 SUCCESS: Song automatically added to Spotify playlist!`);
    
    // Update request status to approved
    await updateDoc(doc(db, 'music_requests', musicRequest.id), {
      status: 'approved'
    });
    
  } catch (error) {
    console.error('❌ Error with Spotify playlist integration:', error);
    // Don't throw - song should still be added to requests even if Spotify fails
  }
};

// Add music request
export const addMusicRequest = async (
  track: SpotifyTrack,
  userName: string,
  deviceId: string
): Promise<void> => {
  try {
    console.log(`🎵 === ADDING MUSIC REQUEST ===`);
    console.log(`🎵 Song: "${track.name}" by ${track.artists[0].name}`);
    console.log(`👤 User: ${userName} (${deviceId})`);

    // Validate track data
    if (!track.name || !track.artists || track.artists.length === 0) {
      throw new Error('Ungültige Track-Daten');
    }

    // Check for duplicates
    if (track.id) {
      const isDuplicate = await checkForDuplicate(track.id);
      if (isDuplicate) {
        throw new Error('Song befindet sich bereits in der Playlist');
      }
    }

    const musicRequest: Omit<MusicRequest, 'id'> = {
      songTitle: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      album: track.album?.name || 'Unknown Album',
      spotifyUrl: track.external_urls?.spotify || '',
      spotifyId: track.id,
      spotifyUri: track.uri,
      requestedBy: userName,
      deviceId: deviceId,
      requestedAt: new Date().toISOString(),
      message: '',
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

    // Try to add to Spotify playlist
    const completeRequest: MusicRequest = {
      ...musicRequest,
      id: docRef.id
    };
    
    await tryAddToSpotifyPlaylist(completeRequest);
    
  } catch (error) {
    console.error('❌ Error adding music request:', error);
    throw error;
  }
};

// Add from URL
export const addMusicRequestFromUrl = async (
  spotifyUrl: string,
  userName: string,
  deviceId: string
): Promise<void> => {
  try {
    console.log(`🔗 === ADDING FROM SPOTIFY URL ===`);
    console.log(`🔗 URL: ${spotifyUrl}`);
    
    // Validate URL
    if (!validateSpotifyUrl(spotifyUrl)) {
      throw new Error('Ungültige Spotify-URL. Bitte verwende einen Link zu einem einzelnen Song.');
    }

    console.log(`🔍 Fetching track details from Spotify...`);
    
    // Get track details from Spotify
    const track = await getTrackByUrl(spotifyUrl);
    if (!track) {
      throw new Error('Song konnte nicht von Spotify geladen werden. Überprüfe den Link und versuche es erneut.');
    }

    console.log(`✅ Found track: "${track.name}" by ${track.artists[0].name}`);

    // Add the request
    await addMusicRequest(track, userName, deviceId);
    
  } catch (error) {
    console.error('❌ Error adding music request from URL:', error);
    throw error;
  }
};

// Load music requests
export const loadMusicRequests = (callback: (requests: MusicRequest[]) => void): (() => void) => {
  console.log(`🎵 === SUBSCRIBING TO MUSIC REQUESTS ===`);
  
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
      
      return request;
    });
    
    // Sort by votes (descending) then by date (descending)
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
    console.log(`🗑️ === DELETING MUSIC REQUEST ===`);
    console.log(`🗑️ Request ID: ${requestId}`);
    
    // Get request data before deletion
    const requestDoc = await getDocs(query(
      collection(db, 'music_requests'),
      where('__name__', '==', requestId)
    ));
    
    let requestData: MusicRequest | null = null;
    
    if (!requestDoc.empty) {
      requestData = {
        id: requestDoc.docs[0].id,
        ...requestDoc.docs[0].data()
      } as MusicRequest;
      
      console.log(`🎵 Found request: "${requestData.songTitle}" by ${requestData.artist}`);
      console.log(`🔗 Spotify ID: ${requestData.spotifyId || 'none'}`);
    }
    
    // Delete from Firestore
    await deleteDoc(doc(db, 'music_requests', requestId));
    console.log('✅ Music request deleted from Firestore');
    
    // Remove from Spotify playlist if available and has Spotify ID
    if (requestData && requestData.spotifyId) {
      try {
        console.log(`🎯 Attempting to remove from Spotify playlist...`);
        
        // Check if Spotify is authenticated
        const isAuthenticated = isSpotifyAuthenticated();
        
        if (isAuthenticated) {
          const selectedPlaylist = getSelectedPlaylist();
          
          if (selectedPlaylist) {
            await removeTracksFromPlaylist(selectedPlaylist.id, [`spotify:track:${requestData.spotifyId}`]);
            console.log(`✅ Song automatically removed from Spotify playlist!`);
          } else {
            console.log(`ℹ️ No playlist selected - only removed from requests`);
          }
        } else {
          console.log(`ℹ️ Spotify not authenticated - only removed from requests`);
        }
        
      } catch (playlistError) {
        console.error('❌ Error removing from Spotify playlist:', playlistError);
        // Continue anyway - song is still deleted from requests
      }
    }
    
    console.log(`🗑️ === DELETION COMPLETE ===`);
    
  } catch (error) {
    console.error('❌ Error deleting music request:', error);
    throw error;
  }
};

// Bulk delete multiple music requests
export const bulkDeleteMusicRequests = async (requestIds: string[]): Promise<{success: number, errors: string[]}> => {
  console.log(`🗑️ === BULK DELETING ${requestIds.length} MUSIC REQUESTS ===`);
  
  const result = {
    success: 0,
    errors: [] as string[]
  };
  
  for (const requestId of requestIds) {
    try {
      await deleteMusicRequest(requestId);
      result.success++;
      console.log(`✅ Successfully deleted request: ${requestId}`);
    } catch (error) {
      console.error(`❌ Error deleting request ${requestId}:`, error);
      result.errors.push(`${requestId}: ${error.message || 'Unknown error'}`);
    }
  }
  
  console.log(`🗑️ === BULK DELETION COMPLETE ===`);
  console.log(`✅ Success: ${result.success} / ${requestIds.length}`);
  console.log(`❌ Errors: ${result.errors.length}`);
  
  return result;
};