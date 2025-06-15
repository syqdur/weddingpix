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

// Load image as base64 with CORS handling
const loadImageAsBase64 = async (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      try {
        const dataURL = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataURL);
      } catch (error) {
        reject(new Error('Could not convert image to base64'));
      }
    };
    
    img.onerror = () => {
      reject(new Error(`Failed to load image: ${url}`));
    };
    
    img.src = url;
  });
};

// Create elegant decorative border
const createDecorateBorder = (pdf: jsPDF, pageWidth: number, pageHeight: number) => {
  // Elegant corner decorations
  pdf.setDrawColor(200, 180, 160); // Warm beige
  pdf.setLineWidth(0.5);
  
  // Top left corner
  pdf.line(20, 20, 40, 20);
  pdf.line(20, 20, 20, 40);
  
  // Top right corner
  pdf.line(pageWidth - 40, 20, pageWidth - 20, 20);
  pdf.line(pageWidth - 20, 20, pageWidth - 20, 40);
  
  // Bottom left corner
  pdf.line(20, pageHeight - 40, 20, pageHeight - 20);
  pdf.line(20, pageHeight - 20, 40, pageHeight - 20);
  
  // Bottom right corner
  pdf.line(pageWidth - 20, pageHeight - 40, pageWidth - 20, pageHeight - 20);
  pdf.line(pageWidth - 40, pageHeight - 20, pageWidth - 20, pageHeight - 20);
};

// Create a beautiful cover page
const createCoverPage = (pdf: jsPDF, options: PDFOptions) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Elegant gradient background (simulated with rectangles)
  pdf.setFillColor(255, 250, 245); // Warm white
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Soft gradient effect
  for (let i = 0; i < 50; i++) {
    const alpha = i / 50;
    const gray = 255 - (alpha * 20);
    pdf.setFillColor(gray, gray - 5, gray - 10);
    pdf.rect(0, pageHeight * 0.7 + i, pageWidth, 1, 'F');
  }
  
  // Decorative border
  createDecorateBorder(pdf, pageWidth, pageHeight);
  
  // Elegant title
  pdf.setFont('times', 'bold');
  pdf.setFontSize(42);
  pdf.setTextColor(101, 67, 33); // Elegant brown
  
  const titleLines = pdf.splitTextToSize(options.title, pageWidth - 80);
  const titleHeight = titleLines.length * 15;
  pdf.text(titleLines, pageWidth / 2, pageHeight * 0.25, { align: 'center' });
  
  // Decorative line under title
  pdf.setDrawColor(200, 180, 160);
  pdf.setLineWidth(1);
  pdf.line(pageWidth / 2 - 60, pageHeight * 0.25 + titleHeight + 10, 
           pageWidth / 2 + 60, pageHeight * 0.25 + titleHeight + 10);
  
  // Elegant subtitle
  pdf.setFont('times', 'italic');
  pdf.setFontSize(18);
  pdf.setTextColor(120, 100, 80); // Warm gray
  
  const subtitleLines = pdf.splitTextToSize(options.subtitle, pageWidth - 60);
  pdf.text(subtitleLines, pageWidth / 2, pageHeight * 0.35, { align: 'center' });
  
  // Wedding date in elegant style
  pdf.setFont('times', 'normal');
  pdf.setFontSize(24);
  pdf.setTextColor(160, 82, 45); // Saddle brown
  pdf.text('12. Juli 2025', pageWidth / 2, pageHeight * 0.5, { align: 'center' });
  
  // Elegant heart decoration
  pdf.setFont('times', 'normal');
  pdf.setFontSize(20);
  pdf.setTextColor(205, 92, 92); // Indian red
  pdf.text('♥', pageWidth / 2 - 25, pageHeight * 0.58, { align: 'center' });
  pdf.text('♥', pageWidth / 2 + 25, pageHeight * 0.58, { align: 'center' });
  
  // Elegant flourish
  pdf.setFont('times', 'italic');
  pdf.setFontSize(16);
  pdf.setTextColor(139, 115, 85); // Dark khaki
  pdf.text('~ Ein Tag voller Liebe und Freude ~', pageWidth / 2, pageHeight * 0.65, { align: 'center' });
  
  // Footer with elegant styling
  pdf.setFont('times', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(105, 105, 105);
  pdf.text('Liebevoll erstellt von kristinundmauro.de', pageWidth / 2, pageHeight - 40, { align: 'center' });
  
  const currentDate = new Date().toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  pdf.text(`Erstellt am ${currentDate}`, pageWidth / 2, pageHeight - 25, { align: 'center' });
};

