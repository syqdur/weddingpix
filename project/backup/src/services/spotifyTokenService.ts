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

// 🔑 STORE TOKENS FOR ALL USERS (Admin only) - 🎯 EXTENDED TO 40 DAYS
export const storeSharedSpotifyTokens = async (
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
  adminName: string
): Promise<void> => {
  try {
    console.log('🔑 === STORING SHARED SPOTIFY TOKENS FOR 40 DAYS ===');
    console.log(`👤 Admin: ${adminName}`);
    console.log(`⏰ Original expires in: ${Math.floor(expiresIn / 60)} minutes`);
    
    // 🎯 EXTENDED: Store for 40 days instead of original expiry
    const fortyDaysInMs = 40 * 24 * 60 * 60 * 1000; // 40 days in milliseconds
    const expiresAt = Date.now() + fortyDaysInMs - 60000; // 40 days minus 1 minute buffer
    
    console.log(`🎯 Extended to: 40 days (${Math.floor(fortyDaysInMs / (24 * 60 * 60 * 1000))} days)`);
    
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
    
    const daysLeft = Math.floor((tokens.expiresAt - Date.now()) / (24 * 60 * 60 * 1000));
    console.log(`✅ Found valid shared Spotify tokens from ${tokens.authenticatedBy} (${daysLeft} days left)`);
    return tokens;
    
  } catch (error) {
    console.error('❌ Error getting shared tokens:', error);
    return null;
  }
};

// 🔑 REFRESH SHARED TOKENS (System) - 🎯 EXTENDED TO 40 DAYS
export const refreshSharedSpotifyTokens = async (): Promise<string | null> => {
  try {
    const currentTokens = await getSharedSpotifyTokens();
    
    if (!currentTokens || !currentTokens.refreshToken) {
      console.log('❌ No refresh token available for shared tokens');
      return null;
    }
    
    console.log('🔄 Refreshing shared Spotify tokens for 40 days...');
    
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: currentTokens.refreshToken,
        client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID || '4dbf85a8ca7c43d3b2ddc540194e9387',
        client_secret: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET || 'acf102b8834d48b497a7e98bf69021f6',
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 🎯 EXTENDED: Update shared tokens for 40 days
    const fortyDaysInSeconds = 40 * 24 * 60 * 60; // 40 days
    await storeSharedSpotifyTokens(
      data.access_token,
      data.refresh_token || currentTokens.refreshToken,
      fortyDaysInSeconds,
      currentTokens.authenticatedBy
    );
    
    console.log('✅ Shared Spotify tokens refreshed for 40 days');
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
    
    // 🎯 EXTENDED: Check if token needs refresh (1 day before expiry instead of 5 minutes)
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
        const daysLeft = Math.floor((tokens.expiresAt - Date.now()) / (24 * 60 * 60 * 1000));
        console.log(`🌍 Shared Spotify status: ACTIVE (${daysLeft} days left)`);
        
        callback({
          isAvailable: true,
          authenticatedBy: tokens.authenticatedBy,
          authenticatedAt: tokens.authenticatedAt
        });
      } else {
        console.log('🌍 Shared Spotify status: INACTIVE (expired or disabled)');
        callback({
          isAvailable: false,
          authenticatedBy: null,
          authenticatedAt: null
        });
      }
    } else {
      console.log('🌍 Shared Spotify status: NOT_FOUND');
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
console.log('🎯 ✅ 40-DAY TOKEN STORAGE: Shared tokens now last 40 days!');