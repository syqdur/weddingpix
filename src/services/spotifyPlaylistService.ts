import { MusicRequest } from '../types';

// Enhanced Spotify Playlist Integration Service
// Unterstützt sowohl das Hinzufügen zu bestehenden Playlists als auch Export-Funktionen

export interface PlaylistExport {
  name: string;
  description: string;
  tracks: {
    name: string;
    artist: string;
    spotifyUrl: string;
    spotifyId: string;
  }[];
  spotifyPlaylistUrl?: string;
  exportedAt: string;
}

export interface SpotifyAuthConfig {
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

// 🎯 DEINE HOCHZEITS-PLAYLIST
const WEDDING_PLAYLIST_ID = '5IkTeF1ydIrwQ4VZxkCtdO'; // Aus der URL extrahiert
const WEDDING_PLAYLIST_URL = 'https://open.spotify.com/playlist/5IkTeF1ydIrwQ4VZxkCtdO';

// Spotify OAuth Configuration für Playlist-Management
const SPOTIFY_AUTH_CONFIG: SpotifyAuthConfig = {
  clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID || '',
  redirectUri: window.location.origin + '/spotify-callback',
  scopes: [
    'playlist-modify-public',
    'playlist-modify-private',
    'playlist-read-private',
    'user-read-private'
  ]
};

// Token Management für User Authentication
let userAccessToken: string | null = null;
let userTokenExpiry: number | null = null;

// === SPOTIFY USER AUTHENTICATION ===

// Handle OAuth callback (call this when page loads)
export const handleSpotifyCallback = (): boolean => {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  
  const accessToken = params.get('access_token');
  const expiresIn = params.get('expires_in');
  
  if (accessToken && expiresIn) {
    console.log('✅ Spotify OAuth successful');
    
    userAccessToken = accessToken;
    userTokenExpiry = Date.now() + (parseInt(expiresIn) * 1000);
    
    // Store in localStorage for persistence
    localStorage.setItem('spotify_user_token', accessToken);
    localStorage.setItem('spotify_user_token_expiry', userTokenExpiry.toString());
    
    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
    return true;
  }
  
  return false;
};

// Initialize on page load
if (typeof window !== 'undefined') {
  // Check for OAuth callback
  if (window.location.hash.includes('access_token')) {
    handleSpotifyCallback();
  }
  
  // Restore token from localStorage
  const storedToken = localStorage.getItem('spotify_user_token');
  const storedExpiry = localStorage.getItem('spotify_user_token_expiry');
  
  if (storedToken && storedExpiry && Date.now() < parseInt(storedExpiry)) {
    userAccessToken = storedToken;
    userTokenExpiry = parseInt(storedExpiry);
    console.log('🔐 Restored Spotify session');
  }
}

// Generiere Spotify Authorization URL
export const generateSpotifyAuthUrl = (): string => {
  const params = new URLSearchParams({
    client_id: SPOTIFY_AUTH_CONFIG.clientId,
    response_type: 'token',
    redirect_uri: SPOTIFY_AUTH_CONFIG.redirectUri,
    scope: SPOTIFY_AUTH_CONFIG.scopes.join(' '),
    show_dialog: 'true'
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
};

// Starte Spotify Anmeldung
export const initiateSpotifyLogin = (): void => {
  console.log(`🔐 === STARTING SPOTIFY LOGIN ===`);
  
  if (!SPOTIFY_AUTH_CONFIG.clientId) {
    alert('❌ Spotify Client ID nicht konfiguriert. Bitte .env Datei prüfen.');
    return;
  }

  const authUrl = generateSpotifyAuthUrl();
  console.log(`🔗 Redirecting to Spotify auth...`);
  
  // Redirect to Spotify OAuth
  window.location.href = authUrl;
};

// Prüfe ob User eingeloggt ist
export const isUserLoggedIn = (): boolean => {
  const token = localStorage.getItem('spotify_user_token');
  const expiry = localStorage.getItem('spotify_user_token_expiry');
  
  if (token && expiry && Date.now() < parseInt(expiry)) {
    userAccessToken = token;
    userTokenExpiry = parseInt(expiry);
    return true;
  }
  
  return false;
};

// Logout User
export const logoutSpotifyUser = (): void => {
  localStorage.removeItem('spotify_user_token');
  localStorage.removeItem('spotify_user_token_expiry');
  userAccessToken = null;
  userTokenExpiry = null;
  console.log('🔐 User logged out from Spotify');
};

// === PLAYLIST MANAGEMENT ===

// Hole User's Playlists
export const getUserPlaylists = async (): Promise<any[]> => {
  if (!userAccessToken) {
    throw new Error('Nicht bei Spotify angemeldet');
  }

  try {
    console.log(`📋 === FETCHING USER PLAYLISTS ===`);
    
    const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
      headers: {
        'Authorization': `Bearer ${userAccessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        logoutSpotifyUser();
        throw new Error('Spotify-Anmeldung abgelaufen. Bitte erneut anmelden.');
      }
      throw new Error(`Fehler beim Laden der Playlists: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Found ${data.items.length} user playlists`);
    
    return data.items;
    
  } catch (error) {
    console.error('❌ Error fetching user playlists:', error);
    throw error;
  }
};

// 🎯 NEUE FUNKTION: Hole spezifische Hochzeits-Playlist Details
export const getWeddingPlaylistDetails = async (): Promise<any | null> => {
  if (!userAccessToken) {
    throw new Error('Nicht bei Spotify angemeldet');
  }

  try {
    console.log(`🎯 === FETCHING WEDDING PLAYLIST DETAILS ===`);
    console.log(`📋 Playlist ID: ${WEDDING_PLAYLIST_ID}`);
    
    const response = await fetch(`https://api.spotify.com/v1/playlists/${WEDDING_PLAYLIST_ID}`, {
      headers: {
        'Authorization': `Bearer ${userAccessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        logoutSpotifyUser();
        throw new Error('Spotify-Anmeldung abgelaufen. Bitte erneut anmelden.');
      }
      if (response.status === 404) {
        throw new Error('Hochzeits-Playlist nicht gefunden oder nicht zugänglich.');
      }
      throw new Error(`Fehler beim Laden der Playlist: ${response.status}`);
    }

    const playlist = await response.json();
    console.log(`✅ Wedding playlist loaded: "${playlist.name}" (${playlist.tracks.total} tracks)`);
    
    return playlist;
    
  } catch (error) {
    console.error('❌ Error fetching wedding playlist:', error);
    throw error;
  }
};

// Füge Tracks zu bestehender Playlist hinzu
export const addTracksToPlaylist = async (
  playlistId: string, 
  trackUris: string[]
): Promise<boolean> => {
  if (!userAccessToken) {
    throw new Error('Nicht bei Spotify angemeldet');
  }

  try {
    console.log(`➕ === ADDING TRACKS TO PLAYLIST ===`);
    console.log(`📋 Playlist ID: ${playlistId}`);
    console.log(`🎵 Tracks: ${trackUris.length}`);
    
    // Spotify API erlaubt max 100 Tracks pro Request
    const chunks = [];
    for (let i = 0; i < trackUris.length; i += 100) {
      chunks.push(trackUris.slice(i, i + 100));
    }

    for (const chunk of chunks) {
      const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: chunk
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          logoutSpotifyUser();
          throw new Error('Spotify-Anmeldung abgelaufen. Bitte erneut anmelden.');
        }
        if (response.status === 403) {
          throw new Error('Keine Berechtigung zum Bearbeiten dieser Playlist. Bist du der Besitzer?');
        }
        throw new Error(`Fehler beim Hinzufügen der Tracks: ${response.status}`);
      }

      console.log(`✅ Added ${chunk.length} tracks to playlist`);
    }

    console.log(`🎉 Successfully added all ${trackUris.length} tracks to playlist`);
    return true;
    
  } catch (error) {
    console.error('❌ Error adding tracks to playlist:', error);
    throw error;
  }
};

// 🎯 NEUE FUNKTION: Füge Songs direkt zur Hochzeits-Playlist hinzu
export const addToWeddingPlaylist = async (
  approvedRequests: MusicRequest[]
): Promise<{ success: number; failed: number; errors: string[] }> => {
  console.log(`🎯 === ADDING TO WEDDING PLAYLIST ===`);
  console.log(`📋 Wedding Playlist ID: ${WEDDING_PLAYLIST_ID}`);
  console.log(`🎵 Approved Requests: ${approvedRequests.length}`);

  // Filter nur Songs mit Spotify IDs
  const spotifyTracks = approvedRequests.filter(request => 
    request.spotifyId && request.status === 'approved'
  );

  if (spotifyTracks.length === 0) {
    throw new Error('Keine genehmigten Spotify-Tracks gefunden');
  }

  console.log(`🎵 Found ${spotifyTracks.length} Spotify tracks to add to wedding playlist`);

  // Erstelle Spotify URIs
  const trackUris = spotifyTracks.map(track => `spotify:track:${track.spotifyId}`);

  try {
    await addTracksToPlaylist(WEDDING_PLAYLIST_ID, trackUris);
    
    return {
      success: spotifyTracks.length,
      failed: 0,
      errors: []
    };
    
  } catch (error) {
    console.error('❌ Failed to add tracks to wedding playlist:', error);
    
    return {
      success: 0,
      failed: spotifyTracks.length,
      errors: [error.message || 'Unbekannter Fehler']
    };
  }
};

// Füge genehmigte Musikwünsche zu Playlist hinzu
export const addApprovedRequestsToPlaylist = async (
  playlistId: string,
  approvedRequests: MusicRequest[]
): Promise<{ success: number; failed: number; errors: string[] }> => {
  console.log(`🎵 === ADDING APPROVED REQUESTS TO PLAYLIST ===`);
  console.log(`📋 Playlist: ${playlistId}`);
  console.log(`🎯 Requests: ${approvedRequests.length}`);

  // Filter nur Songs mit Spotify IDs
  const spotifyTracks = approvedRequests.filter(request => 
    request.spotifyId && request.status === 'approved'
  );

  if (spotifyTracks.length === 0) {
    throw new Error('Keine genehmigten Spotify-Tracks gefunden');
  }

  console.log(`🎵 Found ${spotifyTracks.length} Spotify tracks to add`);

  // Erstelle Spotify URIs
  const trackUris = spotifyTracks.map(track => `spotify:track:${track.spotifyId}`);

  try {
    await addTracksToPlaylist(playlistId, trackUris);
    
    return {
      success: spotifyTracks.length,
      failed: 0,
      errors: []
    };
    
  } catch (error) {
    console.error('❌ Failed to add tracks to playlist:', error);
    
    return {
      success: 0,
      failed: spotifyTracks.length,
      errors: [error.message || 'Unbekannter Fehler']
    };
  }
};

// 🎯 NEUE FUNKTION: Öffne die Hochzeits-Playlist direkt
export const openWeddingPlaylist = (): void => {
  console.log(`🎯 Opening wedding playlist: ${WEDDING_PLAYLIST_URL}`);
  window.open(WEDDING_PLAYLIST_URL, '_blank');
};

// 🎯 NEUE FUNKTION: Hole Wedding Playlist ID
export const getWeddingPlaylistId = (): string => {
  return WEDDING_PLAYLIST_ID;
};

// 🎯 NEUE FUNKTION: Hole Wedding Playlist URL
export const getWeddingPlaylistUrl = (): string => {
  return WEDDING_PLAYLIST_URL;
};

// === EXISTING EXPORT FUNCTIONS (unchanged) ===

export const generateSpotifyPlaylistUrl = (approvedRequests: MusicRequest[]): string => {
  console.log(`🎵 === GENERATING SPOTIFY PLAYLIST URL ===`);
  console.log(`📊 Approved requests: ${approvedRequests.length}`);
  
  const spotifyTracks = approvedRequests.filter(request => 
    request.spotifyId && request.spotifyUrl
  );
  
  console.log(`🎯 Songs with Spotify IDs: ${spotifyTracks.length}`);
  
  if (spotifyTracks.length === 0) {
    console.warn('⚠️ No Spotify tracks found');
    return '';
  }
  
  const spotifyUris = spotifyTracks.map(track => `spotify:track:${track.spotifyId}`);
  const playlistUrl = `https://open.spotify.com/playlist/create?uris=${spotifyUris.join(',')}`;
  
  console.log(`✅ Generated playlist URL with ${spotifyUris.length} tracks`);
  return playlistUrl;
};

export const createPlaylistExport = (approvedRequests: MusicRequest[]): PlaylistExport => {
  console.log(`📋 === CREATING PLAYLIST EXPORT ===`);
  
  const today = new Date().toLocaleDateString('de-DE');
  const playlistName = `Hochzeit Kristin & Maurizio - ${today}`;
  
  const tracks = approvedRequests
    .filter(request => request.spotifyId && request.spotifyUrl)
    .map(request => ({
      name: request.songTitle,
      artist: request.artist,
      spotifyUrl: request.spotifyUrl!,
      spotifyId: request.spotifyId!
    }));
  
  const playlistExport: PlaylistExport = {
    name: playlistName,
    description: `Genehmigte Musikwünsche für die Hochzeit von Kristin & Maurizio am 12.07.2025. Erstellt am ${today} mit ${tracks.length} Songs.`,
    tracks,
    spotifyPlaylistUrl: generateSpotifyPlaylistUrl(approvedRequests),
    exportedAt: new Date().toISOString()
  };
  
  console.log(`✅ Playlist export created: "${playlistName}" with ${tracks.length} tracks`);
  return playlistExport;
};

export const downloadPlaylistAsJson = (playlistExport: PlaylistExport): void => {
  console.log(`💾 === DOWNLOADING PLAYLIST AS JSON ===`);
  
  const jsonData = JSON.stringify(playlistExport, null, 2);
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `Hochzeit_Playlist_${new Date().toISOString().slice(0, 10)}.json`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
  console.log(`✅ Playlist JSON downloaded`);
};

export const downloadPlaylistAsM3U = (playlistExport: PlaylistExport): void => {
  console.log(`💾 === DOWNLOADING PLAYLIST AS M3U ===`);
  
  let m3uContent = '#EXTM3U\n';
  m3uContent += `#PLAYLIST:${playlistExport.name}\n\n`;
  
  playlistExport.tracks.forEach(track => {
    m3uContent += `#EXTINF:-1,${track.artist} - ${track.name}\n`;
    m3uContent += `${track.spotifyUrl}\n\n`;
  });
  
  const blob = new Blob([m3uContent], { type: 'audio/x-mpegurl' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `Hochzeit_Playlist_${new Date().toISOString().slice(0, 10)}.m3u`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
  console.log(`✅ Playlist M3U downloaded`);
};

export const openSpotifyPlaylist = (approvedRequests: MusicRequest[]): void => {
  console.log(`🎵 === OPENING SPOTIFY PLAYLIST ===`);
  
  const playlistUrl = generateSpotifyPlaylistUrl(approvedRequests);
  
  if (!playlistUrl) {
    alert('❌ Keine Spotify-Songs zum Erstellen einer Playlist gefunden.');
    return;
  }
  
  window.open(playlistUrl, '_blank');
  console.log(`✅ Opened Spotify playlist with ${approvedRequests.length} tracks`);
};

export const generateTrackList = (approvedRequests: MusicRequest[]): string => {
  console.log(`📝 === GENERATING TRACK LIST ===`);
  
  const tracks = approvedRequests.filter(request => request.spotifyId);
  
  let trackList = `🎵 HOCHZEIT PLAYLIST - KRISTIN & MAURIZIO\n`;
  trackList += `📅 Erstellt am: ${new Date().toLocaleDateString('de-DE')}\n`;
  trackList += `🎯 ${tracks.length} genehmigte Songs\n\n`;
  
  tracks.forEach((track, index) => {
    trackList += `${index + 1}. "${track.songTitle}" - ${track.artist}\n`;
    trackList += `   🔗 ${track.spotifyUrl}\n`;
    trackList += `   👤 Gewünscht von: ${track.requestedBy}\n`;
    if (track.message) {
      trackList += `   💬 "${track.message}"\n`;
    }
    trackList += `\n`;
  });
  
  trackList += `\n🎉 Viel Spaß bei der Hochzeit!\n`;
  trackList += `💕 Kristin & Maurizio\n`;
  
  console.log(`✅ Track list generated with ${tracks.length} songs`);
  return trackList;
};

export const copyTrackListToClipboard = async (approvedRequests: MusicRequest[]): Promise<boolean> => {
  try {
    const trackList = generateTrackList(approvedRequests);
    await navigator.clipboard.writeText(trackList);
    console.log(`✅ Track list copied to clipboard`);
    return true;
  } catch (error) {
    console.error('❌ Failed to copy to clipboard:', error);
    return false;
  }
};

console.log('🎯 === ENHANCED SPOTIFY PLAYLIST SERVICE INITIALIZED ===');
console.log(`📋 Wedding Playlist ID: ${WEDDING_PLAYLIST_ID}`);
console.log(`🔗 Wedding Playlist URL: ${WEDDING_PLAYLIST_URL}`);
console.log('🎯 Ready to add tracks to your wedding playlist');
console.log('📋 Supports secure OAuth authentication');