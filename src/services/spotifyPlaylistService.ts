import { MusicRequest } from '../types';

// Enhanced Spotify Playlist Integration Service
// ALLE GÄSTE NUTZEN EINEN SPOTIFY-ACCOUNT für die Hochzeits-Playlist

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

// 🎯 DEINE HOCHZEITS-PLAYLIST
const WEDDING_PLAYLIST_ID = '5IkTeF1ydIrwQ4VZxkCtdO'; // Aus der URL extrahiert
const WEDDING_PLAYLIST_URL = 'https://open.spotify.com/playlist/5IkTeF1ydIrwQ4VZxkCtdO';

// 🔐 SHARED SPOTIFY ACCESS - Alle Gäste nutzen deinen Account
// Diese Tokens werden einmalig von dir gesetzt und von allen Gästen verwendet
let sharedAccessToken: string | null = null;
let sharedTokenExpiry: number | null = null;

// === SHARED SPOTIFY AUTHENTICATION (Admin Setup) ===

// Setze den geteilten Access Token (nur für Admin/Mauro)
export const setSharedSpotifyToken = (accessToken: string, expiresIn: number): void => {
  console.log(`🔐 === SETTING SHARED SPOTIFY TOKEN ===`);
  console.log(`⏰ Token expires in: ${Math.floor(expiresIn / 3600)} hours`);
  
  sharedAccessToken = accessToken;
  sharedTokenExpiry = Date.now() + (expiresIn * 1000) - 60000; // 1 minute safety margin
  
  // Store in localStorage for persistence across page reloads
  localStorage.setItem('shared_spotify_token', accessToken);
  localStorage.setItem('shared_spotify_token_expiry', sharedTokenExpiry.toString());
  
  console.log(`✅ Shared Spotify token configured successfully`);
  console.log(`🎵 All guests can now add songs to the wedding playlist!`);
};

// Prüfe ob geteilter Token verfügbar ist
export const isSharedTokenAvailable = (): boolean => {
  // Check memory first
  if (sharedAccessToken && sharedTokenExpiry && Date.now() < sharedTokenExpiry) {
    return true;
  }
  
  // Check localStorage
  const storedToken = localStorage.getItem('shared_spotify_token');
  const storedExpiry = localStorage.getItem('shared_spotify_token_expiry');
  
  if (storedToken && storedExpiry && Date.now() < parseInt(storedExpiry)) {
    sharedAccessToken = storedToken;
    sharedTokenExpiry = parseInt(storedExpiry);
    console.log('🔐 Restored shared Spotify token from storage');
    return true;
  }
  
  return false;
};

// Hole geteilten Access Token
const getSharedAccessToken = (): string | null => {
  if (!isSharedTokenAvailable()) {
    console.warn('⚠️ No shared Spotify token available');
    return null;
  }
  
  return sharedAccessToken;
};

// === ADMIN SETUP FUNCTIONS ===

// 🔧 FIXED: Generiere korrekte Spotify Authorization URL mit richtiger Redirect URI
export const generateAdminSpotifyAuthUrl = (): string => {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
  
  // 🎯 FIX: Use the exact redirect URI that's configured in your Spotify app
  // This must match EXACTLY what you set in the Spotify Developer Dashboard
  const redirectUri = `${window.location.origin}/`;
  
  console.log(`🔗 === GENERATING SPOTIFY AUTH URL ===`);
  console.log(`🔑 Client ID: ${clientId}`);
  console.log(`🔄 Redirect URI: ${redirectUri}`);
  console.log(`🌐 Current Origin: ${window.location.origin}`);
  
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'token',
    redirect_uri: redirectUri,
    scope: [
      'playlist-modify-public',
      'playlist-modify-private',
      'playlist-read-private',
      'user-read-private'
    ].join(' '),
    show_dialog: 'true'
  });

  const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
  console.log(`🔗 Generated auth URL: ${authUrl}`);
  
  return authUrl;
};

