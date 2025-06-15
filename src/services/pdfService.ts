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

// Advanced image loading with multiple fallback methods
const loadImageAsBase64 = async (url: string): Promise<string> => {
  console.log(`🖼️ Loading image: ${url}`);
  
  // Method 1: Direct fetch with CORS
  try {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      headers: {
        'Accept': 'image/*',
        'Origin': window.location.origin
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const blob = await response.blob();
    
    if (blob.size === 0) {
      throw new Error('Empty blob received');
    }
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('FileReader failed'));
      reader.readAsDataURL(blob);
    });
  } catch (fetchError) {
    console.log(`Fetch failed: ${fetchError}, trying canvas method...`);
    
    // Method 2: Canvas-based loading
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }
          
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          
          ctx.drawImage(img, 0, 0);
          
          const dataURL = canvas.toDataURL('image/jpeg', 0.95);
          
          if (dataURL === 'data:,') {
            reject(new Error('Canvas conversion failed'));
            return;
          }
          
          console.log(`✅ Image loaded via canvas method`);
          resolve(dataURL);
        } catch (canvasError) {
          reject(new Error(`Canvas error: ${canvasError}`));
        }
      };
      
      img.onerror = () => {
        reject(new Error('Image load failed'));
      };
      
      // Add cache busting
      const imageUrl = url.includes('?') ? `${url}&cb=${Date.now()}` : `${url}?cb=${Date.now()}`;
      img.src = imageUrl;
    });
  }
};

// Create luxurious page background
const createLuxuryBackground = (pdf: jsPDF) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Ivory background
  pdf.setFillColor(255, 253, 250);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Gold border frame
  pdf.setDrawColor(184, 134, 11);
  pdf.setLineWidth(1.5);
  pdf.rect(20, 20, pageWidth - 40, pageHeight - 40, 'S');
  
  // Inner border
  pdf.setDrawColor(218, 165, 32);
  pdf.setLineWidth(0.5);
  pdf.rect(25, 25, pageWidth - 50, pageHeight - 50, 'S');
  
  // Elegant corner flourishes
  pdf.setDrawColor(184, 134, 11);
  pdf.setLineWidth(1);
  
  // Top left corner
  pdf.line(30, 30, 50, 30);
  pdf.line(30, 30, 30, 50);
  pdf.line(35, 35, 45, 35);
  pdf.line(35, 35, 35, 45);
  
  // Top right corner
  pdf.line(pageWidth - 50, 30, pageWidth - 30, 30);
  pdf.line(pageWidth - 30, 30, pageWidth - 30, 50);
  pdf.line(pageWidth - 45, 35, pageWidth - 35, 35);
  pdf.line(pageWidth - 35, 35, pageWidth - 35, 45);
  
  // Bottom left corner
  pdf.line(30, pageHeight - 50, 30, pageHeight - 30);
  pdf.line(30, pageHeight - 30, 50, pageHeight - 30);
  pdf.line(35, pageHeight - 45, 35, pageHeight - 35);
  pdf.line(35, pageHeight - 35, 45, pageHeight - 35);
  
  // Bottom right corner
  pdf.line(pageWidth - 30, pageHeight - 50, pageWidth - 30, pageHeight - 30);
  pdf.line(pageWidth - 50, pageHeight - 30, pageWidth - 30, pageHeight - 30);
  pdf.line(pageWidth - 35, pageHeight - 45, pageWidth - 35, pageHeight - 35);
  pdf.line(pageWidth - 45, pageHeight - 35, pageWidth - 35, pageHeight - 35);
};

