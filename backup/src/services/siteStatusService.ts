import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface SiteStatus {
  isUnderConstruction: boolean;
  lastUpdated: string;
  updatedBy: string;
}

const SITE_STATUS_DOC = 'site_status';

// Get current site status
export const getSiteStatus = async (): Promise<SiteStatus> => {
  try {
    const docRef = doc(db, 'settings', SITE_STATUS_DOC);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as SiteStatus;
    } else {
      // Default: site is under construction
      const defaultStatus: SiteStatus = {
        isUnderConstruction: true,
        lastUpdated: new Date().toISOString(),
        updatedBy: 'system'
      };
      
      // Create the document with default status
      await setDoc(docRef, defaultStatus);
      return defaultStatus;
    }
  } catch (error) {
    console.error('Error getting site status:', error);
    // Fallback to under construction if Firebase fails
    return {
      isUnderConstruction: true,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'system'
    };
  }
};

// Update site status (admin only)
export const updateSiteStatus = async (
  isUnderConstruction: boolean, 
  adminName: string
): Promise<void> => {
  try {
    const docRef = doc(db, 'settings', SITE_STATUS_DOC);
    const newStatus: SiteStatus = {
      isUnderConstruction,
      lastUpdated: new Date().toISOString(),
      updatedBy: adminName
    };
    
    await setDoc(docRef, newStatus);
    console.log(`Site status updated: ${isUnderConstruction ? 'Under Construction' : 'Live'} by ${adminName}`);
  } catch (error) {
    console.error('Error updating site status:', error);
    throw new Error('Fehler beim Aktualisieren des Website-Status');
  }
};

// Listen to site status changes in real-time
export const subscribeSiteStatus = (
  callback: (status: SiteStatus) => void
): (() => void) => {
  const docRef = doc(db, 'settings', SITE_STATUS_DOC);
  
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data() as SiteStatus);
    } else {
      // If document doesn't exist, create it with default status
      const defaultStatus: SiteStatus = {
        isUnderConstruction: true,
        lastUpdated: new Date().toISOString(),
        updatedBy: 'system'
      };
      
      setDoc(docRef, defaultStatus).then(() => {
        callback(defaultStatus);
      });
    }
  }, (error) => {
    console.error('Error listening to site status:', error);
    // Fallback to under construction on error
    callback({
      isUnderConstruction: true,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'system'
    });
  });
};