// Handle OAuth callback für Admin Setup
export const handleAdminSpotifyCallback = (): boolean => {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  
  const accessToken = params.get('access_token');
  const expiresIn = params.get('expires_in');
  const error = params.get('error');
  
  console.log(`🔐 === HANDLING SPOTIFY CALLBACK ===`);
  console.log(`🔗 Current URL: ${window.location.href}`);
  console.log(`📋 Hash: ${hash}`);
  console.log(`🔑 Access Token: ${accessToken ? 'RECEIVED' : 'MISSING'}`);
  console.log(`⏰ Expires In: ${expiresIn || 'MISSING'}`);
  console.log(`❌ Error: ${error || 'NONE'}`);
  
  if (error) {
    console.error(`❌ Spotify OAuth error: ${error}`);
    alert(`❌ Spotify Anmeldung fehlgeschlagen: ${error}\n\nBitte versuche es erneut.`);
    return false;
  }
  
  if (accessToken && expiresIn) {
    console.log('✅ Admin Spotify OAuth successful');
    
    setSharedSpotifyToken(accessToken, parseInt(expiresIn));
    
    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
    alert('✅ Spotify erfolgreich konfiguriert!\n\n🎵 Alle Gäste können jetzt Songs zur Hochzeits-Playlist hinzufügen.');
    
    return true;
  }
  
  return false;
};

// 🔧 FIXED: Verbesserte Admin Spotify Setup Funktion
export const initiateAdminSpotifySetup = (): void => {
  console.log(`🔐 === STARTING ADMIN SPOTIFY SETUP ===`);
  
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
  if (!clientId || clientId === 'your_spotify_client_id') {
    alert(`❌ Spotify Client ID nicht konfiguriert!\n\n🔧 Lösung:\n1. Erstelle eine Spotify App auf https://developer.spotify.com/dashboard\n2. Kopiere die Client ID\n3. Füge sie zur .env Datei hinzu:\n   VITE_SPOTIFY_CLIENT_ID=deine_client_id\n4. Starte den Server neu`);
    return;
  }

  // 🎯 WICHTIGE ANWEISUNG für Spotify App Setup
  const currentOrigin = window.location.origin;
  const redirectUri = `${currentOrigin}/`;
  
  const setupInstructions = `🔧 === SPOTIFY APP SETUP ERFORDERLICH ===

Bevor du fortfährst, stelle sicher, dass deine Spotify App korrekt konfiguriert ist:

📋 Spotify Developer Dashboard:
1. Gehe zu: https://developer.spotify.com/dashboard
2. Öffne deine App "WeddingPix Musikwünsche"
3. Klicke auf "Edit Settings"
4. Füge diese Redirect URI hinzu:
   ${redirectUri}

⚠️ WICHTIG: Die Redirect URI muss EXAKT so eingetragen sein!

✅ Wenn das erledigt ist, klicke OK um fortzufahren.
❌ Wenn nicht konfiguriert, bricht der Login ab.`;

  if (!window.confirm(setupInstructions)) {
    console.log('🔄 User canceled setup to configure Spotify app');
    return;
  }

  const authUrl = generateAdminSpotifyAuthUrl();
  console.log(`🔗 Redirecting to Spotify admin auth...`);
  
  // Redirect to Spotify OAuth
  window.location.href = authUrl;
};

// === PLAYLIST MANAGEMENT (Für alle Gäste) ===

