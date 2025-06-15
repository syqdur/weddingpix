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

// Load image with proper CORS handling and Firebase URL processing
const loadImageAsBase64 = async (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    // Add timestamp to bypass cache issues
    const imageUrl = url.includes('?') ? `${url}&t=${Date.now()}` : `${url}?t=${Date.now()}`;
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Set canvas size to image size
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        
        // Draw image on canvas
        ctx.drawImage(img, 0, 0);
        
        // Convert to base64 with high quality
        const dataURL = canvas.toDataURL('image/jpeg', 0.9);
        
        if (dataURL === 'data:,') {
          reject(new Error('Failed to convert image to base64'));
          return;
        }
        
        resolve(dataURL);
      } catch (error) {
        reject(new Error(`Canvas conversion failed: ${error}`));
      }
    };
    
    img.onerror = (error) => {
      console.error('Image load error:', error);
      reject(new Error(`Failed to load image from: ${url}`));
    };
    
    // Set the source last
    img.src = imageUrl;
  });
};

// Alternative method using fetch for Firebase images
const loadFirebaseImageAsBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = () => reject(new Error('Failed to read blob as base64'));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new Error(`Fetch failed: ${error}`);
  }
};

// Create elegant page background
const createPageBackground = (pdf: jsPDF) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Cream background
  pdf.setFillColor(254, 252, 247);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Subtle border
  pdf.setDrawColor(220, 200, 180);
  pdf.setLineWidth(0.5);
  pdf.rect(15, 15, pageWidth - 30, pageHeight - 30, 'S');
  
  // Corner decorations
  pdf.setDrawColor(200, 180, 160);
  pdf.setLineWidth(1);
  
  // Top corners
  pdf.line(20, 20, 35, 20);
  pdf.line(20, 20, 20, 35);
  pdf.line(pageWidth - 35, 20, pageWidth - 20, 20);
  pdf.line(pageWidth - 20, 20, pageWidth - 20, 35);
  
  // Bottom corners
  pdf.line(20, pageHeight - 35, 20, pageHeight - 20);
  pdf.line(20, pageHeight - 20, 35, pageHeight - 20);
  pdf.line(pageWidth - 20, pageHeight - 35, pageWidth - 20, pageHeight - 20);
  pdf.line(pageWidth - 35, pageHeight - 20, pageWidth - 20, pageHeight - 20);
};

// Create beautiful cover page
const createCoverPage = (pdf: jsPDF, options: PDFOptions) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  createPageBackground(pdf);
  
  // Elegant title
  pdf.setFont('times', 'bold');
  pdf.setFontSize(48);
  pdf.setTextColor(101, 67, 33);
  
  const titleY = pageHeight * 0.25;
  pdf.text(options.title, pageWidth / 2, titleY, { align: 'center' });
  
  // Decorative line
  pdf.setDrawColor(180, 140, 100);
  pdf.setLineWidth(2);
  pdf.line(pageWidth / 2 - 80, titleY + 15, pageWidth / 2 + 80, titleY + 15);
  
  // Subtitle
  pdf.setFont('times', 'italic');
  pdf.setFontSize(20);
  pdf.setTextColor(120, 100, 80);
  
  const subtitleLines = options.subtitle.split('\n');
  subtitleLines.forEach((line, index) => {
    pdf.text(line, pageWidth / 2, titleY + 50 + (index * 25), { align: 'center' });
  });
  
  // Wedding date
  pdf.setFont('times', 'normal');
  pdf.setFontSize(28);
  pdf.setTextColor(160, 82, 45);
  pdf.text('12. Juli 2025', pageWidth / 2, pageHeight * 0.55, { align: 'center' });
  
  // Hearts
  pdf.setFont('times', 'normal');
  pdf.setFontSize(24);
  pdf.setTextColor(205, 92, 92);
  pdf.text('♥', pageWidth / 2 - 30, pageHeight * 0.62, { align: 'center' });
  pdf.text('♥', pageWidth / 2 + 30, pageHeight * 0.62, { align: 'center' });
  
  // Elegant quote
  pdf.setFont('times', 'italic');
  pdf.setFontSize(18);
  pdf.setTextColor(139, 115, 85);
  pdf.text('Ein Tag voller Liebe und unvergesslicher Momente', pageWidth / 2, pageHeight * 0.7, { align: 'center' });
  
  // Footer
  pdf.setFont('times', 'normal');
  pdf.setFontSize(12);
  pdf.setTextColor(120, 100, 80);
  pdf.text('Liebevoll erstellt von kristinundmauro.de', pageWidth / 2, pageHeight - 40, { align: 'center' });
  
  const currentDate = new Date().toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  pdf.text(`Erstellt am ${currentDate}`, pageWidth / 2, pageHeight - 25, { align: 'center' });
};

