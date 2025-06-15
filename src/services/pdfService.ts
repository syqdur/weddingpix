import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { MediaItem } from '../types';

interface PDFOptions {
  title: string;
  subtitle: string;
  includeNotes: boolean;
  layout: 'portrait' | 'landscape';
  quality: 'standard' | 'high';
}

// Optimierte Bildladung mit Timeout und besserer Fehlerbehandlung
const loadImageAsBase64 = async (url: string, timeout: number = 10000): Promise<string> => {
  console.log(`🖼️ Loading image: ${url}`);
  
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Image loading timeout'));
    }, timeout);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      clearTimeout(timeoutId);
      
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        
        // Optimierte Bildgröße für PDF
        const maxSize = 1200;
        let { width, height } = img;
        
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        const quality = 0.8; // Gute Balance zwischen Qualität und Größe
        const dataURL = canvas.toDataURL('image/jpeg', quality);
        
        if (dataURL === 'data:,') {
          reject(new Error('Canvas conversion failed'));
          return;
        }
        
        console.log(`✅ Image loaded successfully`);
        resolve(dataURL);
      } catch (canvasError) {
        reject(new Error(`Canvas error: ${canvasError}`));
      }
    };
    
    img.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error('Image loading failed'));
    };
    
    // Cache-busting für bessere Kompatibilität
    const imageUrl = url.includes('?') ? `${url}&t=${Date.now()}` : `${url}?t=${Date.now()}`;
    img.src = imageUrl;
  });
};

// Elegante Seitenhintergrund-Funktion
const createElegantBackground = (pdf: jsPDF) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Cremefarbener Hintergrund
  pdf.setFillColor(255, 253, 250);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Dezenter goldener Rahmen
  pdf.setDrawColor(218, 165, 32);
  pdf.setLineWidth(0.8);
  pdf.rect(15, 15, pageWidth - 30, pageHeight - 30, 'S');
  
  // Innerer Rahmen
  pdf.setDrawColor(184, 134, 11);
  pdf.setLineWidth(0.3);
  pdf.rect(20, 20, pageWidth - 40, pageHeight - 40, 'S');
};

