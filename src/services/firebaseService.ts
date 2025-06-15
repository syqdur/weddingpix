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
  getDocs
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

// Verbesserte Download-URL Funktion mit Retry-Logik
const getDownloadURLWithRetry = async (storageRef: any, maxRetries = 3): Promise<string> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const url = await getDownloadURL(storageRef);
      
      // Teste ob die URL funktioniert
      const testResponse = await fetch(url, { method: 'HEAD' });
      if (testResponse.ok) {
        return url;
      }
      throw new Error(`URL test failed: ${testResponse.status}`);
      
    } catch (error) {
      console.warn(`⚠️ Download URL attempt ${attempt}/${maxRetries} failed:`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Warte zwischen Versuchen
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw new Error('All retry attempts failed');
};

export const loadGallery = (callback: (items: MediaItem[]) => void): () => void => {
  const q = query(collection(db, 'media'), orderBy('uploadedAt', 'desc'));
  
  return onSnapshot(q, async (snapshot) => {
    console.log(`📊 Loading ${snapshot.docs.length} items from Firestore...`);
    const items: MediaItem[] = [];
    
    // Verarbeite Items einzeln für bessere Fehlerbehandlung
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      
      try {
        if (data.type === 'note') {
          // Handle note items
          items.push({
            id: docSnapshot.id,
            name: data.name,
            url: '', // Notes don't have URLs
            uploadedBy: data.uploadedBy,
            uploadedAt: data.uploadedAt,
            deviceId: data.deviceId,
            type: 'note',
            noteText: data.noteText
          });
          console.log(`✅ Note loaded: ${data.uploadedBy}`);
          
        } else {
          // Handle media items (images/videos)
          try {
            const storageRef = ref(storage, `uploads/${data.name}`);
            const url = await getDownloadURLWithRetry(storageRef);
            
            items.push({
              id: docSnapshot.id,
              name: data.name,
              url,
              uploadedBy: data.uploadedBy,
              uploadedAt: data.uploadedAt,
              deviceId: data.deviceId,
              type: data.type
            });
            
            console.log(`✅ Media loaded: ${data.name} (${data.type})`);
            
          } catch (urlError) {
            console.error(`❌ Failed to get URL for ${data.name}:`, urlError);
            
            // Füge Item mit Fehler-Platzhalter hinzu
            items.push({
              id: docSnapshot.id,
              name: data.name,
              url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkJpbGQgbmljaHQgdmVyZsO8Z2JhcjwvdGV4dD48L3N2Zz4=',
              uploadedBy: data.uploadedBy,
              uploadedAt: data.uploadedAt,
              deviceId: data.deviceId,
              type: data.type
            });
          }
        }
        
      } catch (itemError) {
        console.error(`❌ Error processing item ${docSnapshot.id}:`, itemError);
      }
    }
    
    console.log(`📊 Gallery loaded: ${items.length} items total`);
    console.log(`   📸 Images: ${items.filter(i => i.type === 'image').length}`);
    console.log(`   🎥 Videos: ${items.filter(i => i.type === 'video').length}`);
    console.log(`   💌 Notes: ${items.filter(i => i.type === 'note').length}`);
    
    callback(items);
    
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