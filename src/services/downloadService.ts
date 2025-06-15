import JSZip from 'jszip';
import { MediaItem } from '../types';

export const downloadAllMedia = async (mediaItems: MediaItem[]): Promise<void> => {
  const zip = new JSZip();
  const mediaFolder = zip.folder('Hochzeitsbilder_und_Videos');
  
  if (!mediaFolder) {
    throw new Error('Could not create zip folder');
  }

  // Filter out notes as they don't have downloadable files
  const downloadableItems = mediaItems.filter(item => item.type !== 'note' && item.url);
  
  if (downloadableItems.length === 0) {
    throw new Error('Keine herunterladbaren Medien gefunden');
  }

  // Download each file and add to zip
  const downloadPromises = downloadableItems.map(async (item, index) => {
    try {
      const response = await fetch(item.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${item.name}`);
      }
      
      const blob = await response.blob();
      const fileExtension = item.type === 'video' ? 
        (item.name.includes('.') ? item.name.split('.').pop() : 'mp4') :
        (item.name.includes('.') ? item.name.split('.').pop() : 'jpg');
      
      // Create a clean filename with timestamp and uploader
      const timestamp = new Date(item.uploadedAt).toISOString().slice(0, 19).replace(/:/g, '-');
      const cleanUploaderName = item.uploadedBy.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${timestamp}_${cleanUploaderName}_${index + 1}.${fileExtension}`;
      
      mediaFolder.file(fileName, blob);
    } catch (error) {
      console.error(`Error downloading ${item.name}:`, error);
      // Continue with other files even if one fails
    }
  });

  await Promise.all(downloadPromises);

  // Create a text file with all notes
  const notes = mediaItems.filter(item => item.type === 'note' && item.noteText);
  if (notes.length > 0) {
    let notesContent = '=== HOCHZEITSNOTIZEN ===\n\n';
    notes.forEach((note, index) => {
      const timestamp = new Date(note.uploadedAt).toLocaleString('de-DE');
      notesContent += `${index + 1}. Von: ${note.uploadedBy}\n`;
      notesContent += `   Datum: ${timestamp}\n`;
      notesContent += `   Nachricht: "${note.noteText}"\n\n`;
    });
    
    mediaFolder.file('Hochzeitsnotizen.txt', notesContent);
  }

  // Generate and download the zip file
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  
  // Create download link
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  
  const today = new Date().toISOString().slice(0, 10);
  link.download = `Hochzeitsbilder_${today}.zip`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
};