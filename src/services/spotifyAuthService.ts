import { generateCodeVerifier, generateCodeChallenge } from '../utils/pkce';

// Spotify API Configuration
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '4dbf85a8ca7c43d3b2ddc540194e9387';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const SPOTIFY_ACCOUNTS_BASE = 'https://accounts.spotify.com';

// Storage Keys for persistent authentication
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'spotify_persistent_access_token',
  REFRESH_TOKEN: 'spotify_persistent_refresh_token',
  TOKEN_EXPIRY: 'spotify_persistent_token_expiry',
  USER_INFO: 'spotify_persistent_user_info',
  CODE_VERIFIER: 'spotify_pkce_code_verifier',
  DEVICE_ID: 'spotify_device_id',
  AUTH_STATE: 'spotify_auth_state'
} as const;

// Interfaces
export interface SpotifyUser {
  id: string;
  display_name: string;
  email?: string;
  images?: Array<{ url: string }>;
  country?: string;
}

export interface SpotifyAuthState {
  isAuthenticated: boolean;
  user: SpotifyUser | null;
  expiresAt: number | null;
  lastRefresh: number | null;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: Array<{ url: string }>;
  tracks: { total: number };
  owner: { id: string; display_name: string };
  collaborative: boolean;
  public: boolean;
}

// Error Classes
export class SpotifyAuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'SpotifyAuthError';
  }
}

export class SpotifyAPIError extends Error {
  constructor(message: string, public status?: number, public code?: string) {
    super(message);
    this.name = 'SpotifyAPIError';
  }
}

export class SpotifyRateLimitError extends Error {
  constructor(message: string, public retryAfter?: number) {
    super(message);
    this.name = 'SpotifyRateLimitError';
  }
}

// Utility Functions
const generateDeviceId = (): string => {
  const stored = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (stored) return stored;
  
  const deviceId = `wedding-device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
  return deviceId;
};

const getRedirectUri = (): string => {
  return 'https://kristinundmauro.de/';
};

const secureStorage = {
  set: (key: string, value: string): void => {
    try {
      const obfuscated = btoa(encodeURIComponent(value));
      localStorage.setItem(key, obfuscated);
    } catch (error) {
      console.error('Error storing secure data:', error);
    }
  },
  get: (key: string): string | null => {
    try {
      const obfuscated = localStorage.getItem(key);
      if (!obfuscated) return null;
      return decodeURIComponent(atob(obfuscated));
    } catch (error) {
      console.error('Error retrieving secure data:', error);
      return null;
    }
  },
  remove: (key: string): void => {
    localStorage.removeItem(key);
  },
  clear: (): void => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
};

export class SpotifyTokenManager {
  private static instance: SpotifyTokenManager;
  private refreshPromise: Promise<string> | null = null;

  static getInstance(): SpotifyTokenManager {
    if (!SpotifyTokenManager.instance) {
      SpotifyTokenManager.instance = new SpotifyTokenManager();
    }
    return SpotifyTokenManager.instance;
  }

  async getValidAccessToken(): Promise<string | null> {
    const token = secureStorage.get(STORAGE_KEYS.ACCESS_TOKEN);
    const expiryStr = secureStorage.get(STORAGE_KEYS.TOKEN_EXPIRY);
    
    if (!token || !expiryStr) {
      console.log('🔑 No stored tokens found');
      return null;
    }

    const expiry = parseInt(expiryStr);
    const now = Date.now();
    
    if (now >= expiry - 300000) { // 5 minutes buffer
      console.log('🔄 Token expired or expiring soon, refreshing...');
      return this.refreshAccessToken();
    }

    console.log('✅ Using valid stored token');
    return token;
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    this.refreshPromise = this.performTokenRefresh();
    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<string | null> {
    const refreshToken = secureStorage.get(STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) {
      console.log('❌ No refresh token available');
      this.clearTokens(); // Clear all tokens as refresh is not possible
      return null;
    }

    try {
      console.log('🔄 Refreshing Spotify access token...');
      const response = await fetch(`${SPOTIFY_ACCOUNTS_BASE}/api/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: SPOTIFY_CLIENT_ID,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 400 && errorData.error === 'invalid_grant') {
          console.error('❌ Refresh token invalid or expired. Clearing tokens.');
          this.clearTokens(); // Clear tokens as refresh token is bad
          throw new SpotifyAuthError('Refresh token invalid. Please re-authenticate.');
        }
        throw new SpotifyAPIError(
          `Token refresh failed: ${errorData.error_description || response.statusText}`,
          response.status, errorData.error
        );
      }

      const data = await response.json();
      this.storeTokens(data.access_token, data.refresh_token || refreshToken, data.expires_in);
      console.log('✅ Token refreshed successfully');
      return data.access_token;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      if (error instanceof SpotifyAuthError || error instanceof SpotifyAPIError) throw error;
      throw new SpotifyAuthError('Network error during token refresh.');
    }
  }

  storeTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
    const expiryTime = Date.now() + (expiresIn * 1000) - 60000; // 1 minute buffer before actual expiry
    secureStorage.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    secureStorage.set(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    secureStorage.set(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
    console.log(`🔑 Tokens stored, expires in ${Math.floor(expiresIn / 60)} minutes`);
  }

  clearTokens(): void {
    secureStorage.clear();
    console.log('🔑 All tokens cleared');
  }

  getStoredUser(): SpotifyUser | null {
    const userStr = secureStorage.get(STORAGE_KEYS.USER_INFO);
    if (!userStr) return null;
    try { return JSON.parse(userStr); } catch { return null; }
  }

  storeUser(user: SpotifyUser): void {
    secureStorage.set(STORAGE_KEYS.USER_INFO, JSON.stringify(user));
  }
}

