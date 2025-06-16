import { MusicRequest } from '../types';

// 🔧 FIXED: Automatische Redirect URI Erkennung basierend auf aktueller URL
export const generateAdminSpotifyAuthUrl = (): string => {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
  
  // 🎯 FIX: Automatische Erkennung der korrekten Redirect URI
  const currentOrigin = window.location.origin;
  const currentPath = window.location.pathname;
  
  // Bestimme die korrekte Redirect URI basierend auf der aktuellen URL
  let redirectUri: string;
  
  if (currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')) {
    // Lokale Entwicklung - NICHT VERWENDEN (Spotify blockiert localhost)
    redirectUri = 'https://kristinundmauro.netlify.app/';
    console.warn('⚠️ Localhost detected - using production URI instead');
  } else if (currentOrigin.includes('netlify.app')) {
    // Netlify Deployment
    redirectUri = `${currentOrigin}/`;
  } else if (currentOrigin.includes('kristinundmauro.de')) {
    // Custom Domain
    redirectUri = 'https://kristinundmauro.de/';
  } else {
    // Fallback: Verwende Netlify URI
    redirectUri = 'https://kristinundmauro.netlify.app/';
  }
  
  console.log(`🔗 === GENERATING SPOTIFY AUTH URL ===`);
  console.log(`🔑 Client ID: ${clientId}`);
  console.log(`🌐 Current Origin: ${currentOrigin}`);
  console.log(`📍 Current Path: ${currentPath}`);
  console.log(`🔄 Selected Redirect URI: ${redirectUri}`);
  
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

// Export missing functions that are imported by PlaylistExportModal
export const createPlaylistExport = async (requests: MusicRequest[], accessToken: string) => {
  try {
    // Create a new playlist
    const playlistResponse = await fetch('https://api.spotify.com/v1/me/playlists', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Kristin & Mauro - ${new Date().toLocaleDateString()}`,
        description: 'Playlist created from music requests',
        public: false,
      }),
    });

    if (!playlistResponse.ok) {
      throw new Error('Failed to create playlist');
    }

    const playlist = await playlistResponse.json();
    
    // Search for tracks and add them to the playlist
    const trackUris: string[] = [];
    
    for (const request of requests) {
      try {
        const searchResponse = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(
            `${request.song} ${request.artist}`
          )}&type=track&limit=1`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.tracks.items.length > 0) {
            trackUris.push(searchData.tracks.items[0].uri);
          }
        }
      } catch (error) {
        console.error(`Failed to search for ${request.song} by ${request.artist}:`, error);
      }
    }

    // Add tracks to playlist
    if (trackUris.length > 0) {
      await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: trackUris,
        }),
      });
    }

    return {
      success: true,
      playlistUrl: playlist.external_urls.spotify,
      tracksAdded: trackUris.length,
    };
  } catch (error) {
    console.error('Error creating playlist:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const downloadPlaylistAsJson = (requests: MusicRequest[]) => {
  const data = {
    playlist: {
      name: `Kristin & Mauro - ${new Date().toLocaleDateString()}`,
      created: new Date().toISOString(),
      tracks: requests.map(request => ({
        song: request.song,
        artist: request.artist,
        requester: request.requester,
        timestamp: request.timestamp,
      })),
    },
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kristin-mauro-playlist-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadPlaylistAsM3U = (requests: MusicRequest[]) => {
  const m3uContent = [
    '#EXTM3U',
    `#PLAYLIST:Kristin & Mauro - ${new Date().toLocaleDateString()}`,
    '',
    ...requests.map(request => [
      `#EXTINF:-1,${request.artist} - ${request.song}`,
      `# Requested by: ${request.requester}`,
      `# Note: This is a placeholder - actual streaming URLs would need to be obtained from music services`,
      '',
    ]).flat(),
  ].join('\n');

  const blob = new Blob([m3uContent], { type: 'audio/x-mpegurl' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kristin-mauro-playlist-${new Date().toISOString().split('T')[0]}.m3u`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadPlaylistAsCSV = (requests: MusicRequest[]) => {
  const csvContent = [
    'Song,Artist,Requester,Timestamp',
    ...requests.map(request => 
      `"${request.song}","${request.artist}","${request.requester}","${new Date(request.timestamp).toLocaleString()}"`
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kristin-mauro-playlist-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};