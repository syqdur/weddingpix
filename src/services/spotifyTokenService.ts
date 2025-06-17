import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

// 🌍 SHARED SPOTIFY TOKEN STORAGE
// This allows one admin to authenticate and all users to benefit from Spotify integration

const SHARED_SPOTIFY_COLLECTION = 'sharedSpotifyAuth';
const SHARED_SPOTIFY_DOC = 'current';

interface SharedSpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  authenticatedBy: string;
  authenticatedAt: string;
  isActive: boolean;
}

interface SharedSpotifyStatus {
  isAvailable: boolean;
  authenticatedBy: string | null;
  authenticatedAt: string | null;
}

// 🔑 STORE SHARED TOKENS (Admin only)
export const storeSharedSpotifyTokens = async (
  accessToken: string,
  refreshToken: string,
  expiresInSeconds: number,
  authenticatedBy: string
): Promise<void> => {
  try {
    const expiresAt = Date.now() + (expiresInSeconds * 1000);
    
    const tokenData: SharedSpotifyTokens = {
      accessToken,
      refreshToken,
      expiresAt,
      authenticatedBy,
      authenticatedAt: new Date().toISOString(),
      isActive: true
    };
    
    await setDoc(doc(db, SHARED_SPOTIFY_COLLECTION, SHARED_SPOTIFY_DOC), {
      ...tokenData,
      updatedAt: serverTimestamp()
    });
    
    console.log(`🌍 ✅ Shared Spotify tokens stored for ${authenticatedBy} (expires in ${Math.floor(expiresInSeconds / 86400)} days)`);
  } catch (error) {
    console.error('❌ Error storing shared Spotify tokens:', error);
    throw error;
  }
};

// 🔑 GET VALID SHARED ACCESS TOKEN (All users)
export const getValidSharedAccessToken = async (): Promise<string | null> => {
  try {
    const docRef = doc(db, SHARED_SPOTIFY_COLLECTION, SHARED_SPOTIFY_DOC);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.log('🌍 No shared Spotify tokens found');
      return null;
    }
    
    const data = docSnap.data() as SharedSpotifyTokens;
    
    if (!data.isActive) {
      console.log('🌍 Shared Spotify tokens are inactive');
      return null;
    }
    
    const now = Date.now();
    if (now >= data.expiresAt) {
      console.log('🌍 Shared Spotify tokens expired');
      // Try to refresh
      return await refreshSharedAccessToken(data);
    }
    
    console.log('🌍 ✅ Using valid shared Spotify token');
    return data.accessToken;
    
  } catch (error) {
    console.error('❌ Error getting shared access token:', error);
    return null;
  }
};

// 🔄 REFRESH SHARED ACCESS TOKEN
const refreshSharedAccessToken = async (tokenData: SharedSpotifyTokens): Promise<string | null> => {
  try {
    console.log('🔄 Refreshing shared Spotify token...');
    
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '4dbf85a8ca7c43d3b2ddc540194e9387';
    const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET || 'acf102b8834d48b497a7e98bf69021f6';
    
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokenData.refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
    
    if (!response.ok) {
      console.error('❌ Failed to refresh shared token:', response.status);
      await clearSharedSpotifyTokens();
      return null;
    }
    
    const data = await response.json();
    
    // Store refreshed token (40 days)
    const fortyDaysInSeconds = 40 * 24 * 60 * 60;
    await storeSharedSpotifyTokens(
      data.access_token,
      data.refresh_token || tokenData.refreshToken,
      fortyDaysInSeconds,
      tokenData.authenticatedBy
    );
    
    console.log('🌍 ✅ Shared token refreshed successfully');
    return data.access_token;
    
  } catch (error) {
    console.error('❌ Error refreshing shared token:', error);
    await clearSharedSpotifyTokens();
    return null;
  }
};

// 🗑️ CLEAR SHARED TOKENS (Admin only)
export const clearSharedSpotifyTokens = async (): Promise<void> => {
  try {
    await deleteDoc(doc(db, SHARED_SPOTIFY_COLLECTION, SHARED_SPOTIFY_DOC));
    console.log('🌍 ✅ Shared Spotify tokens cleared');
  } catch (error) {
    console.error('❌ Error clearing shared tokens:', error);
    throw error;
  }
};

// 🔍 CHECK IF SHARED SPOTIFY IS AVAILABLE (All users)
export const isSharedSpotifyAvailable = async (): Promise<boolean> => {
  try {
    const docRef = doc(db, SHARED_SPOTIFY_COLLECTION, SHARED_SPOTIFY_DOC);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return false;
    }
    
    const data = docSnap.data() as SharedSpotifyTokens;
    
    if (!data.isActive) {
      return false;
    }
    
    const now = Date.now();
    return now < data.expiresAt;
    
  } catch (error) {
    console.error('❌ Error checking shared Spotify availability:', error);
    return false;
  }
};

// 📊 GET SHARED SPOTIFY STATUS (All users)
export const getSharedSpotifyStatus = async (): Promise<SharedSpotifyStatus> => {
  try {
    const docRef = doc(db, SHARED_SPOTIFY_COLLECTION, SHARED_SPOTIFY_DOC);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return {
        isAvailable: false,
        authenticatedBy: null,
        authenticatedAt: null
      };
    }
    
    const data = docSnap.data() as SharedSpotifyTokens;
    
    const now = Date.now();
    const isAvailable = data.isActive && now < data.expiresAt;
    
    return {
      isAvailable,
      authenticatedBy: data.authenticatedBy,
      authenticatedAt: data.authenticatedAt
    };
    
  } catch (error) {
    console.error('❌ Error getting shared Spotify status:', error);
    return {
      isAvailable: false,
      authenticatedBy: null,
      authenticatedAt: null
    };
  }
};

// 📡 SUBSCRIBE TO SHARED SPOTIFY STATUS (All users)
export const subscribeToSharedSpotifyStatus = (
  callback: (status: SharedSpotifyStatus) => void
): (() => void) => {
  const docRef = doc(db, SHARED_SPOTIFY_COLLECTION, SHARED_SPOTIFY_DOC);
  
  return onSnapshot(docRef, (doc) => {
    if (!doc.exists()) {
      callback({
        isAvailable: false,
        authenticatedBy: null,
        authenticatedAt: null
      });
      return;
    }
    
    const data = doc.data() as SharedSpotifyTokens;
    const now = Date.now();
    const isAvailable = data.isActive && now < data.expiresAt;
    
    callback({
      isAvailable,
      authenticatedBy: data.authenticatedBy,
      authenticatedAt: data.authenticatedAt
    });
  }, (error) => {
    console.error('❌ Error in shared Spotify status subscription:', error);
    callback({
      isAvailable: false,
      authenticatedBy: null,
      authenticatedAt: null
    });
  });
};

console.log('🌍 ✅ SHARED SPOTIFY TOKEN SERVICE INITIALIZED');
console.log('🔑 Shared authentication allows one admin to enable Spotify for all users');
console.log('🔄 Automatic token refresh and 40-day storage enabled');