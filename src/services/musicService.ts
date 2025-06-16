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
import { 
  addToWeddingPlaylist, 
  isSpotifyAuthenticated,
  removeFromSelectedPlaylist,
  getActivePlaylistId,
  initializeSpotifyAuth,
  syncPlaylistWithDatabase
} from './spotifyPlaylistService';

// 🎵 ENHANCED SEARCH - Uses REAL Spotify API when available
export const searchSpotifyTracks = async (query: string): Promise<SpotifyTrack[]> => {
  if (!query.trim()) return [];
  
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

// 🔍 CHECK FOR DUPLICATE SONGS
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

// 🎯 ENHANCED AUTOMATIC SPOTIFY INTEGRATION - Works for ALL users with shared auth
const tryAddToSpotifyPlaylist = async (musicRequest: MusicRequest): Promise<void> => {
  try {
    console.log(`🎯 === ATTEMPTING SPOTIFY PLAYLIST INTEGRATION ===`);
    console.log(`🎵 Song: "${musicRequest.songTitle}" by ${musicRequest.artist}`);
    console.log(`🔗 Spotify ID: ${musicRequest.spotifyId || 'none'}`);
    
    if (!musicRequest.spotifyId) {
      console.log(`⚠️ Song has no Spotify ID - cannot add to playlist`);
      return;
    }
    
    // 🌍 ENHANCED: Check for ANY Spotify authentication (local admin OR shared)
    console.log(`🔄 Checking for Spotify authentication...`);
    const authAvailable = await isSpotifyAuthenticated();
    
    if (!authAvailable) {
      console.log(`ℹ️ No Spotify authentication available (local or shared)`);
      console.log(`💡 An admin needs to set up Spotify integration first`);
      return;
    }
    
    console.log(`✅ Spotify authentication available - attempting playlist add...`);
    
    // Try to add to the wedding playlist
    const playlistResult = await addToWeddingPlaylist([musicRequest]);
    
    if (playlistResult.success > 0) {
      console.log(`🎉 SUCCESS: Song automatically added to Spotify playlist!`);
      console.log(`✅ "${musicRequest.songTitle}" is now in the wedding playlist`);
    } else if (playlistResult.errors.length > 0) {
      console.warn(`⚠️ Failed to add to Spotify playlist: ${playlistResult.errors.join(', ')}`);
      // Song is still in the requests database, just not in Spotify
    } else {
      console.log(`ℹ️ Song was not added to Spotify playlist (may already exist)`);
    }
    
  } catch (error) {
    console.error('❌ Error with Spotify playlist integration:', error);
    // Don't throw - song should still be added to requests even if Spotify fails
  }
};

// 🎯 ENHANCED SYSTEM: Song wird hinzugefügt → automatisch zur Playlist (für ALLE User mit shared auth)
export const addMusicRequest = async (
  track: SpotifyTrack,
  userName: string,
  deviceId: string,
  message?: string
): Promise<void> => {
  try {
    console.log(`🎵 === ADDING MUSIC REQUEST (ALL USERS WITH SHARED AUTH) ===`);
    console.log(`🎵 Song: "${track.name}" by ${track.artists[0].name}`);
    console.log(`👤 User: ${userName} (${deviceId})`);
    console.log(`💬 Message: ${message || 'none'}`);
    console.log(`🎯 Status: approved (automatic)`);

    // Validate track data
    if (!track.name || !track.artists || track.artists.length === 0) {
      throw new Error('Ungültige Track-Daten');
    }

    // 🔍 CHECK FOR DUPLICATES
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
      requestedBy: userName,
      deviceId: deviceId,
      requestedAt: new Date().toISOString(),
      message: message || '',
      status: 'approved', // 🎯 DIREKT ALS APPROVED MARKIERT
      votes: 1, // User automatically votes for their own request
      votedBy: [deviceId],
      albumArt: track.album?.images?.[0]?.url || '',
      previewUrl: track.preview_url || '',
      duration: track.duration_ms || 0,
      popularity: track.popularity || 0
    };

    console.log(`💾 Saving to Firestore as APPROVED...`);
    const docRef = await addDoc(collection(db, 'music_requests'), musicRequest);
    console.log(`✅ Music request added successfully with ID: ${docRef.id}`);

    // 🎯 AUTOMATICALLY TRY TO ADD TO SPOTIFY PLAYLIST (for ALL users with shared auth)
    const completeRequest: MusicRequest = {
      ...musicRequest,
      id: docRef.id
    };
    
    // This will work if an admin has set up shared authentication
    await tryAddToSpotifyPlaylist(completeRequest);
    
  } catch (error) {
    console.error('❌ Error adding music request:', error);
    throw error;
  }
};