// Create luxurious cover page
const createLuxuryCoverPage = (pdf: jsPDF, options: PDFOptions) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  createLuxuryBackground(pdf);
  
  // Elegant title with shadow effect
  pdf.setFont('times', 'bold');
  pdf.setFontSize(52);
  
  // Shadow
  pdf.setTextColor(200, 200, 200);
  pdf.text(options.title, pageWidth / 2 + 2, pageHeight * 0.28 + 2, { align: 'center' });
  
  // Main title
  pdf.setTextColor(139, 69, 19);
  pdf.text(options.title, pageWidth / 2, pageHeight * 0.28, { align: 'center' });
  
  // Decorative line with ornaments
  pdf.setDrawColor(184, 134, 11);
  pdf.setLineWidth(3);
  pdf.line(pageWidth / 2 - 100, pageHeight * 0.32, pageWidth / 2 + 100, pageHeight * 0.32);
  
  // Ornamental dots
  pdf.setFillColor(184, 134, 11);
  pdf.circle(pageWidth / 2 - 110, pageHeight * 0.32, 3, 'F');
  pdf.circle(pageWidth / 2 + 110, pageHeight * 0.32, 3, 'F');
  
  // Elegant subtitle
  pdf.setFont('times', 'italic');
  pdf.setFontSize(22);
  pdf.setTextColor(101, 67, 33);
  
  const subtitleLines = options.subtitle.split('\n');
  subtitleLines.forEach((line, index) => {
    pdf.text(line, pageWidth / 2, pageHeight * 0.38 + (index * 28), { align: 'center' });
  });
  
  // Wedding date in elegant frame
  pdf.setFillColor(255, 248, 220);
  pdf.roundedRect(pageWidth / 2 - 80, pageHeight * 0.52, 160, 40, 8, 8, 'F');
  
  pdf.setDrawColor(184, 134, 11);
  pdf.setLineWidth(2);
  pdf.roundedRect(pageWidth / 2 - 80, pageHeight * 0.52, 160, 40, 8, 8, 'S');
  
  pdf.setFont('times', 'bold');
  pdf.setFontSize(28);
  pdf.setTextColor(139, 69, 19);
  pdf.text('12. Juli 2025', pageWidth / 2, pageHeight * 0.55, { align: 'center' });
  
  // Elegant hearts
  pdf.setFont('times', 'normal');
  pdf.setFontSize(20);
  pdf.setTextColor(205, 92, 92);
  pdf.text('♥', pageWidth / 2 - 40, pageHeight * 0.65, { align: 'center' });
  pdf.text('♥', pageWidth / 2 + 40, pageHeight * 0.65, { align: 'center' });
  
  // Romantic quote
  pdf.setFont('times', 'italic');
  pdf.setFontSize(18);
  pdf.setTextColor(139, 115, 85);
  pdf.text('Ein Tag voller Liebe, Freude und unvergesslicher Momente', pageWidth / 2, pageHeight * 0.72, { align: 'center' });
  
  // Elegant footer
  pdf.setFont('times', 'normal');
  pdf.setFontSize(14);
  pdf.setTextColor(101, 67, 33);
  pdf.text('Mit Liebe erstellt von kristinundmauro.de', pageWidth / 2, pageHeight - 60, { align: 'center' });
  
  const currentDate = new Date().toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  pdf.setFontSize(12);
  pdf.setTextColor(139, 115, 85);
  pdf.text(`Erstellt am ${currentDate}`, pageWidth / 2, pageHeight - 40, { align: 'center' });
};