// Füge Tracks zu Playlist hinzu (verwendet geteilten Token)
export const addTracksToWeddingPlaylist = async (trackUris: string[]): Promise<boolean> => {
  const token = getSharedAccessToken();
  
  if (!token) {
    throw new Error('Spotify nicht konfiguriert. Admin muss sich zuerst anmelden.');
  }

  try {
    console.log(`➕ === ADDING TRACKS TO WEDDING PLAYLIST ===`);
    console.log(`📋 Playlist ID: ${WEDDING_PLAYLIST_ID}`);
    console.log(`🎵 Tracks: ${trackUris.length}`);
    
    // Spotify API erlaubt max 100 Tracks pro Request
    const chunks = [];
    for (let i = 0; i < trackUris.length; i += 100) {
      chunks.push(trackUris.slice(i, i + 100));
    }

    for (const chunk of chunks) {
      const response = await fetch(`https://api.spotify.com/v1/playlists/${WEDDING_PLAYLIST_ID}/tracks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: chunk
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired
          localStorage.removeItem('shared_spotify_token');
          localStorage.removeItem('shared_spotify_token_expiry');
          sharedAccessToken = null;
          sharedTokenExpiry = null;
          throw new Error('Spotify-Token abgelaufen. Admin muss sich erneut anmelden.');
        }
        if (response.status === 403) {
          throw new Error('Keine Berechtigung zum Bearbeiten der Playlist.');
        }
        throw new Error(`Fehler beim Hinzufügen der Tracks: ${response.status}`);
      }

      console.log(`✅ Added ${chunk.length} tracks to wedding playlist`);
    }

    console.log(`🎉 Successfully added all ${trackUris.length} tracks to wedding playlist`);
    return true;
    
  } catch (error) {
    console.error('❌ Error adding tracks to wedding playlist:', error);
    throw error;
  }
};

// 🎯 HAUPTFUNKTION: Füge Songs direkt zur Hochzeits-Playlist hinzu (für alle Gäste)
export const addToWeddingPlaylist = async (
  approvedRequests: MusicRequest[]
): Promise<{ success: number; failed: number; errors: string[] }> => {
  console.log(`🎯 === ADDING TO WEDDING PLAYLIST (SHARED ACCESS) ===`);
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
    await addTracksToWeddingPlaylist(trackUris);
    
    return {
      success: spotifyTracks.length,
      failed: 0,
      errors: []
    };
    
  } catch (error: any) {
    console.error('❌ Failed to add tracks to wedding playlist:', error);
    
    return {
      success: 0,
      failed: spotifyTracks.length,
      errors: [error.message || 'Unbekannter Fehler']
    };
  }
};

// Hole Wedding Playlist Details (verwendet geteilten Token)
export const getWeddingPlaylistDetails = async (): Promise<any | null> => {
  const token = getSharedAccessToken();
  
  if (!token) {
    throw new Error('Spotify nicht konfiguriert. Admin muss sich zuerst anmelden.');
  }

  try {
    console.log(`🎯 === FETCHING WEDDING PLAYLIST DETAILS ===`);
    console.log(`📋 Playlist ID: ${WEDDING_PLAYLIST_ID}`);
    
    const response = await fetch(`https://api.spotify.com/v1/playlists/${WEDDING_PLAYLIST_ID}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired
        localStorage.removeItem('shared_spotify_token');
        localStorage.removeItem('shared_spotify_token_expiry');
        sharedAccessToken = null;
        sharedTokenExpiry = null;
        throw new Error('Spotify-Token abgelaufen. Admin muss sich erneut anmelden.');
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

// 🎯 Öffne die Hochzeits-Playlist direkt
export const openWeddingPlaylist = (): void => {
  console.log(`🎯 Opening wedding playlist: ${WEDDING_PLAYLIST_URL}`);
  window.open(WEDDING_PLAYLIST_URL, '_blank');
};

// 🎯 Hole Wedding Playlist URL
export const getWeddingPlaylistUrl = (): string => {
  return WEDDING_PLAYLIST_URL;
};

// === LEGACY EXPORT FUNCTIONS (für Kompatibilität) ===

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
    spotifyPlaylistUrl: WEDDING_PLAYLIST_URL,
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
  openWeddingPlaylist();
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

// === INITIALIZATION ===

// Initialize on page load
if (typeof window !== 'undefined') {
  // Check for OAuth callback (Admin setup)
  if (window.location.hash.includes('access_token')) {
    console.log('🔐 Detected Spotify OAuth callback, processing...');
    handleAdminSpotifyCallback();
  }
  
  // Restore shared token from localStorage
  const storedToken = localStorage.getItem('shared_spotify_token');
  const storedExpiry = localStorage.getItem('shared_spotify_token_expiry');
  
  if (storedToken && storedExpiry && Date.now() < parseInt(storedExpiry)) {
    sharedAccessToken = storedToken;
    sharedTokenExpiry = parseInt(storedExpiry);
    console.log('🔐 Restored shared Spotify session');
  }
}

console.log('🎯 === SHARED SPOTIFY PLAYLIST SERVICE INITIALIZED ===');
console.log(`📋 Wedding Playlist ID: ${WEDDING_PLAYLIST_ID}`);
console.log(`🔗 Wedding Playlist URL: ${WEDDING_PLAYLIST_URL}`);
console.log('🎵 All guests can add songs using shared Spotify access');
console.log('🔐 Admin setup required once, then all guests can use it');