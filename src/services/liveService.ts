import { 
  doc, 
  setDoc, 
  onSnapshot, 
  collection,
  query,
  where,
  orderBy,
  addDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { ref, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';

// Live View Counter Types
export interface LiveUser {
  id: string;
  userName: string;
  deviceId: string;
  lastSeen: string;
  isActive: boolean;
}

// Stories Types
export interface Story {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  userName: string;
  deviceId: string;
  createdAt: string;
  expiresAt: string;
  views: string[]; // Array of user IDs who viewed this story
  fileName?: string; // For deletion from storage
}

// Live View Counter Functions
export const updateUserPresence = async (userName: string, deviceId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'live_users', deviceId);
    await setDoc(userRef, {
      userName,
      deviceId,
      lastSeen: new Date().toISOString(),
      isActive: true
    }, { merge: true });
  } catch (error) {
    console.error('Error updating user presence:', error);
  }
};

export const setUserOffline = async (deviceId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'live_users', deviceId);
    await setDoc(userRef, {
      isActive: false,
      lastSeen: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error('Error setting user offline:', error);
  }
};

export const subscribeLiveUsers = (callback: (users: LiveUser[]) => void): (() => void) => {
  const q = query(
    collection(db, 'live_users'),
    where('isActive', '==', true),
    orderBy('lastSeen', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const users: LiveUser[] = [];
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const lastSeen = new Date(data.lastSeen);
      
      // Only include users who were active in the last 5 minutes
      if (lastSeen > fiveMinutesAgo) {
        users.push({
          id: doc.id,
          ...data
        } as LiveUser);
      }
    });
    
    callback(users);
  }, (error) => {
    console.error('Error listening to live users:', error);
    callback([]);
  });
};

