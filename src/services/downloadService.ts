import JSZip from 'jszip';
import { MediaItem } from '../types';

// Alternative download method using a proxy approach
const downloadFileWithProxy = async (url: string, filename: string): Promise<Blob> => {
  try {
    // First try direct fetch
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      headers: {
        'Accept': '*/*',
        'Origin': window.location.origin
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    if (blob.size === 0) {
      throw new Error(`Empty file received for ${filename}`);
    }
    
    return blob;
  } catch (error) {
    console.error(`Direct fetch failed for ${filename}:`, error);
    
    // Fallback: Try using a different approach
    try {
      // Create a temporary link and try to download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      // This won't work for cross-origin, but we'll catch the error
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      throw new Error('CORS policy prevents direct download');
    } catch (fallbackError) {
      throw new Error(`Both direct and fallback methods failed: ${error}`);
    }
  }
};

// Alternative approach: Use Firebase Storage SDK directly
const downloadFileViaFirebaseSDK = async (item: MediaItem): Promise<Blob> => {
  try {
    // Extract the file path from the Firebase Storage URL
    const urlParts = item.url.split('/o/')[1];
    if (!urlParts) {
      throw new Error('Invalid Firebase Storage URL format');
    }
    
    const filePath = decodeURIComponent(urlParts.split('?')[0]);
    
    // Import Firebase Storage functions dynamically
    const { ref, getBlob } = await import('firebase/storage');
    const { storage } = await import('../config/firebase');
    
    const fileRef = ref(storage, filePath);
    const blob = await getBlob(fileRef);
    
    return blob;
  } catch (error) {
    console.error('Firebase SDK download failed:', error);
    throw error;
  }
};

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

  console.log(`Starting download of ${downloadableItems.length} media files...`);

  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  // Download each file and add to zip
  const downloadPromises = downloadableItems.map(async (item, index) => {
    try {
      console.log(`Downloading ${item.name}...`);
      
      let blob: Blob;
      
      try {
        // Try Firebase SDK first (most reliable)
        blob = await downloadFileViaFirebaseSDK(item);
        console.log(`✅ Downloaded ${item.name} via Firebase SDK, size: ${blob.size} bytes`);
      } catch (sdkError) {
        console.log(`Firebase SDK failed for ${item.name}, trying direct fetch...`);
        
        // Fallback to direct fetch
        blob = await downloadFileWithProxy(item.url, item.name);
        console.log(`✅ Downloaded ${item.name} via direct fetch, size: ${blob.size} bytes`);
      }
      
      if (blob.size === 0) {
        throw new Error(`Downloaded file is empty: ${item.name}`);
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
      console.log(`✅ Added ${fileName} to ZIP`);
      successCount++;
      
    } catch (error) {
      console.error(`❌ Error downloading ${item.name}:`, error);
      errorCount++;
      
      const errorMessage = `Fehler beim Herunterladen von ${item.name}:\n${error}\n\nUploader: ${item.uploadedBy}\nDatum: ${new Date(item.uploadedAt).toLocaleString('de-DE')}\nURL: ${item.url}\n\nMögliche Ursachen:\n- CORS-Richtlinien des Browsers\n- Netzwerkprobleme\n- Datei wurde gelöscht oder ist beschädigt`;
      
      errors.push(errorMessage);
      
      // Add error info to zip instead of failing completely
      const errorFileName = `ERROR_${item.name.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
      mediaFolder.file(errorFileName, errorMessage);
    }
  });

  await Promise.all(downloadPromises);

  console.log(`Download completed: ${successCount} successful, ${errorCount} failed`);

  // Create a text file with all notes
  const notes = mediaItems.filter(item => item.type === 'note' && item.noteText);
  if (notes.length > 0) {
    let notesContent = '=== 💌 HOCHZEITSNOTIZEN ===\n\n';
    notesContent += `Insgesamt ${notes.length} liebevolle Nachricht${notes.length > 1 ? 'en' : ''} von den Gästen:\n\n`;
    
    notes.forEach((note, index) => {
      const timestamp = new Date(note.uploadedAt).toLocaleString('de-DE');
      notesContent += `${String(index + 1).padStart(2, '0')}. 💕 Von: ${note.uploadedBy}\n`;
      notesContent += `    📅 Datum: ${timestamp}\n`;
      notesContent += `    💌 Nachricht: "${note.noteText}"\n`;
      notesContent += `    ${'='.repeat(60)}\n\n`;
    });
    
    notesContent += '\n💕 Vielen Dank für all die wunderschönen Worte! 💕';
    
    mediaFolder.file('💌_Hochzeitsnotizen.txt', notesContent);
  }

  // Create detailed summary file
  const summary = `=== 📸 HOCHZEITS-MEDIEN ÜBERSICHT ===

Heruntergeladen am: ${new Date().toLocaleString('de-DE')}
Von: kristinundmauro.de

📊 DOWNLOAD-STATISTIKEN:
- ✅ Erfolgreich: ${successCount} Dateien
- ❌ Fehlgeschlagen: ${errorCount} Dateien
- 📝 Notizen: ${notes.length}
- 📁 Gesamt: ${mediaItems.length} Beiträge

📈 MEDIEN-AUFSCHLÜSSELUNG:
- 📸 Bilder: ${mediaItems.filter(item => item.type === 'image').length}
- 🎥 Videos: ${mediaItems.filter(item => item.type === 'video').length}
- 💌 Notizen: ${notes.length}

👥 BEITRÄGE PRO GAST:
${Array.from(new Set(mediaItems.map(item => item.uploadedBy)))
  .map(uploader => {
    const userItems = mediaItems.filter(item => item.uploadedBy === uploader);
    const images = userItems.filter(item => item.type === 'image').length;
    const videos = userItems.filter(item => item.type === 'video').length;
    const userNotes = userItems.filter(item => item.type === 'note').length;
    
    let details = [];
    if (images > 0) details.push(`${images} Bild${images > 1 ? 'er' : ''}`);
    if (videos > 0) details.push(`${videos} Video${videos > 1 ? 's' : ''}`);
    if (userNotes > 0) details.push(`${userNotes} Notiz${userNotes > 1 ? 'en' : ''}`);
    
    return `- 👤 ${uploader}: ${details.join(', ')} (${userItems.length} gesamt)`;
  }).join('\n')}

${errorCount > 0 ? `
⚠️  DOWNLOAD-PROBLEME:
${errorCount} Datei${errorCount > 1 ? 'en' : ''} konnte${errorCount > 1 ? 'n' : ''} nicht heruntergeladen werden.
Siehe ERROR_*.txt Dateien für Details.

Häufige Ursachen:
- Browser-Sicherheitsrichtlinien (CORS)
- Temporäre Netzwerkprobleme
- Gelöschte oder beschädigte Dateien

Lösungsvorschläge:
- Versuche den Download erneut
- Verwende einen anderen Browser
- Kontaktiere den Website-Administrator
` : '✅ Alle Dateien erfolgreich heruntergeladen!'}

💕 Vielen Dank an alle Gäste für die wunderschönen Erinnerungen!
💍 Kristin & Maurizio - 12.07.2025

---
Erstellt mit ❤️ von kristinundmauro.de
`;

  mediaFolder.file('📊_Download_Übersicht.txt', summary);

  // Add troubleshooting guide if there were errors
  if (errorCount > 0) {
    const troubleshootingGuide = `=== 🔧 FEHLERBEHEBUNG ===

${errorCount} von ${downloadableItems.length} Dateien konnten nicht heruntergeladen werden.

🚨 HÄUFIGE PROBLEME UND LÖSUNGEN:

1. 🌐 CORS-Richtlinien (Cross-Origin Resource Sharing)
   Problem: Browser blockiert Downloads von externen Servern
   Lösung: 
   - Versuche einen anderen Browser (Chrome, Firefox, Safari)
   - Deaktiviere temporär Adblocker/Extensions
   - Verwende Inkognito-/Privat-Modus

2. 🔒 Sicherheitseinstellungen
   Problem: Browser-Sicherheit verhindert Downloads
   Lösung:
   - Erlaube Downloads für diese Website
   - Überprüfe Popup-Blocker Einstellungen

3. 📶 Netzwerkprobleme
   Problem: Instabile Internetverbindung
   Lösung:
   - Überprüfe deine Internetverbindung
   - Versuche es zu einem späteren Zeitpunkt
   - Verwende eine stabilere Verbindung (WLAN statt Mobilfunk)

4. 🗂️ Datei-Probleme
   Problem: Datei wurde gelöscht oder ist beschädigt
   Lösung:
   - Kontaktiere den Website-Administrator
   - Überprüfe ob die Datei noch in der Galerie sichtbar ist

📞 SUPPORT:
Falls die Probleme weiterhin bestehen, kontaktiere:
- Website: kristinundmauro.de
- Die Fehlerdetails findest du in den ERROR_*.txt Dateien

💡 TIPP: 
Versuche den Download zu verschiedenen Tageszeiten, da Server-Last 
die Download-Geschwindigkeit beeinflussen kann.
`;

    mediaFolder.file('🔧_Fehlerbehebung.txt', troubleshootingGuide);
  }

  console.log('Generating ZIP file...');
  
  // Generate and download the zip file
  const zipBlob = await zip.generateAsync({ 
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 6
    }
  });
  
  console.log(`ZIP file generated, size: ${(zipBlob.size / 1024 / 1024).toFixed(2)} MB`);
  
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
  
  console.log('✅ ZIP download completed!');
  
  // Show summary to user
  if (errorCount > 0) {
    throw new Error(`Download teilweise erfolgreich: ${successCount} von ${downloadableItems.length} Dateien heruntergeladen. Siehe ZIP-Datei für Details zu den Fehlern.`);
  }
};