// Create elegant statistics page
const createElegantStatsPage = (pdf: jsPDF, mediaItems: MediaItem[]) => {
  pdf.addPage();
  createLuxuryBackground(pdf);
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPosition = 70;
  
  // Elegant title
  pdf.setFont('times', 'bold');
  pdf.setFontSize(36);
  pdf.setTextColor(139, 69, 19);
  pdf.text('Unsere Hochzeits-Erinnerungen', pageWidth / 2, yPosition, { align: 'center' });
  
  // Decorative underline
  pdf.setDrawColor(184, 134, 11);
  pdf.setLineWidth(2);
  pdf.line(pageWidth / 2 - 120, yPosition + 8, pageWidth / 2 + 120, yPosition + 8);
  
  yPosition += 60;
  
  // Statistics
  const stats = {
    totalItems: mediaItems.length,
    images: mediaItems.filter(item => item.type === 'image').length,
    videos: mediaItems.filter(item => item.type === 'video').length,
    notes: mediaItems.filter(item => item.type === 'note').length,
    contributors: new Set(mediaItems.map(item => item.uploadedBy)).size
  };
  
  // Elegant stats boxes
  const statsData = [
    { label: 'Gesamte Beiträge', value: stats.totalItems, color: [52, 152, 219] },
    { label: 'Wunderschöne Bilder', value: stats.images, color: [46, 204, 113] },
    { label: 'Bewegende Videos', value: stats.videos, color: [155, 89, 182] },
    { label: 'Liebevolle Nachrichten', value: stats.notes, color: [231, 76, 60] },
    { label: 'Liebe Gäste', value: stats.contributors, color: [230, 126, 34] }
  ];
  
  statsData.forEach((stat, index) => {
    const boxY = yPosition + (index * 55);
    
    // Elegant background
    pdf.setFillColor(255, 250, 245);
    pdf.roundedRect(50, boxY - 18, pageWidth - 100, 40, 10, 10, 'F');
    
    // Gold border
    pdf.setDrawColor(184, 134, 11);
    pdf.setLineWidth(1.5);
    pdf.roundedRect(50, boxY - 18, pageWidth - 100, 40, 10, 10, 'S');
    
    // Label
    pdf.setFont('times', 'normal');
    pdf.setFontSize(18);
    pdf.setTextColor(101, 67, 33);
    pdf.text(stat.label, 65, boxY + 5);
    
    // Value in elegant circle
    pdf.setFillColor(...stat.color);
    pdf.circle(pageWidth - 80, boxY + 2, 15, 'F');
    
    pdf.setFont('times', 'bold');
    pdf.setFontSize(20);
    pdf.setTextColor(255, 255, 255);
    pdf.text(stat.value.toString(), pageWidth - 80, boxY + 7, { align: 'center' });
  });
  
  yPosition += statsData.length * 55 + 50;
  
  // Contributors section
  if (stats.contributors > 0) {
    pdf.setFont('times', 'bold');
    pdf.setFontSize(26);
    pdf.setTextColor(139, 69, 19);
    pdf.text('Unsere wunderbaren Gäste', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 35;
    
    const contributors = Array.from(new Set(mediaItems.map(item => item.uploadedBy)));
    contributors.forEach((contributor, index) => {
      const userItems = mediaItems.filter(item => item.uploadedBy === contributor);
      const userStats = {
        images: userItems.filter(item => item.type === 'image').length,
        videos: userItems.filter(item => item.type === 'video').length,
        notes: userItems.filter(item => item.type === 'note').length
      };
      
      pdf.setFont('times', 'normal');
      pdf.setFontSize(16);
      pdf.setTextColor(101, 67, 33);
      
      let contributionText = `${contributor}`;
      const contributions = [];
      if (userStats.images > 0) contributions.push(`${userStats.images} Bild${userStats.images > 1 ? 'er' : ''}`);
      if (userStats.videos > 0) contributions.push(`${userStats.videos} Video${userStats.videos > 1 ? 's' : ''}`);
      if (userStats.notes > 0) contributions.push(`${userStats.notes} Nachricht${userStats.notes > 1 ? 'en' : ''}`);
      
      if (contributions.length > 0) {
        contributionText += ` - ${contributions.join(', ')}`;
      }
      
      // Elegant bullet point
      pdf.setFillColor(184, 134, 11);
      pdf.circle(60, yPosition + (index * 22) - 2, 2, 'F');
      
      pdf.text(contributionText, 70, yPosition + (index * 22));
    });
  }
};

// Create elegant notes page
const createElegantNotesPage = (pdf: jsPDF, mediaItems: MediaItem[]) => {
  const notes = mediaItems.filter(item => item.type === 'note' && item.noteText);
  
  if (notes.length === 0) return;
  
  pdf.addPage();
  createLuxuryBackground(pdf);
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 70;
  
  // Elegant title
  pdf.setFont('times', 'bold');
  pdf.setFontSize(36);
  pdf.setTextColor(139, 69, 19);
  pdf.text('Liebevolle Worte unserer Gäste', pageWidth / 2, yPosition, { align: 'center' });
  
  // Decorative underline
  pdf.setDrawColor(184, 134, 11);
  pdf.setLineWidth(2);
  pdf.line(pageWidth / 2 - 140, yPosition + 8, pageWidth / 2 + 140, yPosition + 8);
  
  yPosition += 60;
  
  notes.forEach((note, index) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 140) {
      pdf.addPage();
      createLuxuryBackground(pdf);
      yPosition = 70;
    }
    
    // Elegant note container
    pdf.setFillColor(255, 248, 220);
    pdf.roundedRect(40, yPosition - 15, pageWidth - 80, 90, 12, 12, 'F');
    
    // Gold border
    pdf.setDrawColor(184, 134, 11);
    pdf.setLineWidth(2);
    pdf.roundedRect(40, yPosition - 15, pageWidth - 80, 90, 12, 12, 'S');
    
    // Author with elegant styling
    pdf.setFont('times', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(139, 69, 19);
    pdf.text(`Von ${note.uploadedBy}`, 55, yPosition + 10);
    
    // Date
    pdf.setFont('times', 'italic');
    pdf.setFontSize(14);
    pdf.setTextColor(139, 115, 85);
    const noteDate = new Date(note.uploadedAt).toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    pdf.text(noteDate, pageWidth - 55, yPosition + 10, { align: 'right' });
    
    // Note text with elegant formatting
    pdf.setFont('times', 'normal');
    pdf.setFontSize(16);
    pdf.setTextColor(101, 67, 33);
    
    const noteLines = pdf.splitTextToSize(`"${note.noteText}"`, pageWidth - 110);
    pdf.text(noteLines, 55, yPosition + 35);
    
    yPosition += 110;
  });
};