// Create statistics page
const createStatsPage = (pdf: jsPDF, mediaItems: MediaItem[]) => {
  pdf.addPage();
  createPageBackground(pdf);
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPosition = 60;
  
  // Title
  pdf.setFont('times', 'bold');
  pdf.setFontSize(32);
  pdf.setTextColor(101, 67, 33);
  pdf.text('Unsere Hochzeits-Erinnerungen', pageWidth / 2, yPosition, { align: 'center' });
  
  // Decorative line
  pdf.setDrawColor(180, 140, 100);
  pdf.setLineWidth(2);
  pdf.line(pageWidth / 2 - 100, yPosition + 10, pageWidth / 2 + 100, yPosition + 10);
  
  yPosition += 60;
  
  // Statistics
  const stats = {
    totalItems: mediaItems.length,
    images: mediaItems.filter(item => item.type === 'image').length,
    videos: mediaItems.filter(item => item.type === 'video').length,
    notes: mediaItems.filter(item => item.type === 'note').length,
    contributors: new Set(mediaItems.map(item => item.uploadedBy)).size
  };
  
  // Stats boxes
  const statsData = [
    { label: 'Gesamte Beiträge', value: stats.totalItems, color: [52, 152, 219] },
    { label: 'Wunderschöne Bilder', value: stats.images, color: [46, 204, 113] },
    { label: 'Bewegende Videos', value: stats.videos, color: [155, 89, 182] },
    { label: 'Liebevolle Nachrichten', value: stats.notes, color: [231, 76, 60] },
    { label: 'Liebe Gäste', value: stats.contributors, color: [230, 126, 34] }
  ];
  
  statsData.forEach((stat, index) => {
    const boxY = yPosition + (index * 50);
    
    // Background box
    pdf.setFillColor(250, 248, 245);
    pdf.roundedRect(40, boxY - 15, pageWidth - 80, 35, 5, 5, 'F');
    
    // Border
    pdf.setDrawColor(...stat.color);
    pdf.setLineWidth(1);
    pdf.roundedRect(40, boxY - 15, pageWidth - 80, 35, 5, 5, 'S');
    
    // Label
    pdf.setFont('times', 'normal');
    pdf.setFontSize(16);
    pdf.setTextColor(80, 60, 40);
    pdf.text(stat.label, 50, boxY + 5);
    
    // Value
    pdf.setFont('times', 'bold');
    pdf.setFontSize(20);
    pdf.setTextColor(...stat.color);
    pdf.text(stat.value.toString(), pageWidth - 50, boxY + 5, { align: 'right' });
  });
  
  yPosition += statsData.length * 50 + 40;
  
  // Contributors
  if (stats.contributors > 0) {
    pdf.setFont('times', 'bold');
    pdf.setFontSize(24);
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
      
      pdf.text(contributionText, 50, yPosition + (index * 20));
    });
  }
};

