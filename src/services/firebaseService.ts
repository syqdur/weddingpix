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

export const loadGallery = (callback: (items: MediaItem[]) => void): () => void => {
  const q = query(collection(db, 'media'), orderBy('uploadedAt', 'desc'));
  
  return onSnapshot(q, async (snapshot) => {
    const items: MediaItem[] = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      if (data.type === 'note') {
        // Handle note items
        items.push({
          id: doc.id,
          name: data.name,
          url: '', // Notes don't have URLs
          uploadedBy: data.uploadedBy,
          uploadedAt: data.uploadedAt,
          deviceId: data.deviceId,
          type: 'note',
          noteText: data.noteText
        });
      } else {
        // Handle media items (images/videos)
        try {
          const storageRef = ref(storage, `uploads/${data.name}`);
          const url = await getDownloadURL(storageRef);
          
          items.push({
            id: doc.id,
            name: data.name,
            url,
            uploadedBy: data.uploadedBy,
            uploadedAt: data.uploadedAt,
            deviceId: data.deviceId,
            type: data.type
          });
        } catch (error) {
          console.error('Error loading item:', error);
        }
      }
    }
    
    callback(items);
  });
};

export const deleteMediaItem = async (item: MediaItem): Promise<void> => {
  // Delete from storage (only if it's not a note)
  if (item.type !== 'note') {
    const storageRef = ref(storage, `uploads/${item.name}`);
    await deleteObject(storageRef);
  }
  
  // Delete from Firestore
  await deleteDoc(doc(db, 'media', item.id));
  
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
};

export const loadComments = (callback: (comments: Comment[]) => void): () => void => {
  const q = query(collection(db, 'comments'), orderBy('createdAt', 'asc'));
  
  return onSnapshot(q, (snapshot) => {
    const comments: Comment[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Comment));
    
    callback(comments);
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
    
    callback(likes);
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