export class SpotifyAuthService {
  private tokenManager: SpotifyTokenManager;
  private authStateListeners: Set<(state: SpotifyAuthState) => void> = new Set();

  constructor() {
    this.tokenManager = SpotifyTokenManager.getInstance();
  }

  async getAuthState(): Promise<SpotifyAuthState> {
    const token = await this.tokenManager.getValidAccessToken();
    const user = this.tokenManager.getStoredUser();
    const expiryStr = secureStorage.get(STORAGE_KEYS.TOKEN_EXPIRY);
    return {
      isAuthenticated: !!token && !!user,
      user,
      expiresAt: expiryStr ? parseInt(expiryStr) : null,
      lastRefresh: Date.now()
    };
  }

  onAuthStateChange(callback: (state: SpotifyAuthState) => void): () => void {
    this.authStateListeners.add(callback);
    this.getAuthState().then(callback);
    return () => { this.authStateListeners.delete(callback); };
  }

  private notifyAuthStateChange(): void {
    this.getAuthState().then(state => {
      this.authStateListeners.forEach(callback => callback(state));
    });
  }

  async initiateAuth(): Promise<void> {
    try {
      console.log('🚀 Starting Spotify PKCE authentication...');
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const state = generateDeviceId();
      const redirectUri = getRedirectUri();
      console.log(`🔗 Using redirect URI: ${redirectUri}`);
      secureStorage.set(STORAGE_KEYS.CODE_VERIFIER, codeVerifier);
      secureStorage.set(STORAGE_KEYS.AUTH_STATE, state);
      
      const params = new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        response_type: 'code',
        redirect_uri: redirectUri,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
        state: state,
        scope: [
          'playlist-modify-public', 'playlist-modify-private',
          'playlist-read-private', 'playlist-read-collaborative',
          'user-read-private', 'user-read-email',
          'user-library-read', 'user-library-modify'
        ].join(' '),
        show_dialog: 'true'
      });
      const authUrl = `${SPOTIFY_ACCOUNTS_BASE}/authorize?${params.toString()}`;
      console.log(`🔗 Auth URL: ${authUrl}`);
      window.location.href = authUrl;
    } catch (error) {
      console.error('❌ Auth initiation failed:', error);
      throw new SpotifyAuthError('Failed to initiate authentication');
    }
  }

  async handleAuthCallback(code: string, state: string): Promise<boolean> {
    try {
      console.log('🔄 Processing Spotify auth callback...');
      const storedState = secureStorage.get(STORAGE_KEYS.AUTH_STATE);
      if (state !== storedState) throw new SpotifyAuthError('Invalid state parameter.');
      
      const codeVerifier = secureStorage.get(STORAGE_KEYS.CODE_VERIFIER);
      if (!codeVerifier) throw new SpotifyAuthError('Missing code verifier.');
      
      const redirectUri = getRedirectUri();
      console.log(`🔄 Using redirect URI for token exchange: ${redirectUri}`);
      const response = await fetch(`${SPOTIFY_ACCOUNTS_BASE}/api/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: SPOTIFY_CLIENT_ID,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri,
          code_verifier: codeVerifier,
        }),
      });

      console.log(`🔄 Token exchange response status: ${response.status}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Token exchange error:', errorData);
        let errMsg = `Authentifizierungsfehler: ${errorData.error_description || errorData.error || 'Unknown error'}`;
        if (response.status === 400) {
            if (errorData.error === 'invalid_grant') errMsg = 'Ungültiger Code oder Redirect URI. Bitte erneut versuchen.';
            else if (errorData.error === 'invalid_request') errMsg = 'Ungültige Anfrage. Details prüfen.';
        }
        throw new SpotifyAPIError(errMsg, response.status, errorData.error);
      }

      const tokenData = await response.json();
      console.log('✅ Token exchange successful');
      this.tokenManager.storeTokens(tokenData.access_token, tokenData.refresh_token, tokenData.expires_in);
      
      const user = await this.getCurrentUser(); // Fetch and store user info
      if (user) this.tokenManager.storeUser(user);
      
      secureStorage.remove(STORAGE_KEYS.CODE_VERIFIER);
      secureStorage.remove(STORAGE_KEYS.AUTH_STATE);
      console.log('✅ Authentication successful');
      this.notifyAuthStateChange();
      return true;
    } catch (error) {
      console.error('❌ Auth callback failed:', error);
      this.tokenManager.clearTokens(); // Clear tokens on any callback failure
      if (error instanceof SpotifyAuthError || error instanceof SpotifyAPIError) throw error;
      throw new SpotifyAuthError('Authentication failed. Please try again.');
    }
  }

  async logout(): Promise<void> {
    console.log('🚪 Logging out from Spotify...');
    this.tokenManager.clearTokens();
    this.notifyAuthStateChange();
  }

  // API Methods with Error Handling and Retry Logic
  private async makeAPIRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    // console.log('makeAPIRequest called with endpoint:', endpoint, 'and options:', JSON.parse(JSON.stringify(options))); // For debugging

    const token = await this.tokenManager.getValidAccessToken();
    if (!token) {
      console.error('makeAPIRequest: No valid access token. Throwing error.');
      throw new SpotifyAuthError('No valid access token. Please authenticate.');
    }

    const maxRetries = 3;
    try {
      // ** THE FIX IS HERE **
      // Ensure Authorization and Content-Type are correctly set and take precedence
      const finalHeaders = {
        ...options.headers, // Spread custom headers from options first
        'Authorization': `Bearer ${token}`, // Then explicitly set/overwrite Authorization
        // 'Content-Type' will be set based on whether options.body exists, or defaults if not.
        // For JSON POST/PUT, Content-Type: application/json is common.
        // For GET/DELETE or if options.body is not a string/FormData, Content-Type might not be needed or set differently.
      };
      
      // Set Content-Type to application/json if there's a body and it's not FormData
      // and no Content-Type was already provided in options.headers
      if (options.body && !(options.body instanceof FormData) && !finalHeaders['Content-Type'] && !finalHeaders['content-type']) {
        finalHeaders['Content-Type'] = 'application/json';
      }
      
      // console.log('makeAPIRequest: Final headers being sent to fetch:', finalHeaders); // For debugging

      const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
        ...options, // Spread original options (method, body, etc.)
        headers: finalHeaders, // Use the carefully constructed finalHeaders
      });

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
        throw new SpotifyRateLimitError(`Rate limit exceeded. Retry after ${retryAfter} seconds.`, retryAfter);
      }

      if (response.status === 401) {
        if (retryCount < maxRetries) {
          console.log('🔄 Token expired or invalid, refreshing and retrying API request...');
          await this.tokenManager.refreshAccessToken(); // Attempt to refresh the token
          return this.makeAPIRequest(endpoint, options, retryCount + 1); // Retry the request
        } else {
          this.tokenManager.clearTokens(); // Clear tokens after multiple failed retries
          throw new SpotifyAuthError('Authentication failed after retries. Please re-authenticate.');
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new SpotifyAPIError(
          `API request to ${endpoint} failed: ${errorData.error?.message || response.statusText}`,
          response.status, errorData.error?.reason
        );
      }
      
      // Handle cases where response might be empty (e.g., 204 No Content for DELETE)
      if (response.status === 204 || response.status === 202) {
          return undefined as T; // Or an appropriate success indicator
      }

      return response.json();
    } catch (error) {
      if (error instanceof SpotifyRateLimitError || error instanceof SpotifyAuthError || error instanceof SpotifyAPIError) {
        throw error;
      }
      // Handle network errors with retry
      if (retryCount < maxRetries) {
        console.warn(`🔄 Network error for ${endpoint}, retrying... (${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this.makeAPIRequest(endpoint, options, retryCount + 1);
      }
      console.error(`❌ Network error for ${endpoint} after ${maxRetries} retries:`, error);
      throw new SpotifyAPIError('Network error. Please check your connection.');
    }
  }

  async getCurrentUser(): Promise<SpotifyUser | null> {
    try {
      return await this.makeAPIRequest<SpotifyUser>('/me');
    } catch (error) {
      console.error('❌ Failed to get current user:', error);
      return null;
    }
  }

  async getUserPlaylists(): Promise<SpotifyPlaylist[]> {
    try {
      const response = await this.makeAPIRequest<{ items: SpotifyPlaylist[]; total: number; }>('/me/playlists?limit=50');
      return response.items;
    } catch (error) {
      console.error('❌ Failed to get user playlists:', error);
      throw error; // Re-throw to be handled by the caller
    }
  }

  async addTracksToPlaylist(playlistId: string, trackUris: string[]): Promise<void> {
    if (trackUris.length === 0) return;
    try {
      const batches = [];
      for (let i = 0; i < trackUris.length; i += 100) {
        batches.push(trackUris.slice(i, i + 100));
      }
      for (const batch of batches) {
        // makeAPIRequest will set Content-Type to application/json because options.body is a string
        await this.makeAPIRequest(`/playlists/${playlistId}/tracks`, {
          method: 'POST',
          body: JSON.stringify({ uris: batch }),
        });
      }
      console.log(`✅ Added ${trackUris.length} tracks to playlist ${playlistId}`);
    } catch (error) {
      console.error(`❌ Failed to add tracks to playlist ${playlistId}:`, error);
      throw error;
    }
  }

  async removeTracksFromPlaylist(playlistId: string, trackUris: string[]): Promise<void> {
    if (trackUris.length === 0) return;
    try {
      const tracks = trackUris.map(uri => ({ uri }));
      // makeAPIRequest will set Content-Type to application/json
      await this.makeAPIRequest(`/playlists/${playlistId}/tracks`, {
        method: 'DELETE',
        body: JSON.stringify({ tracks }),
      });
      console.log(`✅ Removed ${trackUris.length} tracks from playlist ${playlistId}`);
    } catch (error) {
      console.error(`❌ Failed to remove tracks from playlist ${playlistId}:`, error);
      throw error;
    }
  }

  async searchTracks(query: string, limit = 20): Promise<any[]> {
    try {
      const response = await this.makeAPIRequest<{ tracks: { items: any[] }; }>(
        `/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}&market=DE`
      ); // No body, so Content-Type is not set by default, which is fine for GET
      return response.tracks.items;
    } catch (error) {
      console.error('❌ Failed to search tracks:', error);
      throw error;
    }
  }
}

export const spotifyAuth = new SpotifyAuthService();

export const isSpotifyCallback = (): boolean => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has('code') && urlParams.has('state');
};

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
    const errorDescription = urlParams.get('error_description') || error;
    console.error('❌ Spotify auth error on callback:', errorDescription);
    throw new SpotifyAuthError(`Spotify Authentifizierung fehlgeschlagen: ${errorDescription}`);
  }
  if (!code || !state) {
    console.error('❌ Missing code or state in callback.');
    throw new SpotifyAuthError('Unvollständige Authentifizierungsdaten erhalten.');
  }
  
  try {
    const success = await spotifyAuth.handleAuthCallback(code, state);
    if (success) {
      window.history.replaceState({}, document.title, window.location.pathname); // Clean URL
      console.log('✅ Spotify callback handled successfully');
    }
    return success;
  } catch (err) {
    console.error('❌ Callback handling failed:', err);
    // Ensure spotifyAuth.handleAuthCallback re-throws specific errors for UI to catch
    throw err; 
  }
};

console.log('🔑 === PERSISTENT SPOTIFY AUTH SERVICE INITIALIZED ===');
console.log(`🔗 Redirect URI: ${getRedirectUri()}`);