// Elegante Titelseite
const createElegantCoverPage = (pdf: jsPDF, options: PDFOptions) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  createElegantBackground(pdf);
  
  // Haupttitel - angemessene Größe
  pdf.setFont('times', 'bold');
  pdf.setFontSize(28);
  pdf.setTextColor(139, 69, 19);
  pdf.text(options.title, pageWidth / 2, pageHeight * 0.25, { align: 'center' });
  
  // Dezente Linie
  pdf.setDrawColor(184, 134, 11);
  pdf.setLineWidth(1);
  pdf.line(pageWidth / 2 - 80, pageHeight * 0.28, pageWidth / 2 + 80, pageHeight * 0.28);
  
  // Untertitel - kleinere Schrift
  pdf.setFont('times', 'italic');
  pdf.setFontSize(14);
  pdf.setTextColor(101, 67, 33);
  
  const subtitleLines = options.subtitle.split('\n');
  subtitleLines.forEach((line, index) => {
    pdf.text(line, pageWidth / 2, pageHeight * 0.32 + (index * 18), { align: 'center' });
  });
  
  // Hochzeitsdatum in elegantem Rahmen
  pdf.setFillColor(255, 248, 220);
  pdf.roundedRect(pageWidth / 2 - 60, pageHeight * 0.45, 120, 30, 5, 5, 'F');
  
  pdf.setDrawColor(184, 134, 11);
  pdf.setLineWidth(1);
  pdf.roundedRect(pageWidth / 2 - 60, pageHeight * 0.45, 120, 30, 5, 5, 'S');
  
  pdf.setFont('times', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(139, 69, 19);
  pdf.text('12. Juli 2025', pageWidth / 2, pageHeight * 0.465, { align: 'center' });
  
  // Dezente Herzen
  pdf.setFont('times', 'normal');
  pdf.setFontSize(12);
  pdf.setTextColor(205, 92, 92);
  pdf.text('♥', pageWidth / 2 - 25, pageHeight * 0.55, { align: 'center' });
  pdf.text('♥', pageWidth / 2 + 25, pageHeight * 0.55, { align: 'center' });
  
  // Romantisches Zitat
  pdf.setFont('times', 'italic');
  pdf.setFontSize(12);
  pdf.setTextColor(139, 115, 85);
  pdf.text('Ein Tag voller Liebe, Freude und unvergesslicher Momente', pageWidth / 2, pageHeight * 0.62, { align: 'center' });
  
  // Footer
  pdf.setFont('times', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(101, 67, 33);
  pdf.text('Mit Liebe erstellt von kristinundmauro.de', pageWidth / 2, pageHeight - 40, { align: 'center' });
  
  const currentDate = new Date().toLocaleDateString('de-DE');
  pdf.setFontSize(8);
  pdf.setTextColor(139, 115, 85);
  pdf.text(`Erstellt am ${currentDate}`, pageWidth / 2, pageHeight - 25, { align: 'center' });
};

// Statistik-Seite mit angemessener Schriftgröße
const createStatsPage = (pdf: jsPDF, mediaItems: MediaItem[]) => {
  pdf.addPage();
  createElegantBackground(pdf);
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPosition = 50;
  
  // Titel - angemessene Größe
  pdf.setFont('times', 'bold');
  pdf.setFontSize(20);
  pdf.setTextColor(139, 69, 19);
  pdf.text('Hochzeits-Statistiken', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 35;
  
  // Statistiken
  const stats = {
    totalItems: mediaItems.length,
    images: mediaItems.filter(item => item.type === 'image').length,
    videos: mediaItems.filter(item => item.type === 'video').length,
    notes: mediaItems.filter(item => item.type === 'note').length,
    contributors: new Set(mediaItems.map(item => item.uploadedBy)).size
  };
  
  const statsData = [
    { label: 'Gesamte Beiträge', value: stats.totalItems, color: [52, 152, 219] },
    { label: 'Bilder', value: stats.images, color: [46, 204, 113] },
    { label: 'Videos', value: stats.videos, color: [155, 89, 182] },
    { label: 'Nachrichten', value: stats.notes, color: [231, 76, 60] },
    { label: 'Gäste', value: stats.contributors, color: [230, 126, 34] }
  ];
  
  statsData.forEach((stat, index) => {
    const boxY = yPosition + (index * 30);
    
    // Eleganter Hintergrund
    pdf.setFillColor(255, 250, 245);
    pdf.roundedRect(40, boxY - 10, pageWidth - 80, 20, 3, 3, 'F');
    
    pdf.setDrawColor(184, 134, 11);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(40, boxY - 10, pageWidth - 80, 20, 3, 3, 'S');
    
    // Label - kleinere Schrift
    pdf.setFont('times', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(101, 67, 33);
    pdf.text(stat.label, 50, boxY + 2);
    
    // Wert in kleinem Kreis
    pdf.setFillColor(...stat.color);
    pdf.circle(pageWidth - 60, boxY, 8, 'F');
    
    pdf.setFont('times', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(255, 255, 255);
    pdf.text(stat.value.toString(), pageWidth - 60, boxY + 3, { align: 'center' });
  });
  
  yPosition += statsData.length * 30 + 25;
  
  // Gäste-Liste
  if (stats.contributors > 0) {
    pdf.setFont('times', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(139, 69, 19);
    pdf.text('Unsere Gäste', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 20;
    
    const contributors = Array.from(new Set(mediaItems.map(item => item.uploadedBy)));
    contributors.forEach((contributor, index) => {
      const userItems = mediaItems.filter(item => item.uploadedBy === contributor);
      const userStats = {
        images: userItems.filter(item => item.type === 'image').length,
        videos: userItems.filter(item => item.type === 'video').length,
        notes: userItems.filter(item => item.type === 'note').length
      };
      
      pdf.setFont('times', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(101, 67, 33);
      
      let contributionText = `${contributor}`;
      const contributions = [];
      if (userStats.images > 0) contributions.push(`${userStats.images} Bild${userStats.images > 1 ? 'er' : ''}`);
      if (userStats.videos > 0) contributions.push(`${userStats.videos} Video${userStats.videos > 1 ? 's' : ''}`);
      if (userStats.notes > 0) contributions.push(`${userStats.notes} Nachricht${userStats.notes > 1 ? 'en' : ''}`);
      
      if (contributions.length > 0) {
        contributionText += ` - ${contributions.join(', ')}`;
      }
      
      pdf.setFillColor(184, 134, 11);
      pdf.circle(45, yPosition + (index * 12) - 1, 1, 'F');
      
      pdf.text(contributionText, 50, yPosition + (index * 12));
    });
  }
};

// Notizen-Seite
const createNotesPage = (pdf: jsPDF, mediaItems: MediaItem[]) => {
  const notes = mediaItems.filter(item => item.type === 'note' && item.noteText);
  
  if (notes.length === 0) return;
  
  pdf.addPage();
  createElegantBackground(pdf);
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 50;
  
  // Titel
  pdf.setFont('times', 'bold');
  pdf.setFontSize(20);
  pdf.setTextColor(139, 69, 19);
  pdf.text('Liebevolle Nachrichten', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 30;
  
  notes.forEach((note, index) => {
    // Neue Seite wenn nötig
    if (yPosition > pageHeight - 80) {
      pdf.addPage();
      createElegantBackground(pdf);
      yPosition = 50;
    }
    
    // Notiz-Container
    pdf.setFillColor(255, 248, 220);
    pdf.roundedRect(30, yPosition - 8, pageWidth - 60, 50, 5, 5, 'F');
    
    pdf.setDrawColor(184, 134, 11);
    pdf.setLineWidth(0.8);
    pdf.roundedRect(30, yPosition - 8, pageWidth - 60, 50, 5, 5, 'S');
    
    // Autor
    pdf.setFont('times', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(139, 69, 19);
    pdf.text(`Von ${note.uploadedBy}`, 35, yPosition + 5);
    
    // Datum
    pdf.setFont('times', 'italic');
    pdf.setFontSize(9);
    pdf.setTextColor(139, 115, 85);
    const noteDate = new Date(note.uploadedAt).toLocaleDateString('de-DE');
    pdf.text(noteDate, pageWidth - 35, yPosition + 5, { align: 'right' });
    
    // Notiz-Text
    pdf.setFont('times', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(101, 67, 33);
    
    const noteLines = pdf.splitTextToSize(`"${note.noteText}"`, pageWidth - 70);
    pdf.text(noteLines, 35, yPosition + 18);
    
    yPosition += 60;
  });
};

// Optimierte Bild-Seite mit besserer Performance
const addImagePage = async (pdf: jsPDF, imageUrl: string, item: MediaItem, pageIndex: number, onProgress?: (progress: number) => void) => {
  try {
    console.log(`🎨 Processing image ${pageIndex}: ${imageUrl}`);
    
    if (onProgress) onProgress(0);
    
    const base64Image = await loadImageAsBase64(imageUrl, 8000); // 8 Sekunden Timeout
    console.log(`✅ Image ${pageIndex} loaded successfully`);
    
    if (onProgress) onProgress(50);
    
    pdf.addPage();
    createElegantBackground(pdf);
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Seitentitel
    pdf.setFont('times', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(139, 69, 19);
    pdf.text(`Bild ${pageIndex}`, pageWidth / 2, 35, { align: 'center' });
    
    // Bild-Dimensionen berechnen
    const maxWidth = pageWidth - 60;
    const maxHeight = pageHeight - 120;
    
    // Temporäres Bild für Dimensionen
    const tempImg = new Image();
    tempImg.src = base64Image;
    
    await new Promise((resolve) => {
      tempImg.onload = resolve;
    });
    
    const aspectRatio = tempImg.width / tempImg.height;
    let imgWidth = maxWidth;
    let imgHeight = imgWidth / aspectRatio;
    
    if (imgHeight > maxHeight) {
      imgHeight = maxHeight;
      imgWidth = imgHeight * aspectRatio;
    }
    
    const x = (pageWidth - imgWidth) / 2;
    const y = 50;
    
    // Eleganter Rahmen
    // Schatten
    pdf.setFillColor(220, 220, 220);
    pdf.rect(x - 6, y - 6, imgWidth + 12, imgHeight + 12, 'F');
    
    // Goldener Rahmen
    pdf.setFillColor(184, 134, 11);
    pdf.rect(x - 4, y - 4, imgWidth + 8, imgHeight + 8, 'F');
    
    // Weißer Innenrahmen
    pdf.setFillColor(255, 255, 255);
    pdf.rect(x - 2, y - 2, imgWidth + 4, imgHeight + 4, 'F');
    
    // Bild hinzufügen
    pdf.addImage(base64Image, 'JPEG', x, y, imgWidth, imgHeight);
    
    if (onProgress) onProgress(90);
    
    // Metadaten
    const metaY = y + imgHeight + 20;
    
    pdf.setFillColor(255, 248, 220);
    pdf.roundedRect(40, metaY - 6, pageWidth - 80, 20, 3, 3, 'F');
    
    pdf.setDrawColor(184, 134, 11);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(40, metaY - 6, pageWidth - 80, 20, 3, 3, 'S');
    
    pdf.setFont('times', 'italic');
    pdf.setFontSize(10);
    pdf.setTextColor(139, 69, 19);
    
    const uploadDate = new Date(item.uploadedAt).toLocaleDateString('de-DE');
    pdf.text(`Von ${item.uploadedBy} am ${uploadDate}`, pageWidth / 2, metaY + 4, { align: 'center' });
    
    if (onProgress) onProgress(100);
    
    console.log(`✅ Image ${pageIndex} successfully added to PDF`);
    
  } catch (error) {
    console.error(`❌ Error adding image ${pageIndex}:`, error);
    
    // Fehler-Seite
    pdf.addPage();
    createElegantBackground(pdf);
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    pdf.setFont('times', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(139, 69, 19);
    pdf.text('Bild konnte nicht geladen werden', pageWidth / 2, pageHeight / 2 - 25, { align: 'center' });
    
    pdf.setFont('times', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(139, 115, 85);
    pdf.text(`Von ${item.uploadedBy}`, pageWidth / 2, pageHeight / 2 - 5, { align: 'center' });
    
    const uploadDate = new Date(item.uploadedAt).toLocaleDateString('de-DE');
    pdf.text(`Datum: ${uploadDate}`, pageWidth / 2, pageHeight / 2 + 10, { align: 'center' });
    
    pdf.setFont('times', 'italic');
    pdf.setFontSize(10);
    pdf.setTextColor(180, 180, 180);
    pdf.text('Das Bild ist möglicherweise nicht mehr verfügbar', pageWidth / 2, pageHeight / 2 + 30, { align: 'center' });
    
    if (onProgress) onProgress(100);
  }
};

export const generatePDFPhotobook = async (
  mediaItems: MediaItem[],
  options: PDFOptions = {
    title: 'Kristin & Maurizio',
    subtitle: 'Unsere Hochzeit in Bildern\nDie schönsten Momente unseres besonderen Tages',
    includeNotes: true,
    layout: 'portrait',
    quality: 'high'
  },
  onProgress?: (progress: number, status: string) => void
): Promise<void> => {
  try {
    console.log('🎨 Starting optimized PDF generation...');
    
    if (onProgress) onProgress(5, 'PDF wird initialisiert...');
    
    // PDF erstellen
    const pdf = new jsPDF({
      orientation: options.layout,
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    
    // Titelseite
    console.log('👑 Creating cover page...');
    if (onProgress) onProgress(10, 'Titelseite wird erstellt...');
    createElegantCoverPage(pdf, options);
    
    // Statistik-Seite
    console.log('📊 Creating statistics page...');
    if (onProgress) onProgress(15, 'Statistiken werden erstellt...');
    createStatsPage(pdf, mediaItems);
    
    // Notizen-Seite
    if (options.includeNotes) {
      console.log('💌 Creating notes page...');
      if (onProgress) onProgress(20, 'Nachrichten werden formatiert...');
      createNotesPage(pdf, mediaItems);
    }
    
    // Bilder hinzufügen
    const images = mediaItems.filter(item => item.type === 'image' && item.url);
    
    if (images.length > 0) {
      console.log(`🖼️ Adding ${images.length} images...`);
      
      if (onProgress) onProgress(25, 'Bilder-Sektion wird vorbereitet...');
      
      // Bilder-Trennseite
      pdf.addPage();
      createElegantBackground(pdf);
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      pdf.setFont('times', 'bold');
      pdf.setFontSize(24);
      pdf.setTextColor(139, 69, 19);
      pdf.text('Unsere Hochzeitsbilder', pageWidth / 2, pageHeight / 2 - 15, { align: 'center' });
      
      pdf.setFont('times', 'italic');
      pdf.setFontSize(14);
      pdf.setTextColor(139, 115, 85);
      pdf.text(`${images.length} wunderschöne Erinnerungen`, pageWidth / 2, pageHeight / 2 + 5, { align: 'center' });
      
      // Jedes Bild hinzufügen mit Progress-Updates
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const progressPercent = 30 + ((i / images.length) * 60); // 30-90% für Bilder
        
        if (onProgress) onProgress(progressPercent, `Bild ${i + 1} von ${images.length} wird verarbeitet...`);
        
        console.log(`Processing image ${i + 1} of ${images.length}...`);
        
        await addImagePage(pdf, image.url, image, i + 1, (imageProgress) => {
          const totalProgress = progressPercent + (imageProgress / images.length * 0.6);
          if (onProgress) onProgress(totalProgress, `Bild ${i + 1} wird geladen... ${imageProgress}%`);
        });
        
        // Kleine Pause um UI responsive zu halten
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    // Dankesseite
    console.log('💕 Creating thank you page...');
    if (onProgress) onProgress(95, 'Dankesseite wird erstellt...');
    
    pdf.addPage();
    createElegantBackground(pdf);
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    pdf.setFont('times', 'bold');
    pdf.setFontSize(22);
    pdf.setTextColor(139, 69, 19);
    pdf.text('Vielen herzlichen Dank!', pageWidth / 2, pageHeight / 2 - 50, { align: 'center' });
    
    pdf.setFont('times', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(101, 67, 33);
    
    const thankYouText = [
      'Danke an alle unsere lieben Gäste,',
      'die diese wunderschönen Momente',
      'mit uns geteilt haben!',
      '',
      'Eure Liebe und Freude haben',
      'unseren besonderen Tag unvergesslich gemacht.',
      '',
      'In ewiger Dankbarkeit,'
    ];
    
    thankYouText.forEach((line, index) => {
      pdf.text(line, pageWidth / 2, pageHeight / 2 - 25 + (index * 10), { align: 'center' });
    });
    
    // Signatur
    pdf.setFont('times', 'italic');
    pdf.setFontSize(18);
    pdf.setTextColor(139, 69, 19);
    pdf.text('Kristin & Maurizio', pageWidth / 2, pageHeight / 2 + 40, { align: 'center' });
    
    // Herzen
    pdf.setFont('times', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(205, 92, 92);
    pdf.text('♥', pageWidth / 2 - 25, pageHeight / 2 + 55, { align: 'center' });
    pdf.text('♥', pageWidth / 2 + 25, pageHeight / 2 + 55, { align: 'center' });
    
    // Dateiname
    const today = new Date().toISOString().slice(0, 10);
    const filename = `Hochzeitsfotobuch_Kristin_Maurizio_${today}.pdf`;
    
    // PDF speichern
    console.log('💾 Saving PDF...');
    if (onProgress) onProgress(98, 'PDF wird gespeichert...');
    
    pdf.save(filename);
    
    if (onProgress) onProgress(100, 'PDF erfolgreich erstellt!');
    
    console.log('✅ PDF-Fotobuch erfolgreich erstellt!');
    
  } catch (error) {
    console.error('❌ Error generating PDF photobook:', error);
    throw new Error(`Fehler beim Erstellen des PDF-Fotobuchs: ${error}`);
  }
};

// Preview-Funktion
export const generatePDFPreview = async (mediaItems: MediaItem[]): Promise<string[]> => {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    createElegantCoverPage(pdf, {
      title: 'Kristin & Maurizio',
      subtitle: 'Unsere Hochzeit in Bildern',
      includeNotes: true,
      layout: 'portrait',
      quality: 'standard'
    });
    
    const canvas = await html2canvas(document.createElement('div'), {
      width: 210,
      height: 297,
      scale: 2
    });
    
    return [canvas.toDataURL('image/jpeg', 0.8)];
  } catch (error) {
    console.error('Error generating PDF preview:', error);
    return [];
  }
};