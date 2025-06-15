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
import { MediaItem, Comment } from '../types';

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

export const loadGallery = (callback: (items: MediaItem[]) => void): () => void => {
  const q = query(collection(db, 'media'), orderBy('uploadedAt', 'desc'));
  
  return onSnapshot(q, async (snapshot) => {
    const items: MediaItem[] = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
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
    
    callback(items);
  });
};

export const deleteMediaItem = async (item: MediaItem): Promise<void> => {
  // Delete from storage
  const storageRef = ref(storage, `uploads/${item.name}`);
  await deleteObject(storageRef);
  
  // Delete from Firestore
  await deleteDoc(doc(db, 'media', item.id));
  
  // Delete associated comments
  const commentsQuery = query(
    collection(db, 'comments'), 
    where('mediaId', '==', item.id)
  );
  const commentsSnapshot = await getDocs(commentsQuery);
  
  const deletePromises = commentsSnapshot.docs.map(commentDoc => 
    deleteDoc(doc(db, 'comments', commentDoc.id))
  );
  
  await Promise.all(deletePromises);
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