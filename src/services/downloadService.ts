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

  console.log(`Downloading ${downloadableItems.length} media files...`);

  // Download each file and add to zip
  const downloadPromises = downloadableItems.map(async (item, index) => {
    try {
      console.log(`Downloading ${item.name}...`);
      
      // Use fetch with proper headers for Firebase Storage
      const response = await fetch(item.url, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': '*/*',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log(`Downloaded ${item.name}, size: ${blob.size} bytes`);
      
      if (blob.size === 0) {
        throw new Error(`Empty file: ${item.name}`);
      }
      
      // Determine file extension
      let fileExtension = 'bin'; // fallback
      
      if (item.type === 'video') {
        if (item.name.includes('.webm')) fileExtension = 'webm';
        else if (item.name.includes('.mp4')) fileExtension = 'mp4';
        else if (item.name.includes('.mov')) fileExtension = 'mov';
        else if (blob.type.includes('webm')) fileExtension = 'webm';
        else if (blob.type.includes('mp4')) fileExtension = 'mp4';
        else fileExtension = 'mp4'; // default for videos
      } else {
        if (item.name.includes('.jpg') || item.name.includes('.jpeg')) fileExtension = 'jpg';
        else if (item.name.includes('.png')) fileExtension = 'png';
        else if (item.name.includes('.gif')) fileExtension = 'gif';
        else if (item.name.includes('.webp')) fileExtension = 'webp';
        else if (blob.type.includes('jpeg')) fileExtension = 'jpg';
        else if (blob.type.includes('png')) fileExtension = 'png';
        else if (blob.type.includes('gif')) fileExtension = 'gif';
        else if (blob.type.includes('webp')) fileExtension = 'webp';
        else fileExtension = 'jpg'; // default for images
      }
      
      // Create a clean filename with timestamp and uploader
      const timestamp = new Date(item.uploadedAt).toISOString().slice(0, 19).replace(/:/g, '-');
      const cleanUploaderName = item.uploadedBy.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_');
      const fileName = `${timestamp}_${cleanUploaderName}_${String(index + 1).padStart(3, '0')}.${fileExtension}`;
      
      mediaFolder.file(fileName, blob);
      console.log(`Added ${fileName} to ZIP`);
      
    } catch (error) {
      console.error(`Error downloading ${item.name}:`, error);
      
      // Add error info to zip instead of failing completely
      const errorInfo = `Fehler beim Herunterladen von ${item.name}:\n${error}\n\nUploader: ${item.uploadedBy}\nDatum: ${new Date(item.uploadedAt).toLocaleString('de-DE')}\nURL: ${item.url}`;
      mediaFolder.file(`ERROR_${item.name.replace(/[^a-zA-Z0-9]/g, '_')}.txt`, errorInfo);
    }
  });

  await Promise.all(downloadPromises);

  // Create a text file with all notes
  const notes = mediaItems.filter(item => item.type === 'note' && item.noteText);
  if (notes.length > 0) {
    let notesContent = '=== HOCHZEITSNOTIZEN ===\n\n';
    notesContent += `Insgesamt ${notes.length} Notiz${notes.length > 1 ? 'en' : ''} von den Gästen:\n\n`;
    
    notes.forEach((note, index) => {
      const timestamp = new Date(note.uploadedAt).toLocaleString('de-DE');
      notesContent += `${String(index + 1).padStart(2, '0')}. Von: ${note.uploadedBy}\n`;
      notesContent += `    Datum: ${timestamp}\n`;
      notesContent += `    Nachricht: "${note.noteText}"\n`;
      notesContent += `    ${'='.repeat(50)}\n\n`;
    });
    
    mediaFolder.file('📝_Hochzeitsnotizen.txt', notesContent);
  }

  // Create summary file
  const summary = `=== HOCHZEITS-MEDIEN ÜBERSICHT ===

Heruntergeladen am: ${new Date().toLocaleString('de-DE')}

📊 STATISTIKEN:
- Bilder: ${mediaItems.filter(item => item.type === 'image').length}
- Videos: ${mediaItems.filter(item => item.type === 'video').length}
- Notizen: ${notes.length}
- Gesamt: ${mediaItems.length} Beiträge

👥 BEITRÄGE PRO PERSON:
${Array.from(new Set(mediaItems.map(item => item.uploadedBy)))
  .map(uploader => {
    const userItems = mediaItems.filter(item => item.uploadedBy === uploader);
    return `- ${uploader}: ${userItems.length} Beitrag${userItems.length > 1 ? 'e' : ''}`;
  }).join('\n')}

💕 Vielen Dank an alle Gäste für die wunderschönen Erinnerungen!
`;

  mediaFolder.file('📊_Übersicht.txt', summary);

  console.log('Generating ZIP file...');
  
  // Generate and download the zip file
  const zipBlob = await zip.generateAsync({ 
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 6
    }
  });
  
  console.log(`ZIP file generated, size: ${zipBlob.size} bytes`);
  
  // Create download link
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  
  const today = new Date().toISOString().slice(0, 10);
  link.download = `Hochzeitsbilder_Kristin_Maurizio_${today}.zip`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
  
  console.log('Download completed!');
};