// Create notes page
const createNotesPage = (pdf: jsPDF, mediaItems: MediaItem[]) => {
  const notes = mediaItems.filter(item => item.type === 'note' && item.noteText);
  
  if (notes.length === 0) return;
  
  pdf.addPage();
  createPageBackground(pdf);
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 60;
  
  // Title
  pdf.setFont('times', 'bold');
  pdf.setFontSize(32);
  pdf.setTextColor(101, 67, 33);
  pdf.text('Liebevolle Worte unserer Gäste', pageWidth / 2, yPosition, { align: 'center' });
  
  // Decorative line
  pdf.setDrawColor(180, 140, 100);
  pdf.setLineWidth(2);
  pdf.line(pageWidth / 2 - 120, yPosition + 10, pageWidth / 2 + 120, yPosition + 10);
  
  yPosition += 60;
  
  notes.forEach((note, index) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 120) {
      pdf.addPage();
      createPageBackground(pdf);
      yPosition = 60;
    }
    
    // Note container
    pdf.setFillColor(255, 250, 245);
    pdf.roundedRect(30, yPosition - 10, pageWidth - 60, 80, 8, 8, 'F');
    
    // Border
    pdf.setDrawColor(220, 200, 180);
    pdf.setLineWidth(1);
    pdf.roundedRect(30, yPosition - 10, pageWidth - 60, 80, 8, 8, 'S');
    
    // Author
    pdf.setFont('times', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(160, 82, 45);
    pdf.text(`Von ${note.uploadedBy}`, 40, yPosition + 10);
    
    // Date
    pdf.setFont('times', 'italic');
    pdf.setFontSize(12);
    pdf.setTextColor(120, 100, 80);
    const noteDate = new Date(note.uploadedAt).toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    pdf.text(noteDate, pageWidth - 40, yPosition + 10, { align: 'right' });
    
    // Note text
    pdf.setFont('times', 'normal');
    pdf.setFontSize(14);
    pdf.setTextColor(60, 50, 40);
    
    const noteLines = pdf.splitTextToSize(`"${note.noteText}"`, pageWidth - 80);
    pdf.text(noteLines, 40, yPosition + 35);
    
    yPosition += 100;
  });
};

