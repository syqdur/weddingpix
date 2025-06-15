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
import { ref, deleteObject } from 'firebase/storage';
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

// Stories Functions
export const addStory = async (
  mediaUrl: string,
  mediaType: 'image' | 'video',
  userName: string,
  deviceId: string,
  fileName?: string
): Promise<void> => {
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    await addDoc(collection(db, 'stories'), {
      mediaUrl,
      mediaType,
      userName,
      deviceId,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      views: [],
      fileName: fileName || `story-${Date.now()}`
    });
  } catch (error) {
    console.error('Error adding story:', error);
    throw error;
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