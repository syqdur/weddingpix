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

// Create a beautiful cover page
const createCoverPage = (pdf: jsPDF, options: PDFOptions) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Background gradient effect (simulated with rectangles)
  pdf.setFillColor(252, 231, 243); // Light pink
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  pdf.setFillColor(243, 232, 255); // Light purple
  pdf.rect(0, pageHeight * 0.7, pageWidth, pageHeight * 0.3, 'F');
  
  // Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(36);
  pdf.setTextColor(139, 69, 19); // Brown
  
  const titleLines = pdf.splitTextToSize(options.title, pageWidth - 40);
  const titleHeight = titleLines.length * 12;
  pdf.text(titleLines, pageWidth / 2, pageHeight * 0.3, { align: 'center' });
  
  // Subtitle
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(18);
  pdf.setTextColor(107, 114, 128); // Gray
  
  const subtitleLines = pdf.splitTextToSize(options.subtitle, pageWidth - 40);
  pdf.text(subtitleLines, pageWidth / 2, pageHeight * 0.3 + titleHeight + 20, { align: 'center' });
  
  // Wedding date
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(16);
  pdf.setTextColor(219, 39, 119); // Pink
  pdf.text('12. Juli 2025', pageWidth / 2, pageHeight * 0.5, { align: 'center' });
  
  // Hearts decoration
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(24);
  pdf.setTextColor(239, 68, 68); // Red
  pdf.text('💕', pageWidth / 2 - 30, pageHeight * 0.6, { align: 'center' });
  pdf.text('💕', pageWidth / 2 + 30, pageHeight * 0.6, { align: 'center' });
  
  // Footer
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  pdf.setTextColor(107, 114, 128);
  pdf.text('Erstellt mit ❤️ von kristinundmauro.de', pageWidth / 2, pageHeight - 30, { align: 'center' });
  
  const currentDate = new Date().toLocaleDateString('de-DE');
  pdf.text(`Erstellt am ${currentDate}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
};

// Create statistics page
const createStatsPage = (pdf: jsPDF, mediaItems: MediaItem[]) => {
  pdf.addPage();
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPosition = 40;
  
  // Page title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.setTextColor(139, 69, 19);
  pdf.text('📊 Hochzeits-Statistiken', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 40;
  
  // Statistics
  const stats = {
    totalItems: mediaItems.length,
    images: mediaItems.filter(item => item.type === 'image').length,
    videos: mediaItems.filter(item => item.type === 'video').length,
    notes: mediaItems.filter(item => item.type === 'note').length,
    contributors: new Set(mediaItems.map(item => item.uploadedBy)).size
  };
  
  // Stats boxes
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(14);
  pdf.setTextColor(55, 65, 81);
  
  const statsData = [
    { label: '📸 Gesamte Beiträge', value: stats.totalItems },
    { label: '🖼️ Bilder', value: stats.images },
    { label: '🎥 Videos', value: stats.videos },
    { label: '💌 Notizen', value: stats.notes },
    { label: '👥 Beitragende', value: stats.contributors }
  ];
  
  statsData.forEach((stat, index) => {
    const x = 40;
    const y = yPosition + (index * 25);
    
    pdf.setFillColor(249, 250, 251);
    pdf.rect(x - 5, y - 15, pageWidth - 70, 20, 'F');
    
    pdf.setFont('helvetica', 'normal');
    pdf.text(stat.label, x, y, { align: 'left' });
    
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(219, 39, 119);
    pdf.text(stat.value.toString(), pageWidth - 40, y, { align: 'right' });
    
    pdf.setTextColor(55, 65, 81);
  });
  
  yPosition += statsData.length * 25 + 30;
  
  // Contributors list
  if (stats.contributors > 0) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(139, 69, 19);
    pdf.text('👥 Unsere wunderbaren Gäste:', 40, yPosition);
    
    yPosition += 20;
    
    const contributors = Array.from(new Set(mediaItems.map(item => item.uploadedBy)));
    contributors.forEach((contributor, index) => {
      const userItems = mediaItems.filter(item => item.uploadedBy === contributor);
      const userStats = {
        images: userItems.filter(item => item.type === 'image').length,
        videos: userItems.filter(item => item.type === 'video').length,
        notes: userItems.filter(item => item.type === 'note').length
      };
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(12);
      pdf.setTextColor(55, 65, 81);
      
      let contributionText = `• ${contributor}: `;
      const contributions = [];
      if (userStats.images > 0) contributions.push(`${userStats.images} Bild${userStats.images > 1 ? 'er' : ''}`);
      if (userStats.videos > 0) contributions.push(`${userStats.videos} Video${userStats.videos > 1 ? 's' : ''}`);
      if (userStats.notes > 0) contributions.push(`${userStats.notes} Notiz${userStats.notes > 1 ? 'en' : ''}`);
      
      contributionText += contributions.join(', ');
      
      pdf.text(contributionText, 50, yPosition + (index * 15));
    });
  }
};

// Create notes page
const createNotesPage = (pdf: jsPDF, mediaItems: MediaItem[]) => {
  const notes = mediaItems.filter(item => item.type === 'note' && item.noteText);
  
  if (notes.length === 0) return;
  
  pdf.addPage();
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 40;
  
  // Page title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.setTextColor(139, 69, 19);
  pdf.text('💌 Liebevolle Nachrichten', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 40;
  
  notes.forEach((note, index) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 80) {
      pdf.addPage();
      yPosition = 40;
    }
    
    // Note box background
    pdf.setFillColor(254, 242, 242); // Light pink background
    pdf.rect(30, yPosition - 15, pageWidth - 60, 60, 'F');
    
    // Note number and author
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(219, 39, 119);
    pdf.text(`${index + 1}. Von: ${note.uploadedBy}`, 40, yPosition);
    
    // Date
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(107, 114, 128);
    const noteDate = new Date(note.uploadedAt).toLocaleDateString('de-DE');
    pdf.text(noteDate, pageWidth - 40, yPosition, { align: 'right' });
    
    // Note text
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(55, 65, 81);
    
    const noteLines = pdf.splitTextToSize(`"${note.noteText}"`, pageWidth - 80);
    pdf.text(noteLines, 40, yPosition + 15);
    
    yPosition += Math.max(60, noteLines.length * 5 + 30);
  });
};

// Add image to PDF with proper scaling
const addImageToPDF = async (pdf: jsPDF, imageUrl: string, item: MediaItem, pageIndex: number) => {
  try {
    const base64Image = await loadImageAsBase64(imageUrl);
    
    pdf.addPage();
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Add image
    const maxWidth = pageWidth - 40;
    const maxHeight = pageHeight - 100;
    
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
    
    pdf.addImage(base64Image, 'JPEG', x, y, imgWidth, imgHeight);
    
    // Add image info
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(139, 69, 19);
    pdf.text(`📸 Bild ${pageIndex}`, pageWidth / 2, 40, { align: 'center' });
    
    // Add metadata
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(107, 114, 128);
    
    const uploadDate = new Date(item.uploadedAt).toLocaleDateString('de-DE');
    pdf.text(`Von: ${item.uploadedBy}`, 20, pageHeight - 30);
    pdf.text(`Datum: ${uploadDate}`, pageWidth - 20, pageHeight - 30, { align: 'right' });
    
  } catch (error) {
    console.error(`Error adding image to PDF: ${error}`);
    
    // Add error page instead
    pdf.addPage();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(239, 68, 68);
    pdf.text('❌ Bild konnte nicht geladen werden', pageWidth / 2, pageHeight / 2 - 20, { align: 'center' });
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(107, 114, 128);
    pdf.text(`Von: ${item.uploadedBy}`, pageWidth / 2, pageHeight / 2, { align: 'center' });
    
    const uploadDate = new Date(item.uploadedAt).toLocaleDateString('de-DE');
    pdf.text(`Datum: ${uploadDate}`, pageWidth / 2, pageHeight / 2 + 15, { align: 'center' });
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
    // Create PDF document
    const pdf = new jsPDF({
      orientation: options.layout,
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    
    // Create cover page
    createCoverPage(pdf, options);
    
    // Create statistics page
    createStatsPage(pdf, mediaItems);
    
    // Create notes page if requested
    if (options.includeNotes) {
      createNotesPage(pdf, mediaItems);
    }
    
    // Add images
    const images = mediaItems.filter(item => item.type === 'image' && item.url);
    
    if (images.length > 0) {
      // Add section divider for photos
      pdf.addPage();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(28);
      pdf.setTextColor(139, 69, 19);
      pdf.text('📸 Unsere Hochzeitsbilder', pageWidth / 2, pageHeight / 2, { align: 'center' });
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(16);
      pdf.setTextColor(107, 114, 128);
      pdf.text(`${images.length} wunderschöne Erinnerungen`, pageWidth / 2, pageHeight / 2 + 30, { align: 'center' });
      
      // Add each image
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        await addImageToPDF(pdf, image.url, image, i + 1);
        
        // Show progress (in a real app, you might want to show this to the user)
        console.log(`Processing image ${i + 1} of ${images.length}...`);
      }
    }
    
    // Add final page
    pdf.addPage();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(24);
    pdf.setTextColor(139, 69, 19);
    pdf.text('💕 Vielen Dank!', pageWidth / 2, pageHeight / 2 - 40, { align: 'center' });
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(16);
    pdf.setTextColor(107, 114, 128);
    
    const thankYouText = [
      'Danke an alle unsere lieben Gäste,',
      'die diese wunderschönen Momente',
      'mit uns geteilt haben!',
      '',
      'Eure Kristin & Maurizio 💍'
    ];
    
    thankYouText.forEach((line, index) => {
      pdf.text(line, pageWidth / 2, pageHeight / 2 - 10 + (index * 15), { align: 'center' });
    });
    
    // Generate filename
    const today = new Date().toISOString().slice(0, 10);
    const filename = `Hochzeitsfotobuch_Kristin_Maurizio_${today}.pdf`;
    
    // Save the PDF
    pdf.save(filename);
    
    console.log('✅ PDF Fotobuch erfolgreich erstellt!');
    
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