// Add image to PDF with proper error handling
const addImageToPDF = async (pdf: jsPDF, imageUrl: string, item: MediaItem, pageIndex: number) => {
  try {
    console.log(`Loading image ${pageIndex}: ${imageUrl}`);
    
    let base64Image: string;
    
    try {
      // Try Firebase fetch method first
      base64Image = await loadFirebaseImageAsBase64(imageUrl);
      console.log(`✅ Image ${pageIndex} loaded via fetch`);
    } catch (fetchError) {
      console.log(`Fetch failed for image ${pageIndex}, trying direct load...`);
      // Fallback to direct image load
      base64Image = await loadImageAsBase64(imageUrl);
      console.log(`✅ Image ${pageIndex} loaded via direct method`);
    }
    
    pdf.addPage();
    createPageBackground(pdf);
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Page title
    pdf.setFont('times', 'bold');
    pdf.setFontSize(20);
    pdf.setTextColor(101, 67, 33);
    pdf.text(`Erinnerung ${pageIndex}`, pageWidth / 2, 45, { align: 'center' });
    
    // Calculate image dimensions
    const maxWidth = pageWidth - 80;
    const maxHeight = pageHeight - 160;
    
    // Create temporary image to get dimensions
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
    const y = 70;
    
    // White background for image
    pdf.setFillColor(255, 255, 255);
    pdf.rect(x - 8, y - 8, imgWidth + 16, imgHeight + 16, 'F');
    
    // Elegant frame
    pdf.setDrawColor(180, 140, 100);
    pdf.setLineWidth(2);
    pdf.rect(x - 8, y - 8, imgWidth + 16, imgHeight + 16, 'S');
    
    // Inner frame
    pdf.setDrawColor(220, 200, 180);
    pdf.setLineWidth(1);
    pdf.rect(x - 4, y - 4, imgWidth + 8, imgHeight + 8, 'S');
    
    // Add the image
    pdf.addImage(base64Image, 'JPEG', x, y, imgWidth, imgHeight);
    
    // Image metadata
    pdf.setFont('times', 'italic');
    pdf.setFontSize(14);
    pdf.setTextColor(120, 100, 80);
    
    const uploadDate = new Date(item.uploadedAt).toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    pdf.text(`Aufgenommen von ${item.uploadedBy}`, pageWidth / 2, pageHeight - 50, { align: 'center' });
    pdf.text(`am ${uploadDate}`, pageWidth / 2, pageHeight - 30, { align: 'center' });
    
    console.log(`✅ Image ${pageIndex} successfully added to PDF`);
    
  } catch (error) {
    console.error(`❌ Error adding image ${pageIndex} to PDF:`, error);
    
    // Add error page
    pdf.addPage();
    createPageBackground(pdf);
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Error message
    pdf.setFont('times', 'bold');
    pdf.setFontSize(24);
    pdf.setTextColor(231, 76, 60);
    pdf.text('Bild konnte nicht geladen werden', pageWidth / 2, pageHeight / 2 - 40, { align: 'center' });
    
    pdf.setFont('times', 'normal');
    pdf.setFontSize(16);
    pdf.setTextColor(120, 100, 80);
    pdf.text(`Von ${item.uploadedBy}`, pageWidth / 2, pageHeight / 2 - 10, { align: 'center' });
    
    const uploadDate = new Date(item.uploadedAt).toLocaleDateString('de-DE');
    pdf.text(`Datum: ${uploadDate}`, pageWidth / 2, pageHeight / 2 + 15, { align: 'center' });
    
    pdf.setFont('times', 'italic');
    pdf.setFontSize(12);
    pdf.setTextColor(150, 150, 150);
    pdf.text('Möglicherweise ist das Bild nicht mehr verfügbar', pageWidth / 2, pageHeight / 2 + 40, { align: 'center' });
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
    console.log('🎨 Starting PDF generation...');
    
    // Create PDF document
    const pdf = new jsPDF({
      orientation: options.layout,
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    
    // Create cover page
    console.log('📖 Creating cover page...');
    createCoverPage(pdf, options);
    
    // Create statistics page
    console.log('📊 Creating statistics page...');
    createStatsPage(pdf, mediaItems);
    
    // Create notes page if requested
    if (options.includeNotes) {
      console.log('💌 Creating notes page...');
      createNotesPage(pdf, mediaItems);
    }
    
    // Add images
    const images = mediaItems.filter(item => item.type === 'image' && item.url);
    
    if (images.length > 0) {
      console.log(`📸 Adding ${images.length} images...`);
      
      // Add section divider
      pdf.addPage();
      createPageBackground(pdf);
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      pdf.setFont('times', 'bold');
      pdf.setFontSize(36);
      pdf.setTextColor(101, 67, 33);
      pdf.text('Unsere Hochzeitsbilder', pageWidth / 2, pageHeight / 2 - 30, { align: 'center' });
      
      pdf.setFont('times', 'italic');
      pdf.setFontSize(20);
      pdf.setTextColor(120, 100, 80);
      pdf.text(`${images.length} wunderschöne Erinnerungen`, pageWidth / 2, pageHeight / 2, { align: 'center' });
      
      pdf.setFont('times', 'normal');
      pdf.setFontSize(18);
      pdf.setTextColor(160, 82, 45);
      pdf.text('♥ ♥ ♥', pageWidth / 2, pageHeight / 2 + 40, { align: 'center' });
      
      // Add each image
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        console.log(`Processing image ${i + 1} of ${images.length}...`);
        await addImageToPDF(pdf, image.url, image, i + 1);
      }
    }
    
    // Add final thank you page
    console.log('💕 Creating thank you page...');
    pdf.addPage();
    createPageBackground(pdf);
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    pdf.setFont('times', 'bold');
    pdf.setFontSize(32);
    pdf.setTextColor(101, 67, 33);
    pdf.text('Vielen herzlichen Dank!', pageWidth / 2, pageHeight / 2 - 80, { align: 'center' });
    
    pdf.setFont('times', 'normal');
    pdf.setFontSize(18);
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
      pdf.text(line, pageWidth / 2, pageHeight / 2 - 40 + (index * 15), { align: 'center' });
    });
    
    // Signature
    pdf.setFont('times', 'italic');
    pdf.setFontSize(24);
    pdf.setTextColor(160, 82, 45);
    pdf.text('Kristin & Maurizio', pageWidth / 2, pageHeight / 2 + 60, { align: 'center' });
    
    // Generate filename
    const today = new Date().toISOString().slice(0, 10);
    const filename = `Hochzeitsfotobuch_Kristin_Maurizio_${today}.pdf`;
    
    // Save the PDF
    console.log('💾 Saving PDF...');
    pdf.save(filename);
    
    console.log('✅ PDF Fotobuch erfolgreich erstellt!');
    
  } catch (error) {
    console.error('❌ Error generating PDF photobook:', error);
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