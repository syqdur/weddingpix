import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, MoreHorizontal, Sun, Moon } from 'lucide-react';
import { UserNamePrompt } from './components/UserNamePrompt';
import { UploadSection } from './components/UploadSection';
import { InstagramGallery } from './components/InstagramGallery';
import { MediaModal } from './components/MediaModal';
import { AdminPanel } from './components/AdminPanel';
import { ProfileHeader } from './components/ProfileHeader';
import { UnderConstructionPage } from './components/UnderConstructionPage';
import { useUser } from './hooks/useUser';
import { useDarkMode } from './hooks/useDarkMode';
import { MediaItem, Comment, Like } from './types';
import {
  uploadFiles,
  loadGallery,
  deleteMediaItem,
  loadComments,
  addComment,
  deleteComment,
  loadLikes,
  toggleLike,
  addNote
} from './services/firebaseService';

function App() {
  const { userName, deviceId, showNamePrompt, setUserName } = useUser();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState<Like[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [status, setStatus] = useState('');
  const [isUnderConstruction, setIsUnderConstruction] = useState(true);

  useEffect(() => {
    // Check under construction status
    const constructionStatus = localStorage.getItem('wedding_under_construction');
    setIsUnderConstruction(constructionStatus !== 'false');
  }, []);

  useEffect(() => {
    if (!userName || isUnderConstruction) return;

    const unsubscribeGallery = loadGallery(setMediaItems);
    const unsubscribeComments = loadComments(setComments);
    const unsubscribeLikes = loadLikes(setLikes);

    return () => {
      unsubscribeGallery();
      unsubscribeComments();
      unsubscribeLikes();
    };
  }, [userName, isUnderConstruction]);

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

  const handleNoteSubmit = async (noteText: string) => {
    if (!userName) return;

    setIsUploading(true);
    setStatus('⏳ Notiz wird gespeichert...');

    try {
      await addNote(noteText, userName, deviceId);
      setStatus('✅ Notiz erfolgreich hinterlassen!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus('❌ Fehler beim Speichern der Notiz. Bitte versuche es erneut.');
      console.error('Note error:', error);
      setTimeout(() => setStatus(''), 5000);
    } finally {
      setIsUploading(false);
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

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleToggleLike = async (mediaId: string) => {
    if (!userName) return;
    
    try {
      await toggleLike(mediaId, userName, deviceId);
    } catch (error) {
      console.error('Error toggling like:', error);
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

  // Show under construction page if enabled
  if (isUnderConstruction) {
    return <UnderConstructionPage isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />;
  }

  if (showNamePrompt) {
    return <UserNamePrompt onSubmit={setUserName} isDarkMode={isDarkMode} />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Instagram-style header */}
      <div className={`border-b sticky top-0 z-40 transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className={`text-xl font-semibold transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              👰🤵‍♂️ kristinundmauro
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-full transition-colors duration-300 ${
                  isDarkMode 
                    ? 'text-yellow-400 hover:bg-gray-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <Heart className={`w-6 h-6 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`} />
              <MessageCircle className={`w-6 h-6 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`} />
            </div>
          </div>
        </div>
      </div>

      <div className={`max-w-md mx-auto transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <ProfileHeader isDarkMode={isDarkMode} />
        
        <UploadSection
          onUpload={handleUpload}
          onNoteSubmit={handleNoteSubmit}
          isUploading={isUploading}
          progress={uploadProgress}
          isDarkMode={isDarkMode}
        />

        {status && (
          <div className="px-4 py-2">
            <p className={`text-sm text-center transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`} dangerouslySetInnerHTML={{ __html: status }} />
          </div>
        )}

        <InstagramGallery
          items={mediaItems}
          onItemClick={openModal}
          onDelete={handleDelete}
          isAdmin={false}
          comments={comments}
          likes={likes}
          onAddComment={handleAddComment}
          onDeleteComment={handleDeleteComment}
          onToggleLike={handleToggleLike}
          userName={userName || ''}
          isDarkMode={isDarkMode}
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
        likes={likes}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
        onToggleLike={handleToggleLike}
        userName={userName || ''}
        isAdmin={false}
        isDarkMode={isDarkMode}
      />

      <AdminPanel isDarkMode={isDarkMode} />
    </div>
  );
}

export default App;