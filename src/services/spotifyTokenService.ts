// Shared Spotify Token Service
import { 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Shared Spotify Token Types
interface SharedSpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  authenticatedBy: string;
  authenticatedAt: string;
  isActive: boolean;
}

const SHARED_TOKENS_DOC = 'shared_spotify_tokens';

// Store tokens for all users (Admin only)
export const storeSharedSpotifyTokens = async (
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
  adminName: string
): Promise<void> => {
  try {
    console.log('🔑 === STORING SHARED SPOTIFY TOKENS ===');
    console.log(`👤 Admin: ${adminName}`);
    
    // Store for 40 days instead of original expiry
    const fortyDaysInMs = 40 * 24 * 60 * 60 * 1000; // 40 days in milliseconds
    const expiresAt = Date.now() + fortyDaysInMs;
    
    console.log(`🎯 Extending token validity to 40 days`);
    
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
    
    console.log('✅ Shared Spotify tokens stored for 40 days');
    console.log('🌍 All users can now access Spotify integration for 40 days!');
    
  } catch (error) {
    console.error('❌ Error storing shared tokens:', error);
    throw error;
  }
};

// Get shared tokens (All users)
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
    
    const daysLeft = Math.floor((tokens.expiresAt - Date.now()) / (24 * 60 * 60 * 1000));
    console.log(`✅ Found valid shared Spotify tokens from ${tokens.authenticatedBy} (${daysLeft} days left)`);
    return tokens;
    
  } catch (error) {
    console.error('❌ Error getting shared tokens:', error);
    return null;
  }
};

// Refresh shared tokens (System)
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
        client_id: '4dbf85a8ca7c43d3b2ddc540194e9387',
        client_secret: 'acf102b8834d48b497a7e98bf69021f6',
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Store refreshed tokens with extended expiry
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

// Get valid shared access token (All users)
export const getValidSharedAccessToken = async (): Promise<string | null> => {
  try {
    let tokens = await getSharedSpotifyTokens();
    
    if (!tokens) {
      return null;
    }
    
    // Check if token needs refresh (1 day before expiry)
    const oneDayFromNow = Date.now() + (24 * 60 * 60 * 1000); // 1 day
    if (oneDayFromNow >= tokens.expiresAt) {
      console.log('🔄 Shared token needs refresh (less than 1 day remaining)...');
      const newToken = await refreshSharedSpotifyTokens();
      return newToken;
    }
    
    const daysLeft = Math.floor((tokens.expiresAt - Date.now()) / (24 * 60 * 60 * 1000));
    console.log(`✅ Using shared token (${daysLeft} days remaining)`);
    return tokens.accessToken;
    
  } catch (error) {
    console.error('❌ Error getting valid shared token:', error);
    return null;
  }
};

// Clear shared tokens (Admin only)
export const clearSharedSpotifyTokens = async (): Promise<void> => {
  try {
    const docRef = doc(db, 'settings', SHARED_TOKENS_DOC);
    await setDoc(docRef, { isActive: false }, { merge: true });
    console.log('🔑 Shared Spotify tokens cleared');
  } catch (error) {
    console.error('❌ Error clearing shared tokens:', error);
  }
};

// Check if shared Spotify is available (All users)
export const isSharedSpotifyAvailable = async (): Promise<boolean> => {
  const tokens = await getSharedSpotifyTokens();
  return tokens !== null;
};

// Get shared Spotify status (All users)
export const getSharedSpotifyStatus = async () => {
  const tokens = await getSharedSpotifyTokens();
  
  if (!tokens) {
    return {
      isAvailable: false,
      authenticatedBy: null,
      authenticatedAt: null,
      expiresAt: null
    };
  }
  
  return {
    isAvailable: true,
    authenticatedBy: tokens.authenticatedBy,
    authenticatedAt: tokens.authenticatedAt,
    expiresAt: tokens.expiresAt
  };
};

// Subscribe to shared token changes (All users)
export const subscribeToSharedSpotifyStatus = (
  callback: (status: { 
    isAvailable: boolean; 
    authenticatedBy: string | null; 
    authenticatedAt: string | null;
    expiresAt: number | null;
  }) => void
): (() => void) => {
  const docRef = doc(db, 'settings', SHARED_TOKENS_DOC);
  
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      const tokens = doc.data() as SharedSpotifyTokens;
      
      if (tokens.isActive && Date.now() < tokens.expiresAt) {
        const daysLeft = Math.floor((tokens.expiresAt - Date.now()) / (24 * 60 * 60 * 1000));
        console.log(`🌍 Shared Spotify status: ACTIVE (${daysLeft} days left)`);
        
        callback({
          isAvailable: true,
          authenticatedBy: tokens.authenticatedBy,
          authenticatedAt: tokens.authenticatedAt,
          expiresAt: tokens.expiresAt
        });
      } else {
        console.log('🌍 Shared Spotify status: INACTIVE (expired or disabled)');
        callback({
          isAvailable: false,
          authenticatedBy: null,
          authenticatedAt: null,
          expiresAt: null
        });
      }
    } else {
      console.log('🌍 Shared Spotify status: NOT_FOUND');
      callback({
        isAvailable: false,
        authenticatedBy: null,
        authenticatedAt: null,
        expiresAt: null
      });
    }
  }, (error) => {
    console.error('❌ Error listening to shared Spotify status:', error);
    callback({
      isAvailable: false,
      authenticatedBy: null,
      authenticatedAt: null,
      expiresAt: null
    });
  });
};