import { 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../config/firebase';

// 🔑 SHARED SPOTIFY TOKEN SERVICE
// Allows admin to authenticate once and share tokens with all users

interface SharedSpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  authenticatedBy: string;
  authenticatedAt: string;
  isActive: boolean;
}

const SHARED_TOKENS_DOC = 'shared_spotify_tokens';

// 🔑 STORE TOKENS FOR ALL USERS (Admin only)
export const storeSharedSpotifyTokens = async (
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
  adminName: string
): Promise<void> => {
  try {
    console.log('🔑 === STORING SHARED SPOTIFY TOKENS ===');
    console.log(`👤 Admin: ${adminName}`);
    console.log(`⏰ Expires in: ${Math.floor(expiresIn / 60)} minutes`);
    
    const expiresAt = Date.now() + (expiresIn * 1000) - 60000; // 1 minute buffer
    
    const sharedTokens: SharedSpotifyTokens = {
      accessToken,
      refreshToken,
      expiresAt,
      authenticatedBy: adminName,
      authenticatedAt: new Date().toISOString(),
      isActive: true
    };
    
    const docRef = doc(db, 'settings', SHARED_TOKENS_DOC);
    await setDoc(docRef, sharedTokens);
    
    console.log('✅ Shared Spotify tokens stored successfully');
    console.log('🌍 All users can now access Spotify integration!');
    
  } catch (error) {
    console.error('❌ Error storing shared tokens:', error);
    throw error;
  }
};

// 🔑 GET SHARED TOKENS (All users)
export const getSharedSpotifyTokens = async (): Promise<SharedSpotifyTokens | null> => {
  try {
    const docRef = doc(db, 'settings', SHARED_TOKENS_DOC);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.log('ℹ️ No shared Spotify tokens found');
      return null;
    }
    
    const tokens = docSnap.data() as SharedSpotifyTokens;
    
    // Check if tokens are still valid
    if (!tokens.isActive || Date.now() >= tokens.expiresAt) {
      console.log('⚠️ Shared Spotify tokens expired or inactive');
      return null;
    }
    
    console.log(`✅ Found valid shared Spotify tokens from ${tokens.authenticatedBy}`);
    return tokens;
    
  } catch (error) {
    console.error('❌ Error getting shared tokens:', error);
    return null;
  }
};

// 🔑 REFRESH SHARED TOKENS (System)
export const refreshSharedSpotifyTokens = async (): Promise<string | null> => {
  try {
    const currentTokens = await getSharedSpotifyTokens();
    
    if (!currentTokens || !currentTokens.refreshToken) {
      console.log('❌ No refresh token available for shared tokens');
      return null;
    }
    
    console.log('🔄 Refreshing shared Spotify tokens...');
    
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: currentTokens.refreshToken,
        client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID || '',
        client_secret: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET || '',
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Update shared tokens
    await storeSharedSpotifyTokens(
      data.access_token,
      data.refresh_token || currentTokens.refreshToken,
      data.expires_in,
      currentTokens.authenticatedBy
    );
    
    console.log('✅ Shared Spotify tokens refreshed successfully');
    return data.access_token;
    
  } catch (error) {
    console.error('❌ Error refreshing shared tokens:', error);
    
    // Deactivate tokens on refresh failure
    try {
      const docRef = doc(db, 'settings', SHARED_TOKENS_DOC);
      await setDoc(docRef, { isActive: false }, { merge: true });
    } catch (deactivateError) {
      console.error('❌ Error deactivating tokens:', deactivateError);
    }
    
    return null;
  }
};

// 🔑 GET VALID SHARED ACCESS TOKEN (All users)
export const getValidSharedAccessToken = async (): Promise<string | null> => {
  try {
    let tokens = await getSharedSpotifyTokens();
    
    if (!tokens) {
      return null;
    }
    
    // Check if token needs refresh (5 minutes before expiry)
    const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000);
    if (fiveMinutesFromNow >= tokens.expiresAt) {
      console.log('🔄 Shared token needs refresh...');
      const newToken = await refreshSharedSpotifyTokens();
      return newToken;
    }
    
    return tokens.accessToken;
    
  } catch (error) {
    console.error('❌ Error getting valid shared token:', error);
    return null;
  }
};

// 🔑 CLEAR SHARED TOKENS (Admin only)
export const clearSharedSpotifyTokens = async (): Promise<void> => {
  try {
    const docRef = doc(db, 'settings', SHARED_TOKENS_DOC);
    await setDoc(docRef, { isActive: false }, { merge: true });
    console.log('🔑 Shared Spotify tokens cleared');
  } catch (error) {
    console.error('❌ Error clearing shared tokens:', error);
  }
};

// 🔑 CHECK IF SHARED SPOTIFY IS AVAILABLE (All users)
export const isSharedSpotifyAvailable = async (): Promise<boolean> => {
  const tokens = await getSharedSpotifyTokens();
  return tokens !== null;
};

// 🔑 GET SHARED SPOTIFY STATUS (All users)
export const getSharedSpotifyStatus = async () => {
  const tokens = await getSharedSpotifyTokens();
  
  if (!tokens) {
    return {
      isAvailable: false,
      authenticatedBy: null,
      authenticatedAt: null
    };
  }
  
  return {
    isAvailable: true,
    authenticatedBy: tokens.authenticatedBy,
    authenticatedAt: tokens.authenticatedAt
  };
};

// 🔑 SUBSCRIBE TO SHARED TOKEN CHANGES (All users)
export const subscribeToSharedSpotifyStatus = (
  callback: (status: { isAvailable: boolean; authenticatedBy: string | null; authenticatedAt: string | null }) => void
): (() => void) => {
  const docRef = doc(db, 'settings', SHARED_TOKENS_DOC);
  
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      const tokens = doc.data() as SharedSpotifyTokens;
      
      if (tokens.isActive && Date.now() < tokens.expiresAt) {
        callback({
          isAvailable: true,
          authenticatedBy: tokens.authenticatedBy,
          authenticatedAt: tokens.authenticatedAt
        });
      } else {
        callback({
          isAvailable: false,
          authenticatedBy: null,
          authenticatedAt: null
        });
      }
    } else {
      callback({
        isAvailable: false,
        authenticatedBy: null,
        authenticatedAt: null
      });
    }
  }, (error) => {
    console.error('❌ Error listening to shared Spotify status:', error);
    callback({
      isAvailable: false,
      authenticatedBy: null,
      authenticatedAt: null
    });
  });
};

console.log('🔑 === SHARED SPOTIFY TOKEN SERVICE INITIALIZED ===');
console.log('🌍 Allows admin authentication to be shared with ALL users');
console.log('🔄 Automatic token refresh for continuous access');
console.log('📡 Real-time status updates for all users');