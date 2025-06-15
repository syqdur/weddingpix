import { 
  ref, 
  uploadBytes, 
  listAll, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  where,
  getDocs,
  updateDoc
} from 'firebase/firestore';
import { storage, db } from '../config/firebase';
import { MediaItem, Comment, Like } from '../types';

export const uploadFiles = async (
  files: FileList, 
  userName: string, 
  deviceId: string,
  onProgress: (progress: number) => void
): Promise<void> => {
  let uploaded = 0;
  
  for (const file of Array.from(files)) {
    const fileName = `${Date.now()}-${file.name}`;
    const storageRef = ref(storage, `uploads/${fileName}`);
    
    await uploadBytes(storageRef, file);
    
    // Add metadata to Firestore
    const isVideo = file.type.startsWith('video/');
    await addDoc(collection(db, 'media'), {
      name: fileName,
      uploadedBy: userName,
      deviceId: deviceId,
      uploadedAt: new Date().toISOString(),
      type: isVideo ? 'video' : 'image'
    });
    
    uploaded++;
    onProgress((uploaded / files.length) * 100);
  }
};

export const uploadVideoBlob = async (
  videoBlob: Blob,
  userName: string,
  deviceId: string,
  onProgress: (progress: number) => void
): Promise<void> => {
  const fileName = `${Date.now()}-recorded-video.webm`;
  const storageRef = ref(storage, `uploads/${fileName}`);
  
  onProgress(50);
  
  await uploadBytes(storageRef, videoBlob);
  
  // Add metadata to Firestore
  await addDoc(collection(db, 'media'), {
    name: fileName,
    uploadedBy: userName,
    deviceId: deviceId,
    uploadedAt: new Date().toISOString(),
    type: 'video'
  });
  
  onProgress(100);
};

export const addNote = async (
  noteText: string,
  userName: string,
  deviceId: string
): Promise<void> => {
  // Add note as a special media item
  await addDoc(collection(db, 'media'), {
    name: `note-${Date.now()}`,
    uploadedBy: userName,
    deviceId: deviceId,
    uploadedAt: new Date().toISOString(),
    type: 'note',
    noteText: noteText
  });
};

export const editNote = async (
  noteId: string,
  newText: string
): Promise<void> => {
  const noteRef = doc(db, 'media', noteId);
  await updateDoc(noteRef, {
    noteText: newText,
    lastEdited: new Date().toISOString()
  });
};

// Vereinfachte und robuste Download-URL Funktion
const getDownloadURLSafe = async (fileName: string): Promise<string> => {
  try {
    const storageRef = ref(storage, `uploads/${fileName}`);
    const url = await getDownloadURL(storageRef);
    
    console.log(`✅ URL generated for ${fileName}`);
    return url;
    
  } catch (error) {
    console.error(`❌ Failed to get URL for ${fileName}:`, error);
    
    // Fallback: Versuche alternative Pfade
    try {
      const altStorageRef = ref(storage, fileName);
      const altUrl = await getDownloadURL(altStorageRef);
      console.log(`✅ Alternative URL found for ${fileName}`);
      return altUrl;
    } catch (altError) {
      console.error(`❌ Alternative path also failed for ${fileName}:`, altError);
      throw new Error(`Could not load ${fileName}`);
    }
  }
};

export const loadGallery = (callback: (items: MediaItem[]) => void): () => void => {
  const q = query(collection(db, 'media'), orderBy('uploadedAt', 'desc'));
  
  return onSnapshot(q, async (snapshot) => {
    console.log(`📊 Loading ${snapshot.docs.length} items from Firestore...`);
    
    // Verarbeite alle Items parallel für bessere Performance
    const itemPromises = snapshot.docs.map(async (docSnapshot) => {
      const data = docSnapshot.data();
      
      try {
        if (data.type === 'note') {
          // Handle note items
          return {
            id: docSnapshot.id,
            name: data.name,
            url: '', // Notes don't have URLs
            uploadedBy: data.uploadedBy,
            uploadedAt: data.uploadedAt,
            deviceId: data.deviceId,
            type: 'note' as const,
            noteText: data.noteText
          };
          
        } else {
          // Handle media items (images/videos)
          try {
            const url = await getDownloadURLSafe(data.name);
            
            return {
              id: docSnapshot.id,
              name: data.name,
              url,
              uploadedBy: data.uploadedBy,
              uploadedAt: data.uploadedAt,
              deviceId: data.deviceId,
              type: data.type as 'image' | 'video'
            };
            
          } catch (urlError) {
            console.error(`❌ Could not load ${data.name}, skipping...`);
            return null; // Skip this item
          }
        }
        
      } catch (itemError) {
        console.error(`❌ Error processing item ${docSnapshot.id}:`, itemError);
        return null; // Skip this item
      }
    });
    
    // Warte auf alle Promises und filtere null-Werte
    const resolvedItems = await Promise.all(itemPromises);
    const validItems = resolvedItems.filter((item): item is MediaItem => item !== null);
    
    console.log(`📊 Gallery loaded successfully:`);
    console.log(`   📸 Images: ${validItems.filter(i => i.type === 'image').length}`);
    console.log(`   🎥 Videos: ${validItems.filter(i => i.type === 'video').length}`);
    console.log(`   💌 Notes: ${validItems.filter(i => i.type === 'note').length}`);
    console.log(`   ❌ Failed: ${snapshot.docs.length - validItems.length}`);
    
    callback(validItems);
    
  }, (error) => {
    console.error('❌ Gallery listener error:', error);
    // Fallback: leere Liste zurückgeben
    callback([]);
  });
};

