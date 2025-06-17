import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  updateDoc,
  getDoc,
  getDocs,
  where
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { TimelineEvent } from '../types';

// Add a new timeline event
export const addTimelineEvent = async (
  eventData: Omit<TimelineEvent, 'id' | 'createdAt'>,
  imageFile?: File
): Promise<TimelineEvent> => {
  try {
    console.log(`🕒 === ADDING TIMELINE EVENT ===`);
    console.log(`📝 Title: ${eventData.title}`);
    console.log(`📅 Date: ${eventData.date}`);
    
    let imageUrl = eventData.imageUrl;
    
    // Upload image if provided
    if (imageFile) {
      const fileName = `timeline_${Date.now()}_${imageFile.name}`;
      const storageRef = ref(storage, `uploads/${fileName}`);
      
      console.log(`📤 Uploading image: ${fileName}`);
      await uploadBytes(storageRef, imageFile);
      
      // Get download URL
      imageUrl = await getDownloadURL(storageRef);
      console.log(`✅ Image uploaded, URL: ${imageUrl.substring(0, 50)}...`);
    }
    
    // Prepare event data
    const newEvent = {
      ...eventData,
      imageUrl,
      createdAt: new Date().toISOString(),
      // Assign position based on existing events count
      position: await getNextPosition()
    };
    
    // Add to Firestore
    const docRef = await addDoc(collection(db, 'weddingTimeline'), newEvent);
    console.log(`✅ Timeline event added with ID: ${docRef.id}`);
    
    return {
      id: docRef.id,
      ...newEvent
    };
  } catch (error) {
    console.error('❌ Error adding timeline event:', error);
    throw error;
  }
};

// Get the next position (left/right) for alternating display
const getNextPosition = async (): Promise<'left' | 'right'> => {
  try {
    const eventsQuery = query(collection(db, 'weddingTimeline'));
    const snapshot = await getDocs(eventsQuery);
    
    // If even number of events, next is left; if odd, next is right
    return snapshot.size % 2 === 0 ? 'left' : 'right';
  } catch (error) {
    console.error('Error determining next position:', error);
    return 'left'; // Default to left on error
  }
};

// Load all timeline events
export const loadTimelineEvents = (callback: (events: TimelineEvent[]) => void): (() => void) => {
  const q = query(collection(db, 'weddingTimeline'), orderBy('date', 'asc'));
  
  return onSnapshot(q, (snapshot) => {
    const events: TimelineEvent[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TimelineEvent));
    
    console.log(`🕒 Loaded ${events.length} timeline events`);
    callback(events);
  }, (error) => {
    console.error('❌ Error loading timeline events:', error);
    callback([]);
  });
};

// Update a timeline event
export const updateTimelineEvent = async (
  id: string, 
  updatedData: Partial<Omit<TimelineEvent, 'id' | 'createdAt'>>,
  imageFile?: File
): Promise<void> => {
  try {
    console.log(`🕒 === UPDATING TIMELINE EVENT ===`);
    console.log(`🔑 ID: ${id}`);
    
    // Get current event data
    const eventRef = doc(db, 'weddingTimeline', id);
    const eventSnap = await getDoc(eventRef);
    
    if (!eventSnap.exists()) {
      throw new Error(`Timeline event with ID ${id} not found`);
    }
    
    const currentData = eventSnap.data() as TimelineEvent;
    
    // Handle image upload if provided
    if (imageFile) {
      // Upload new image
      const fileName = `timeline_${Date.now()}_${imageFile.name}`;
      const storageRef = ref(storage, `uploads/${fileName}`);
      
      console.log(`📤 Uploading new image: ${fileName}`);
      await uploadBytes(storageRef, imageFile);
      
      // Get new download URL
      const newImageUrl = await getDownloadURL(storageRef);
      updatedData.imageUrl = newImageUrl;
      
      // Delete old image if it exists
      if (currentData.imageUrl) {
        try {
          // Try to extract the file name from the URL
          const oldFileName = currentData.imageUrl.split('/').pop()?.split('?')[0];
          if (oldFileName) {
            const oldStorageRef = ref(storage, `uploads/${oldFileName}`);
            await deleteObject(oldStorageRef);
            console.log(`✅ Deleted old image: ${oldFileName}`);
          }
        } catch (deleteError) {
          console.warn('⚠️ Could not delete old image:', deleteError);
          // Continue with update even if old image deletion fails
        }
      }
    }
    
    // Update in Firestore
    await updateDoc(eventRef, updatedData);
    console.log(`✅ Timeline event updated successfully`);
  } catch (error) {
    console.error('❌ Error updating timeline event:', error);
    throw error;
  }
};

// Delete a timeline event
export const deleteTimelineEvent = async (id: string): Promise<void> => {
  try {
    console.log(`🕒 === DELETING TIMELINE EVENT ===`);
    console.log(`🔑 ID: ${id}`);
    
    // Get event data to check for image
    const eventRef = doc(db, 'weddingTimeline', id);
    const eventSnap = await getDoc(eventRef);
    
    if (!eventSnap.exists()) {
      throw new Error(`Timeline event with ID ${id} not found`);
    }
    
    const eventData = eventSnap.data() as TimelineEvent;
    
    // Delete image if it exists
    if (eventData.imageUrl) {
      try {
        // Try to extract the file name from the URL
        const fileName = eventData.imageUrl.split('/').pop()?.split('?')[0];
        if (fileName) {
          const storageRef = ref(storage, `uploads/${fileName}`);
          await deleteObject(storageRef);
          console.log(`✅ Deleted image: ${fileName}`);
        }
      } catch (deleteError) {
        console.warn('⚠️ Could not delete image:', deleteError);
        // Continue with deletion even if image deletion fails
      }
    }
    
    // Delete from Firestore
    await deleteDoc(eventRef);
    
    // Rebalance positions for remaining events
    await rebalancePositions();
    
    console.log(`✅ Timeline event deleted successfully`);
  } catch (error) {
    console.error('❌ Error deleting timeline event:', error);
    throw error;
  }
};

// Rebalance positions after deletion
const rebalancePositions = async (): Promise<void> => {
  try {
    const q = query(collection(db, 'weddingTimeline'), orderBy('date', 'asc'));
    const snapshot = await getDocs(q);
    
    const updatePromises = snapshot.docs.map((doc, index) => {
      const position = index % 2 === 0 ? 'left' : 'right';
      return updateDoc(doc.ref, { position });
    });
    
    await Promise.all(updatePromises);
    console.log(`✅ Timeline positions rebalanced`);
  } catch (error) {
    console.error('❌ Error rebalancing timeline positions:', error);
  }
};

// Get a single timeline event by ID
export const getTimelineEvent = async (id: string): Promise<TimelineEvent | null> => {
  try {
    const eventRef = doc(db, 'weddingTimeline', id);
    const eventSnap = await getDoc(eventRef);
    
    if (!eventSnap.exists()) {
      return null;
    }
    
    return {
      id: eventSnap.id,
      ...eventSnap.data()
    } as TimelineEvent;
  } catch (error) {
    console.error('❌ Error getting timeline event:', error);
    return null;
  }
};