// Create elegant statistics page
const createStatsPage = (pdf: jsPDF, mediaItems: MediaItem[]) => {
  pdf.addPage();
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 50;
  
  // Decorative border
  createDecorateBorder(pdf, pageWidth, pageHeight);
  
  // Page title with elegant styling
  pdf.setFont('times', 'bold');
  pdf.setFontSize(28);
  pdf.setTextColor(101, 67, 33);
  pdf.text('Unsere Hochzeits-Erinnerungen', pageWidth / 2, yPosition, { align: 'center' });
  
  // Decorative line
  pdf.setDrawColor(200, 180, 160);
  pdf.setLineWidth(1);
  pdf.line(pageWidth / 2 - 80, yPosition + 8, pageWidth / 2 + 80, yPosition + 8);
  
  yPosition += 50;
  
  // Statistics with elegant presentation
  const stats = {
    totalItems: mediaItems.length,
    images: mediaItems.filter(item => item.type === 'image').length,
    videos: mediaItems.filter(item => item.type === 'video').length,
    notes: mediaItems.filter(item => item.type === 'note').length,
    contributors: new Set(mediaItems.map(item => item.uploadedBy)).size
  };
  
  // Elegant stats presentation
  pdf.setFont('times', 'normal');
  pdf.setFontSize(16);
  pdf.setTextColor(80, 60, 40);
  
  const statsData = [
    { label: 'Gesamte Beiträge', value: stats.totalItems },
    { label: 'Wunderschöne Bilder', value: stats.images },
    { label: 'Bewegende Videos', value: stats.videos },
    { label: 'Liebevolle Nachrichten', value: stats.notes },
    { label: 'Liebe Gäste', value: stats.contributors }
  ];
  
  statsData.forEach((stat, index) => {
    const x = 60;
    const y = yPosition + (index * 35);
    
    // Elegant background for each stat
    pdf.setFillColor(250, 245, 240);
    pdf.roundedRect(x - 10, y - 20, pageWidth - 100, 25, 3, 3, 'F');
    
    // Stat label
    pdf.setFont('times', 'normal');
    pdf.setTextColor(80, 60, 40);
    pdf.text(stat.label, x, y, { align: 'left' });
    
    // Stat value with elegant styling
    pdf.setFont('times', 'bold');
    pdf.setTextColor(160, 82, 45);
    pdf.text(stat.value.toString(), pageWidth - 60, y, { align: 'right' });
  });
  
  yPosition += statsData.length * 35 + 40;
  
  // Contributors section with elegant styling
  if (stats.contributors > 0) {
    pdf.setFont('times', 'bold');
    pdf.setFontSize(20);
    pdf.setTextColor(101, 67, 33);
    pdf.text('Unsere wunderbaren Gäste', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 30;
    
    const contributors = Array.from(new Set(mediaItems.map(item => item.uploadedBy)));
    contributors.forEach((contributor, index) => {
      const userItems = mediaItems.filter(item => item.uploadedBy === contributor);
      const userStats = {
        images: userItems.filter(item => item.type === 'image').length,
        videos: userItems.filter(item => item.type === 'video').length,
        notes: userItems.filter(item => item.type === 'note').length
      };
      
      pdf.setFont('times', 'normal');
      pdf.setFontSize(14);
      pdf.setTextColor(80, 60, 40);
      
      let contributionText = `${contributor}`;
      const contributions = [];
      if (userStats.images > 0) contributions.push(`${userStats.images} Bild${userStats.images > 1 ? 'er' : ''}`);
      if (userStats.videos > 0) contributions.push(`${userStats.videos} Video${userStats.videos > 1 ? 's' : ''}`);
      if (userStats.notes > 0) contributions.push(`${userStats.notes} Nachricht${userStats.notes > 1 ? 'en' : ''}`);
      
      if (contributions.length > 0) {
        contributionText += ` - ${contributions.join(', ')}`;
      }
      
      pdf.text(contributionText, 60, yPosition + (index * 20));
    });
  }
};

// Create elegant notes page
const createNotesPage = (pdf: jsPDF, mediaItems: MediaItem[]) => {
  const notes = mediaItems.filter(item => item.type === 'note' && item.noteText);
  
  if (notes.length === 0) return;
  
  pdf.addPage();
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 50;
  
  // Decorative border
  createDecorateBorder(pdf, pageWidth, pageHeight);
  
  // Page title
  pdf.setFont('times', 'bold');
  pdf.setFontSize(28);
  pdf.setTextColor(101, 67, 33);
  pdf.text('Liebevolle Worte unserer Gäste', pageWidth / 2, yPosition, { align: 'center' });
  
  // Decorative line
  pdf.setDrawColor(200, 180, 160);
  pdf.setLineWidth(1);
  pdf.line(pageWidth / 2 - 90, yPosition + 8, pageWidth / 2 + 90, yPosition + 8);
  
  yPosition += 50;
  
  notes.forEach((note, index) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 100) {
      pdf.addPage();
      createDecorateBorder(pdf, pageWidth, pageHeight);
      yPosition = 50;
    }
    
    // Elegant note container
    pdf.setFillColor(255, 250, 245); // Warm white
    pdf.roundedRect(40, yPosition - 10, pageWidth - 80, 70, 5, 5, 'F');
    
    // Subtle border
    pdf.setDrawColor(220, 200, 180);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(40, yPosition - 10, pageWidth - 80, 70, 5, 5, 'S');
    
    // Author name with elegant styling
    pdf.setFont('times', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(160, 82, 45);
    pdf.text(`Von ${note.uploadedBy}`, 50, yPosition + 5);
    
    // Date with subtle styling
    pdf.setFont('times', 'italic');
    pdf.setFontSize(10);
    pdf.setTextColor(120, 100, 80);
    const noteDate = new Date(note.uploadedAt).toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    pdf.text(noteDate, pageWidth - 50, yPosition + 5, { align: 'right' });
    
    // Note text with beautiful typography
    pdf.setFont('times', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(60, 50, 40);
    
    const noteLines = pdf.splitTextToSize(`"${note.noteText}"`, pageWidth - 100);
    pdf.text(noteLines, 50, yPosition + 25);
    
    yPosition += Math.max(80, noteLines.length * 6 + 40);
  });
};

// Add image to PDF with elegant presentation
const addImageToPDF = async (pdf: jsPDF, imageUrl: string, item: MediaItem, pageIndex: number) => {
  try {
    const base64Image = await loadImageAsBase64(imageUrl);
    
    pdf.addPage();
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Decorative border
    createDecorateBorder(pdf, pageWidth, pageHeight);
    
    // Elegant page header
    pdf.setFont('times', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(101, 67, 33);
    pdf.text(`Erinnerung ${pageIndex}`, pageWidth / 2, 35, { align: 'center' });
    
    // Add image with elegant framing
    const maxWidth = pageWidth - 60;
    const maxHeight = pageHeight - 140;
    
    // Calculate image dimensions while maintaining aspect ratio
    const img = new Image();
    img.src = base64Image;
    
    await new Promise((resolve) => {
      img.onload = resolve;
    });
    
    const aspectRatio = img.width / img.height;
    let imgWidth = maxWidth;
    let imgHeight = imgWidth / aspectRatio;
    
    if (imgHeight > maxHeight) {
      imgHeight = maxHeight;
      imgWidth = imgHeight * aspectRatio;
    }
    
    const x = (pageWidth - imgWidth) / 2;
    const y = 60;
    
    // Elegant image frame
    pdf.setFillColor(255, 255, 255);
    pdf.rect(x - 5, y - 5, imgWidth + 10, imgHeight + 10, 'F');
    
    pdf.setDrawColor(200, 180, 160);
    pdf.setLineWidth(1);
    pdf.rect(x - 5, y - 5, imgWidth + 10, imgHeight + 10, 'S');
    
    pdf.addImage(base64Image, 'JPEG', x, y, imgWidth, imgHeight);
    
    // Elegant metadata at bottom
    pdf.setFont('times', 'italic');
    pdf.setFontSize(12);
    pdf.setTextColor(120, 100, 80);
    
    const uploadDate = new Date(item.uploadedAt).toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    pdf.text(`Aufgenommen von ${item.uploadedBy}`, pageWidth / 2, pageHeight - 40, { align: 'center' });
    pdf.text(`am ${uploadDate}`, pageWidth / 2, pageHeight - 25, { align: 'center' });
    
  } catch (error) {
    console.error(`Error adding image to PDF: ${error}`);
    
    // Add elegant error page
    pdf.addPage();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    createDecorateBorder(pdf, pageWidth, pageHeight);
    
    pdf.setFont('times', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(160, 82, 45);
    pdf.text('Bild konnte nicht geladen werden', pageWidth / 2, pageHeight / 2 - 30, { align: 'center' });
    
    pdf.setFont('times', 'normal');
    pdf.setFontSize(14);
    pdf.setTextColor(120, 100, 80);
    pdf.text(`Von ${item.uploadedBy}`, pageWidth / 2, pageHeight / 2, { align: 'center' });
    
    const uploadDate = new Date(item.uploadedAt).toLocaleDateString('de-DE');
    pdf.text(`Datum: ${uploadDate}`, pageWidth / 2, pageHeight / 2 + 20, { align: 'center' });
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
  }
): Promise<void> => {
  try {
    // Create PDF document with elegant settings
    const pdf = new jsPDF({
      orientation: options.layout,
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    
    // Create elegant cover page
    createCoverPage(pdf, options);
    
    // Create statistics page
    createStatsPage(pdf, mediaItems);
    
    // Create notes page if requested
    if (options.includeNotes) {
      createNotesPage(pdf, mediaItems);
    }
    
    // Add images with elegant presentation
    const images = mediaItems.filter(item => item.type === 'image' && item.url);
    
    if (images.length > 0) {
      // Add elegant section divider for photos
      pdf.addPage();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      createDecorateBorder(pdf, pageWidth, pageHeight);
      
      pdf.setFont('times', 'bold');
      pdf.setFontSize(32);
      pdf.setTextColor(101, 67, 33);
      pdf.text('Unsere Hochzeitsbilder', pageWidth / 2, pageHeight / 2 - 20, { align: 'center' });
      
      pdf.setFont('times', 'italic');
      pdf.setFontSize(18);
      pdf.setTextColor(120, 100, 80);
      pdf.text(`${images.length} wunderschöne Erinnerungen`, pageWidth / 2, pageHeight / 2 + 10, { align: 'center' });
      
      // Decorative flourish
      pdf.setFont('times', 'normal');
      pdf.setFontSize(16);
      pdf.setTextColor(160, 82, 45);
      pdf.text('♥ ♥ ♥', pageWidth / 2, pageHeight / 2 + 40, { align: 'center' });
      
      // Add each image with elegant presentation
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        await addImageToPDF(pdf, image.url, image, i + 1);
        
        console.log(`Processing image ${i + 1} of ${images.length}...`);
      }
    }
    
    // Add elegant final page
    pdf.addPage();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    createDecorateBorder(pdf, pageWidth, pageHeight);
    
    pdf.setFont('times', 'bold');
    pdf.setFontSize(28);
    pdf.setTextColor(101, 67, 33);
    pdf.text('Vielen herzlichen Dank!', pageWidth / 2, pageHeight / 2 - 60, { align: 'center' });
    
    pdf.setFont('times', 'normal');
    pdf.setFontSize(16);
    pdf.setTextColor(120, 100, 80);
    
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
      pdf.text(line, pageWidth / 2, pageHeight / 2 - 20 + (index * 12), { align: 'center' });
    });
    
    // Elegant signature
    pdf.setFont('times', 'italic');
    pdf.setFontSize(20);
    pdf.setTextColor(160, 82, 45);
    pdf.text('Kristin & Maurizio', pageWidth / 2, pageHeight / 2 + 40, { align: 'center' });
    
    // Generate filename
    const today = new Date().toISOString().slice(0, 10);
    const filename = `Hochzeitsfotobuch_Kristin_Maurizio_${today}.pdf`;
    
    // Save the PDF
    pdf.save(filename);
    
    console.log('✅ Elegantes PDF Fotobuch erfolgreich erstellt!');
    
  } catch (error) {
    console.error('Error generating PDF photobook:', error);
    throw new Error(`Fehler beim Erstellen des PDF-Fotobuchs: ${error}`);
  }
};

// Generate a quick preview of the PDF (first few pages as images)
export const generatePDFPreview = async (mediaItems: MediaItem[]): Promise<string[]> => {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Create cover page
    createCoverPage(pdf, {
      title: 'Kristin & Maurizio',
      subtitle: 'Unsere Hochzeit in Bildern',
      includeNotes: true,
      layout: 'portrait',
      quality: 'standard'
    });
    
    // Convert first page to canvas
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