// Add image with luxury presentation
const addLuxuryImagePage = async (pdf: jsPDF, imageUrl: string, item: MediaItem, pageIndex: number) => {
  try {
    console.log(`🎨 Processing luxury image ${pageIndex}: ${imageUrl}`);
    
    const base64Image = await loadImageAsBase64(imageUrl);
    console.log(`✅ Image ${pageIndex} loaded successfully`);
    
    pdf.addPage();
    createLuxuryBackground(pdf);
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Elegant page title
    pdf.setFont('times', 'bold');
    pdf.setFontSize(24);
    pdf.setTextColor(139, 69, 19);
    pdf.text(`Erinnerung ${pageIndex}`, pageWidth / 2, 55, { align: 'center' });
    
    // Decorative line under title
    pdf.setDrawColor(184, 134, 11);
    pdf.setLineWidth(1);
    pdf.line(pageWidth / 2 - 60, 62, pageWidth / 2 + 60, 62);
    
    // Calculate image dimensions with luxury spacing
    const maxWidth = pageWidth - 120;
    const maxHeight = pageHeight - 200;
    
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
    const y = 85;
    
    // Luxury frame with multiple borders
    // Outer shadow
    pdf.setFillColor(220, 220, 220);
    pdf.rect(x - 15, y - 15, imgWidth + 30, imgHeight + 30, 'F');
    
    // Gold outer frame
    pdf.setFillColor(184, 134, 11);
    pdf.rect(x - 12, y - 12, imgWidth + 24, imgHeight + 24, 'F');
    
    // White mat
    pdf.setFillColor(255, 255, 255);
    pdf.rect(x - 8, y - 8, imgWidth + 16, imgHeight + 16, 'F');
    
    // Inner gold frame
    pdf.setFillColor(218, 165, 32);
    pdf.rect(x - 4, y - 4, imgWidth + 8, imgHeight + 8, 'F');
    
    // Final white border
    pdf.setFillColor(255, 255, 255);
    pdf.rect(x - 2, y - 2, imgWidth + 4, imgHeight + 4, 'F');
    
    // Add the image
    pdf.addImage(base64Image, 'JPEG', x, y, imgWidth, imgHeight);
    
    // Elegant metadata section
    const metaY = y + imgHeight + 40;
    
    // Background for metadata
    pdf.setFillColor(255, 248, 220);
    pdf.roundedRect(60, metaY - 10, pageWidth - 120, 35, 8, 8, 'F');
    
    pdf.setDrawColor(184, 134, 11);
    pdf.setLineWidth(1);
    pdf.roundedRect(60, metaY - 10, pageWidth - 120, 35, 8, 8, 'S');
    
    // Metadata text
    pdf.setFont('times', 'italic');
    pdf.setFontSize(16);
    pdf.setTextColor(139, 69, 19);
    
    const uploadDate = new Date(item.uploadedAt).toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    pdf.text(`Aufgenommen von ${item.uploadedBy}`, pageWidth / 2, metaY + 5, { align: 'center' });
    pdf.text(`am ${uploadDate}`, pageWidth / 2, metaY + 20, { align: 'center' });
    
    console.log(`✅ Luxury image ${pageIndex} successfully added to PDF`);
    
  } catch (error) {
    console.error(`❌ Error adding luxury image ${pageIndex}:`, error);
    
    // Elegant error page
    pdf.addPage();
    createLuxuryBackground(pdf);
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Error message in elegant style
    pdf.setFont('times', 'bold');
    pdf.setFontSize(28);
    pdf.setTextColor(139, 69, 19);
    pdf.text('Bild konnte nicht geladen werden', pageWidth / 2, pageHeight / 2 - 50, { align: 'center' });
    
    pdf.setFont('times', 'normal');
    pdf.setFontSize(18);
    pdf.setTextColor(139, 115, 85);
    pdf.text(`Von ${item.uploadedBy}`, pageWidth / 2, pageHeight / 2 - 20, { align: 'center' });
    
    const uploadDate = new Date(item.uploadedAt).toLocaleDateString('de-DE');
    pdf.text(`Datum: ${uploadDate}`, pageWidth / 2, pageHeight / 2 + 5, { align: 'center' });
    
    pdf.setFont('times', 'italic');
    pdf.setFontSize(14);
    pdf.setTextColor(180, 180, 180);
    pdf.text('Das Bild ist möglicherweise nicht mehr verfügbar', pageWidth / 2, pageHeight / 2 + 35, { align: 'center' });
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
    console.log('🎨 Starting luxury PDF generation...');
    
    // Create PDF document
    const pdf = new jsPDF({
      orientation: options.layout,
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    
    // Create luxury cover page
    console.log('👑 Creating luxury cover page...');
    createLuxuryCoverPage(pdf, options);
    
    // Create elegant statistics page
    console.log('📊 Creating elegant statistics page...');
    createElegantStatsPage(pdf, mediaItems);
    
    // Create elegant notes page if requested
    if (options.includeNotes) {
      console.log('💌 Creating elegant notes page...');
      createElegantNotesPage(pdf, mediaItems);
    }
    
    // Add images with luxury presentation
    const images = mediaItems.filter(item => item.type === 'image' && item.url);
    
    if (images.length > 0) {
      console.log(`🖼️ Adding ${images.length} images with luxury presentation...`);
      
      // Add elegant section divider
      pdf.addPage();
      createLuxuryBackground(pdf);
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      pdf.setFont('times', 'bold');
      pdf.setFontSize(42);
      pdf.setTextColor(139, 69, 19);
      pdf.text('Unsere Hochzeitsbilder', pageWidth / 2, pageHeight / 2 - 40, { align: 'center' });
      
      pdf.setFont('times', 'italic');
      pdf.setFontSize(24);
      pdf.setTextColor(139, 115, 85);
      pdf.text(`${images.length} wunderschöne Erinnerungen`, pageWidth / 2, pageHeight / 2 - 5, { align: 'center' });
      
      // Decorative hearts
      pdf.setFont('times', 'normal');
      pdf.setFontSize(24);
      pdf.setTextColor(205, 92, 92);
      pdf.text('♥', pageWidth / 2 - 50, pageHeight / 2 + 30, { align: 'center' });
      pdf.text('♥', pageWidth / 2, pageHeight / 2 + 30, { align: 'center' });
      pdf.text('♥', pageWidth / 2 + 50, pageHeight / 2 + 30, { align: 'center' });
      
      // Add each image with luxury presentation
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        console.log(`Processing luxury image ${i + 1} of ${images.length}...`);
        await addLuxuryImagePage(pdf, image.url, image, i + 1);
      }
    }
    
    // Add elegant thank you page
    console.log('💕 Creating elegant thank you page...');
    pdf.addPage();
    createLuxuryBackground(pdf);
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    pdf.setFont('times', 'bold');
    pdf.setFontSize(38);
    pdf.setTextColor(139, 69, 19);
    pdf.text('Vielen herzlichen Dank!', pageWidth / 2, pageHeight / 2 - 100, { align: 'center' });
    
    pdf.setFont('times', 'normal');
    pdf.setFontSize(20);
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
      pdf.text(line, pageWidth / 2, pageHeight / 2 - 60 + (index * 18), { align: 'center' });
    });
    
    // Elegant signature
    pdf.setFont('times', 'italic');
    pdf.setFontSize(28);
    pdf.setTextColor(139, 69, 19);
    pdf.text('Kristin & Maurizio', pageWidth / 2, pageHeight / 2 + 80, { align: 'center' });
    
    // Decorative hearts
    pdf.setFont('times', 'normal');
    pdf.setFontSize(20);
    pdf.setTextColor(205, 92, 92);
    pdf.text('♥', pageWidth / 2 - 60, pageHeight / 2 + 100, { align: 'center' });
    pdf.text('♥', pageWidth / 2 + 60, pageHeight / 2 + 100, { align: 'center' });
    
    // Generate filename
    const today = new Date().toISOString().slice(0, 10);
    const filename = `Luxus_Hochzeitsfotobuch_Kristin_Maurizio_${today}.pdf`;
    
    // Save the PDF
    console.log('💾 Saving luxury PDF...');
    pdf.save(filename);
    
    console.log('✅ Luxuriöses PDF-Fotobuch erfolgreich erstellt!');
    
  } catch (error) {
    console.error('❌ Error generating luxury PDF photobook:', error);
    throw new Error(`Fehler beim Erstellen des luxuriösen PDF-Fotobuchs: ${error}`);
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
    createLuxuryCoverPage(pdf, {
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