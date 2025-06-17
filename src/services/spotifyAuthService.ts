// Spotify Auth Service
import { generateCodeVerifier, generateCodeChallenge } from '../utils/pkce';

// Spotify API Configuration
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '4dbf85a8ca7c43d3b2ddc540194e9387';
const SPOTIFY_REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 'https://kristinundmauro.de/';

// Storage Keys for persistent authentication
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'spotify_access_token',
  REFRESH_TOKEN: 'spotify_refresh_token',
  TOKEN_EXPIRY: 'spotify_token_expiry',
  USER_INFO: 'spotify_user_info',
  CODE_VERIFIER: 'spotify_pkce_code_verifier',
  STATE: 'spotify_auth_state'
};

// Check if current URL is a Spotify callback
export const isSpotifyCallback = (): boolean => {
  const urlParams = new URLSearchParams(window.location.search);
  const hasCode = urlParams.has('code');
  const hasState = urlParams.has('state');
  
  console.log(`🔍 Checking for Spotify callback: code=${hasCode}, state=${hasState}`);
  return hasCode && hasState;
};

// Handle callback if present
export const handleCallbackIfPresent = async (): Promise<boolean> => {
  if (!isSpotifyCallback()) {
    console.log('🔍 No Spotify callback detected');
    return false;
  }
  
  console.log('🔄 Spotify callback detected, processing...');
  
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  const error = urlParams.get('error');
  
  if (error) {
    console.error('❌ Spotify auth error:', error);
    throw new Error(`Spotify Authentifizierung fehlgeschlagen: ${error}`);
  }
  
  if (!code) {
    throw new Error('Kein Authentifizierungscode erhalten. Bitte versuche es erneut.');
  }
  
  if (!state) {
    throw new Error('Kein State-Parameter erhalten. Bitte versuche es erneut.');
  }
  
  try {
    // Exchange code for tokens
    const tokenResponse = await exchangeCodeForToken(code, state);
    
    if (tokenResponse) {
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      console.log('✅ Spotify callback handled successfully');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Callback handling failed:', error);
    throw error;
  }
};

// Exchange authorization code for tokens
const exchangeCodeForToken = async (code: string, state: string): Promise<boolean> => {
  // Verify state parameter
  const storedState = localStorage.getItem(STORAGE_KEYS.STATE);
  if (state !== storedState) {
    throw new Error('Invalid state parameter. Possible CSRF attack.');
  }
  
  const codeVerifier = localStorage.getItem(STORAGE_KEYS.CODE_VERIFIER);
  if (!codeVerifier) {
    throw new Error('Missing code verifier. Please restart authentication.');
  }
  
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        grant_type: 'authorization_code',
        code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
        code_verifier: codeVerifier,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Token exchange failed: ${errorData.error_description || response.statusText}`);
    }
    
    const data = await response.json();
    
    // Store tokens
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access_token);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token);
    
    // Calculate expiry time (subtract 5 minutes for safety)
    const expiryTime = Date.now() + (data.expires_in * 1000) - 300000;
    localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
    
    // Clean up PKCE parameters
    localStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER);
    localStorage.removeItem(STORAGE_KEYS.STATE);
    
    return true;
  } catch (error) {
    console.error('Token exchange error:', error);
    throw error;
  }
};

// Initiate Spotify authentication
export const initiateSpotifyAuth = async (): Promise<void> => {
  try {
    // Generate PKCE code verifier and challenge
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    // Generate random state
    const state = Math.random().toString(36).substring(2, 15);
    
    // Store PKCE parameters
    localStorage.setItem(STORAGE_KEYS.CODE_VERIFIER, codeVerifier);
    localStorage.setItem(STORAGE_KEYS.STATE, state);
    
    // Build authorization URL
    const authUrl = new URL('https://accounts.spotify.com/authorize');
    authUrl.searchParams.append('client_id', SPOTIFY_CLIENT_ID);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', SPOTIFY_REDIRECT_URI);
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('code_challenge_method', 'S256');
    authUrl.searchParams.append('code_challenge', codeChallenge);
    authUrl.searchParams.append('scope', [
      'user-read-private',
      'user-read-email',
      'playlist-read-private',
      'playlist-read-collaborative',
      'playlist-modify-private',
      'playlist-modify-public'
    ].join(' '));
    
    // Redirect to Spotify authorization page
    window.location.href = authUrl.toString();
  } catch (error) {
    console.error('Failed to initiate Spotify auth:', error);
    throw error;
  }
};

// Check if user is authenticated with Spotify
export const isSpotifyAuthenticated = (): boolean => {
  const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const expiryTime = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
  
  if (!accessToken || !expiryTime) {
    return false;
  }
  
  // Check if token is expired
  const now = Date.now();
  const expiry = parseInt(expiryTime);
  
  return now < expiry;
};

// Get current access token
export const getSpotifyAccessToken = async (): Promise<string | null> => {
  if (!isSpotifyAuthenticated()) {
    return null;
  }
  
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
};

// Logout from Spotify
export const logoutSpotify = (): void => {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
  localStorage.removeItem(STORAGE_KEYS.USER_INFO);
};