// Stories Functions - ENHANCED VERSION WITH BETTER ERROR HANDLING
export const addStory = async (
  file: File,
  mediaType: 'image' | 'video',
  userName: string,
  deviceId: string
): Promise<void> => {
  try {
    console.log(`🚀 === STORY UPLOAD START ===`);
    console.log(`👤 User: ${userName} (${deviceId})`);
    console.log(`📁 File: ${file.name}`);
    console.log(`📊 Size: ${file.size} bytes (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    console.log(`🎬 Type: ${mediaType} (${file.type})`);
    
    // Validate file size (client-side check)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      throw new Error(`Datei zu groß: ${(file.size / 1024 / 1024).toFixed(1)}MB (max. 100MB)`);
    }
    
    // Validate file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      throw new Error(`Ungültiger Dateityp: ${file.type}`);
    }
    
    // Generate unique filename with better naming
    const timestamp = Date.now();
    const cleanUserName = userName.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_');
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || (mediaType === 'video' ? 'mp4' : 'jpg');
    const fileName = `story_${timestamp}_${cleanUserName}.${fileExtension}`;
    
    console.log(`🏷️ Generated filename: ${fileName}`);
    
    // Test Firebase connection first
    console.log(`🔗 Testing Firebase connection...`);
    try {
      // Try to access Firestore first
      const testQuery = query(collection(db, 'stories'), where('userName', '==', 'test'));
      console.log(`✅ Firestore connection OK`);
    } catch (connectionError) {
      console.error(`❌ Firebase connection failed:`, connectionError);
      throw new Error(`Verbindung zu Firebase fehlgeschlagen. Prüfe deine Internetverbindung.`);
    }
    
    // Upload to Firebase Storage with progress tracking
    console.log(`📤 Starting upload to Firebase Storage...`);
    const storageRef = ref(storage, `stories/${fileName}`);
    
    try {
      const uploadResult = await uploadBytes(storageRef, file);
      console.log(`✅ Upload to storage completed`);
      console.log(`📊 Upload metadata:`, {
        bucket: uploadResult.metadata.bucket,
        fullPath: uploadResult.metadata.fullPath,
        size: uploadResult.metadata.size,
        timeCreated: uploadResult.metadata.timeCreated
      });
    } catch (uploadError) {
      console.error(`❌ Storage upload failed:`, uploadError);
      
      // Provide specific error messages based on error type
      if (uploadError.code === 'storage/unauthorized') {
        throw new Error('Keine Berechtigung zum Hochladen. Lade die Seite neu und versuche es erneut.');
      } else if (uploadError.code === 'storage/canceled') {
        throw new Error('Upload wurde abgebrochen.');
      } else if (uploadError.code === 'storage/quota-exceeded') {
        throw new Error('Speicherplatz voll. Kontaktiere Kristin oder Maurizio.');
      } else if (uploadError.code === 'storage/invalid-format') {
        throw new Error('Ungültiges Dateiformat.');
      } else if (uploadError.message?.includes('network')) {
        throw new Error('Netzwerkfehler. Prüfe deine Internetverbindung.');
      } else {
        throw new Error(`Upload-Fehler: ${uploadError.message || 'Unbekannter Fehler'}`);
      }
    }
    
    // Get download URL
    console.log(`🔗 Getting download URL...`);
    let downloadURL: string;
    try {
      downloadURL = await getDownloadURL(storageRef);
      console.log(`✅ Download URL obtained: ${downloadURL.substring(0, 80)}...`);
    } catch (urlError) {
      console.error(`❌ Failed to get download URL:`, urlError);
      throw new Error('Fehler beim Erstellen der Download-URL. Versuche es erneut.');
    }
    
    // Calculate expiry (24 hours from now)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    console.log(`📅 Story expires at: ${expiresAt.toISOString()}`);
    
    // Add to Firestore
    console.log(`💾 Adding story to Firestore...`);
    const storyData = {
      mediaUrl: downloadURL,
      mediaType,
      userName,
      deviceId,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      views: [],
      fileName: fileName
    };
    
    try {
      const docRef = await addDoc(collection(db, 'stories'), storyData);
      console.log(`✅ Story added to Firestore with ID: ${docRef.id}`);
      console.log(`🎉 === STORY UPLOAD COMPLETED SUCCESSFULLY ===`);
    } catch (firestoreError) {
      console.error(`❌ Firestore save failed:`, firestoreError);
      
      // Try to clean up the uploaded file
      try {
        await deleteObject(storageRef);
        console.log(`🧹 Cleaned up uploaded file after Firestore error`);
      } catch (cleanupError) {
        console.warn(`⚠️ Could not clean up uploaded file:`, cleanupError);
      }
      
      throw new Error(`Fehler beim Speichern der Story-Daten: ${firestoreError.message || 'Unbekannter Fehler'}`);
    }
    
  } catch (error) {
    console.error('❌ === STORY UPLOAD FAILED ===');
    console.error('Error details:', error);
    
    // Re-throw with user-friendly message
    if (error instanceof Error) {
      throw error; // Already has a user-friendly message
    } else {
      throw new Error(`Unbekannter Fehler beim Story-Upload: ${error}`);
    }
  }
};

export const subscribeStories = (callback: (stories: Story[]) => void): (() => void) => {
  const now = new Date();
  const q = query(
    collection(db, 'stories'),
    where('expiresAt', '>', now.toISOString()),
    orderBy('expiresAt'),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const stories: Story[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Story));
    
    console.log(`📱 Active stories loaded: ${stories.length}`);
    callback(stories);
  }, (error) => {
    console.error('Error listening to stories:', error);
    callback([]);
  });
};

// Subscribe to ALL stories for admin (including expired ones)
export const subscribeAllStories = (callback: (stories: Story[]) => void): (() => void) => {
  const q = query(
    collection(db, 'stories'),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const stories: Story[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Story));
    
    console.log(`👑 All stories loaded (admin): ${stories.length}`);
    callback(stories);
  }, (error) => {
    console.error('Error listening to all stories:', error);
    callback([]);
  });
};

export const markStoryAsViewed = async (storyId: string, deviceId: string): Promise<void> => {
  try {
    const storyRef = doc(db, 'stories', storyId);
    const storyDoc = await getDocs(query(collection(db, 'stories'), where('__name__', '==', storyId)));
    
    if (!storyDoc.empty) {
      const storyData = storyDoc.docs[0].data();
      const currentViews = storyData.views || [];
      
      if (!currentViews.includes(deviceId)) {
        await setDoc(storyRef, {
          views: [...currentViews, deviceId]
        }, { merge: true });
      }
    }
  } catch (error) {
    console.error('Error marking story as viewed:', error);
  }
};

// Delete a specific story
export const deleteStory = async (storyId: string): Promise<void> => {
  try {
    console.log(`🗑️ Deleting story: ${storyId}`);
    
    // Get story data first to get the fileName for storage deletion
    const storyDoc = await getDocs(query(collection(db, 'stories'), where('__name__', '==', storyId)));
    
    if (!storyDoc.empty) {
      const storyData = storyDoc.docs[0].data();
      
      // Delete from storage if fileName exists
      if (storyData.fileName) {
        try {
          const storageRef = ref(storage, `stories/${storyData.fileName}`);
          await deleteObject(storageRef);
          console.log(`✅ Deleted story from storage: ${storyData.fileName}`);
        } catch (storageError) {
          console.warn(`⚠️ Could not delete story from storage: ${storyData.fileName}`, storageError);
          // Continue with Firestore deletion even if storage deletion fails
        }
      }
    }
    
    // Delete from Firestore
    await deleteDoc(doc(db, 'stories', storyId));
    console.log(`✅ Deleted story from Firestore: ${storyId}`);
    
  } catch (error) {
    console.error('Error deleting story:', error);
    throw error;
  }
};

// Cleanup expired stories (should be called periodically)
export const cleanupExpiredStories = async (): Promise<void> => {
  try {
    const now = new Date();
    const q = query(
      collection(db, 'stories'),
      where('expiresAt', '<=', now.toISOString())
    );
    
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(async (doc) => {
      const storyData = doc.data();
      
      // Delete from storage if fileName exists
      if (storyData.fileName) {
        try {
          const storageRef = ref(storage, `stories/${storyData.fileName}`);
          await deleteObject(storageRef);
        } catch (storageError) {
          console.warn(`⚠️ Could not delete expired story from storage: ${storyData.fileName}`, storageError);
        }
      }
      
      // Delete from Firestore
      return deleteDoc(doc.ref);
    });
    
    await Promise.all(deletePromises);
    console.log(`Cleaned up ${snapshot.docs.length} expired stories`);
  } catch (error) {
    console.error('Error cleaning up expired stories:', error);
  }
};