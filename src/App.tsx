import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share, Bookmark, MoreHorizontal } from 'lucide-react';
import { UserNamePrompt } from './components/UserNamePrompt';
import { UploadSection } from './components/UploadSection';
import { InstagramGallery } from './components/InstagramGallery';
import { MediaModal } from './components/MediaModal';
import { AdminPanel } from './components/AdminPanel';
import { ProfileHeader } from './components/ProfileHeader';
import { useUser } from './hooks/useUser';
import { MediaItem, Comment } from './types';
import {
  uploadFiles,
  loadGallery,
  deleteMediaItem,
  loadComments,
  addComment
} from './services/firebaseService';

function App() {
  const { userName, deviceId, showNamePrompt, setUserName } = useUser();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!userName) return;

    const unsubscribeGallery = loadGallery(setMediaItems);
    const unsubscribeComments = loadComments(setComments);

    return () => {
      unsubscribeGallery();
      unsubscribeComments();
    };
  }, [userName]);

  const handleUpload = async (files: FileList) => {
    if (!userName) return;

    setIsUploading(true);
    setUploadProgress(0);
    setStatus('⏳ Lädt hoch...');

    try {
      await uploadFiles(files, userName, deviceId, setUploadProgress);
      setStatus('✅ Bilder erfolgreich hochgeladen!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus('❌ Fehler beim Hochladen. Bitte versuche es erneut.');
      console.error('Upload error:', error);
      setTimeout(() => setStatus(''), 5000);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (item: MediaItem) => {
    try {
      await deleteMediaItem(item);
    } catch (error) {
      alert('Fehler beim Löschen der Datei.');
      console.error('Delete error:', error);
    }
  };

  const handleAddComment = async (mediaId: string, text: string) => {
    if (!userName) return;
    
    try {
      await addComment(mediaId, text, userName, deviceId);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const openModal = (index: number) => {
    setCurrentImageIndex(index);
    setModalOpen(true);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === mediaItems.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? mediaItems.length - 1 : prev - 1
    );
  };

  if (showNamePrompt) {
    return <UserNamePrompt onSubmit={setUserName} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Instagram-style header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">👰🤵‍♂️ kristinundmauro</h1>
            <div className="flex items-center gap-4">
              <Heart className="w-6 h-6" />
              <MessageCircle className="w-6 h-6" />
              <Share className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto bg-white">
        <ProfileHeader />
        
        <UploadSection
          onUpload={handleUpload}
          isUploading={isUploading}
          progress={uploadProgress}
        />

        {status && (
          <div className="px-4 py-2">
            <p className="text-sm text-center" dangerouslySetInnerHTML={{ __html: status }} />
          </div>
        )}

        <InstagramGallery
          items={mediaItems}
          onItemClick={openModal}
          onDelete={handleDelete}
          isAdmin={isAdmin}
          comments={comments}
          onAddComment={handleAddComment}
          userName={userName || ''}
        />
      </div>

      <MediaModal
        isOpen={modalOpen}
        items={mediaItems}
        currentIndex={currentImageIndex}
        onClose={() => setModalOpen(false)}
        onNext={nextImage}
        onPrev={prevImage}
        comments={comments}
        onAddComment={handleAddComment}
        userName={userName || ''}
      />

      <AdminPanel
        isAdmin={isAdmin}
        onToggleAdmin={setIsAdmin}
      />
    </div>
  );
}

export default App;