// 🎯 ENHANCED SYSTEM: Add from URL (for ALL users with shared auth)
export const addMusicRequestFromUrl = async (
  spotifyUrl: string,
  userName: string,
  deviceId: string,
  message?: string
): Promise<void> => {
  try {
    console.log(`🔗 === ADDING FROM SPOTIFY URL (ALL USERS WITH SHARED AUTH) ===`);
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

    // Add the request (will automatically try Spotify integration with shared auth)
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
    
    // 🎯 NEW: Sync with Spotify playlist when data changes
    syncPlaylistWithDatabase(requests).catch(error => {
      console.error('❌ Error syncing playlist with database:', error);
    });
    
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

// 🗑️ DELETE MUSIC REQUEST WITH ENHANCED SPOTIFY SYNC
export const deleteMusicRequest = async (requestId: string): Promise<void> => {
  try {
    console.log(`🗑️ === DELETING MUSIC REQUEST ===`);
    console.log(`🗑️ Request ID: ${requestId}`);
    
    // 🔍 GET REQUEST DATA BEFORE DELETION
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
    
    // 🗑️ DELETE FROM FIRESTORE FIRST
    await deleteDoc(doc(db, 'music_requests', requestId));
    console.log('✅ Music request deleted from Firestore');
    
    // 🎯 AUTOMATICALLY REMOVE FROM SPOTIFY PLAYLIST (if available and has Spotify ID)
    if (requestData && requestData.spotifyId) {
      try {
        console.log(`🎯 Attempting to remove from Spotify playlist...`);
        
        // 🌍 ENHANCED: Check for ANY Spotify authentication (local admin OR shared)
        const authResult = await isSpotifyAuthenticated();
        
        if (authResult) {
          const playlistId = getActivePlaylistId();
          const removeResult = await removeFromSelectedPlaylist(playlistId, [requestData.spotifyId]);
          
          if (removeResult.success > 0) {
            console.log(`✅ Song automatically removed from Spotify playlist!`);
          } else if (removeResult.errors.length > 0) {
            console.warn(`⚠️ Failed to remove from Spotify playlist: ${removeResult.errors.join(', ')}`);
          } else {
            console.log(`ℹ️ Song was not found in Spotify playlist (already removed or not added)`);
          }
        } else {
          console.log(`ℹ️ Spotify not authenticated - only removed from requests`);
        }
        
      } catch (playlistError) {
        console.error('❌ Error removing from Spotify playlist:', playlistError);
        // Continue anyway - song is still deleted from requests
      }
    } else if (requestData && !requestData.spotifyId) {
      console.log(`ℹ️ Song has no Spotify ID - only removed from requests`);
    }
    
    console.log(`🗑️ === DELETION COMPLETE ===`);
    
  } catch (error) {
    console.error('❌ Error deleting music request:', error);
    throw error;
  }
};

console.log('🎵 === ENHANCED MUSIC SERVICE INITIALIZED ===');
console.log('🌍 Ready to search ALL Spotify tracks (when API is configured)');
console.log('🔄 Fallback to enhanced mock database available');
console.log('🎯 Songs werden automatisch zur Playlist hinzugefügt - für ALLE User mit shared auth!');
console.log('🗑️ Songs werden automatisch aus der Spotify-Playlist entfernt beim Löschen!');
console.log('🌍 Verwendet shared admin-tokens für Spotify-Integration für ALLE User!');
console.log('🔄 ✅ AUTOMATIC PLAYLIST SYNC: Removed songs from Spotify are automatically removed from database!');