export const deleteMediaItem = async (item: MediaItem): Promise<void> => {
  try {
    // Delete from storage (only if it's not a note)
    if (item.type !== 'note' && item.name) {
      try {
        const storageRef = ref(storage, `uploads/${item.name}`);
        await deleteObject(storageRef);
        console.log(`✅ Deleted from storage: ${item.name}`);
      } catch (storageError) {
        console.warn(`⚠️ Could not delete from storage: ${item.name}`, storageError);
        // Continue with Firestore deletion even if storage deletion fails
      }
    }
    
    // Delete from Firestore
    await deleteDoc(doc(db, 'media', item.id));
    console.log(`✅ Deleted from Firestore: ${item.id}`);
    
    // Delete associated comments
    const commentsQuery = query(
      collection(db, 'comments'), 
      where('mediaId', '==', item.id)
    );
    const commentsSnapshot = await getDocs(commentsQuery);
    
    const deleteCommentPromises = commentsSnapshot.docs.map(commentDoc => 
      deleteDoc(doc(db, 'comments', commentDoc.id))
    );
    
    // Delete associated likes
    const likesQuery = query(
      collection(db, 'likes'), 
      where('mediaId', '==', item.id)
    );
    const likesSnapshot = await getDocs(likesQuery);
    
    const deleteLikePromises = likesSnapshot.docs.map(likeDoc => 
      deleteDoc(doc(db, 'likes', likeDoc.id))
    );
    
    await Promise.all([...deleteCommentPromises, ...deleteLikePromises]);
    console.log(`✅ Deleted associated data for: ${item.id}`);
    
  } catch (error) {
    console.error(`❌ Error deleting item ${item.id}:`, error);
    throw error;
  }
};

export const loadComments = (callback: (comments: Comment[]) => void): () => void => {
  const q = query(collection(db, 'comments'), orderBy('createdAt', 'asc'));
  
  return onSnapshot(q, (snapshot) => {
    const comments: Comment[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Comment));
    
    console.log(`💬 Loaded ${comments.length} comments`);
    callback(comments);
    
  }, (error) => {
    console.error('❌ Error loading comments:', error);
    callback([]);
  });
};

export const addComment = async (
  mediaId: string, 
  text: string, 
  userName: string, 
  deviceId: string
): Promise<void> => {
  await addDoc(collection(db, 'comments'), {
    mediaId,
    text,
    userName,
    deviceId,
    createdAt: new Date().toISOString()
  });
};

export const deleteComment = async (commentId: string): Promise<void> => {
  await deleteDoc(doc(db, 'comments', commentId));
};

export const loadLikes = (callback: (likes: Like[]) => void): () => void => {
  const q = query(collection(db, 'likes'), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const likes: Like[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Like));
    
    console.log(`❤️ Loaded ${likes.length} likes`);
    callback(likes);
    
  }, (error) => {
    console.error('❌ Error loading likes:', error);
    callback([]);
  });
};

export const toggleLike = async (
  mediaId: string,
  userName: string,
  deviceId: string
): Promise<void> => {
  // Check if user already liked this media
  const likesQuery = query(
    collection(db, 'likes'),
    where('mediaId', '==', mediaId),
    where('userName', '==', userName),
    where('deviceId', '==', deviceId)
  );
  
  const likesSnapshot = await getDocs(likesQuery);
  
  if (likesSnapshot.empty) {
    // Add like
    await addDoc(collection(db, 'likes'), {
      mediaId,
      userName,
      deviceId,
      createdAt: new Date().toISOString()
    });
  } else {
    // Remove like
    const likeDoc = likesSnapshot.docs[0];
    await deleteDoc(doc(db, 'likes', likeDoc.id));
  }
};