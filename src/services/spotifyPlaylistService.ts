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