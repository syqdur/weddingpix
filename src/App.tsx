import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, MoreHorizontal, Sun, Moon } from 'lucide-react';
import { UserNamePrompt } from './components/UserNamePrompt';
import { UploadSection } from './components/UploadSection';
import { InstagramGallery } from './components/InstagramGallery';
import { MediaModal } from './components/MediaModal';
import { AdminPanel } from './components/AdminPanel';
import { ProfileHeader } from './components/ProfileHeader';
import { UnderConstructionPage } from './components/UnderConstructionPage';
import { LiveViewCounter } from './components/LiveViewCounter';
import { StoriesBar } from './components/StoriesBar';
import { StoriesViewer } from './components/StoriesViewer';
import { StoryUploadModal } from './components/StoryUploadModal';
import { useUser } from './hooks/useUser';
import { useDarkMode } from './hooks/useDarkMode';
import { MediaItem, Comment, Like } from './types';
import {
  uploadFiles,
  uploadVideoBlob,
  loadGallery,
  deleteMediaItem,
  loadComments,
  addComment,
  deleteComment,
  loadLikes,
  toggleLike,
  addNote,
  editNote
} from './services/firebaseService';
import { subscribeSiteStatus, SiteStatus } from './services/siteStatusService';
import {
  updateUserPresence,
  setUserOffline,
  subscribeLiveUsers,
  subscribeStories,
  subscribeAllStories,
  addStory,
  markStoryAsViewed,
  deleteStory,
  cleanupExpiredStories,
  LiveUser,
  Story
} from './services/liveService';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './config/firebase';

function App() {
  const { userName, deviceId, showNamePrompt, setUserName } = useUser();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState<Like[]>([]);
  const [liveUsers, setLiveUsers] = useState<LiveUser[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [status, setStatus] = useState('');
  const [siteStatus, setSiteStatus] = useState<SiteStatus | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showStoriesViewer, setShowStoriesViewer] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showStoryUpload, setShowStoryUpload] = useState(false);

  // Subscribe to site status changes
  useEffect(() => {
    const unsubscribe = subscribeSiteStatus((status) => {
      setSiteStatus(status);
    });

    return unsubscribe;
  }, []);

  // Subscribe to live users and stories when user is logged in
  useEffect(() => {
    if (!userName || !siteStatus || siteStatus.isUnderConstruction) return;

    // Update user presence
    updateUserPresence(userName, deviceId);

    // Set up presence heartbeat
    const presenceInterval = setInterval(() => {
      updateUserPresence(userName, deviceId);
    }, 30000); // Update every 30 seconds

    // Subscribe to live users
    const unsubscribeLiveUsers = subscribeLiveUsers(setLiveUsers);

    // Subscribe to stories (admin sees all, users see only active)
    const unsubscribeStories = isAdmin 
      ? subscribeAllStories(setStories)
      : subscribeStories(setStories);

    // Cleanup expired stories periodically
    const cleanupInterval = setInterval(() => {
      cleanupExpiredStories();
    }, 60000); // Check every minute

    // Set user offline when leaving
    const handleBeforeUnload = () => {
      setUserOffline(deviceId);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(presenceInterval);
      clearInterval(cleanupInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      setUserOffline(deviceId);
      unsubscribeLiveUsers();
      unsubscribeStories();
    };
  }, [userName, deviceId, siteStatus, isAdmin]);

  useEffect(() => {
    if (!userName || !siteStatus || siteStatus.isUnderConstruction) return;

    const unsubscribeGallery = loadGallery(setMediaItems);
    const unsubscribeComments = loadComments(setComments);
    const unsubscribeLikes = loadLikes(setLikes);

    return () => {
      unsubscribeGallery();
      unsubscribeComments();
      unsubscribeLikes();
    };
  }, [userName, siteStatus]);

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

  const handleVideoUpload = async (videoBlob: Blob) => {
    if (!userName) return;

    setIsUploading(true);
    setUploadProgress(0);
    setStatus('⏳ Video wird hochgeladen...');

    try {
      await uploadVideoBlob(videoBlob, userName, deviceId, setUploadProgress);
      setStatus('✅ Video erfolgreich hochgeladen!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus('❌ Fehler beim Hochladen des Videos. Bitte versuche es erneut.');
      console.error('Video upload error:', error);
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

  const handleEditNote = async (item: MediaItem, newText: string) => {
    if (!userName || item.uploadedBy !== userName) {
      alert('Du kannst nur deine eigenen Notizen bearbeiten.');
      return;
    }

    setIsUploading(true);
    setStatus('⏳ Notiz wird aktualisiert...');

    try {
      await editNote(item.id, newText);
      setStatus('✅ Notiz erfolgreich aktualisiert!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus('❌ Fehler beim Aktualisieren der Notiz. Bitte versuche es erneut.');
      console.error('Edit note error:', error);
      setTimeout(() => setStatus(''), 5000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (item: MediaItem) => {
    // Check permissions
    if (!isAdmin && item.uploadedBy !== userName) {
      alert('Du kannst nur deine eigenen Beiträge löschen.');
      return;
    }

    const itemType = item.type === 'note' ? 'Notiz' : item.type === 'video' ? 'Video' : 'Bild';
    const confirmMessage = isAdmin 
      ? `${itemType} von ${item.uploadedBy} wirklich löschen?`
      : `Dein${item.type === 'note' ? 'e' : ''} ${itemType} wirklich löschen?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      await deleteMediaItem(item);
      setStatus(`✅ ${itemType} erfolgreich gelöscht!`);
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus(`❌ Fehler beim Löschen des ${itemType}s.`);
      console.error('Delete error:', error);
      setTimeout(() => setStatus(''), 5000);
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

  const handleStoryUpload = async (file: File) => {
    if (!userName) return;

    try {
      // Upload file to Firebase Storage
      const fileName = `${Date.now()}-${file.name}`;
      const storageRef = ref(storage, `stories/${fileName}`);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      // Add story to Firestore
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
      await addStory(downloadURL, mediaType, userName, deviceId, fileName);
      
      setStatus('✅ Story erfolgreich hinzugefügt!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Story upload error:', error);
      setStatus('❌ Fehler beim Hochladen der Story. Bitte versuche es erneut.');
      setTimeout(() => setStatus(''), 5000);
    }
  };

  const handleViewStory = (storyIndex: number) => {
    setCurrentStoryIndex(storyIndex);
    setShowStoriesViewer(true);
  };

  const handleStoryViewed = async (storyId: string) => {
    await markStoryAsViewed(storyId, deviceId);
  };

  const handleDeleteStory = async (storyId: string) => {
    try {
      await deleteStory(storyId);
      setStatus('✅ Story erfolgreich gelöscht!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Error deleting story:', error);
      setStatus('❌ Fehler beim Löschen der Story.');
      setTimeout(() => setStatus(''), 5000);
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

  // Show loading while site status is being fetched
  if (siteStatus === null) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          <p className={`text-lg transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Lade Website...
          </p>
        </div>
      </div>
    );
  }

  // Show under construction page if site is under construction
  if (siteStatus.isUnderConstruction) {
    return (
      <UnderConstructionPage 
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode}
        siteStatus={siteStatus}
        isAdmin={isAdmin}
        onToggleAdmin={setIsAdmin}
      />
    );
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
              {/* Live View Counter */}
              <LiveViewCounter 
                liveUsers={liveUsers}
                currentUser={userName || ''}
                isDarkMode={isDarkMode}
              />
              
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
        
        {/* Stories Bar */}
        <StoriesBar
          stories={stories}
          currentUser={userName || ''}
          onAddStory={() => setShowStoryUpload(true)}
          onViewStory={handleViewStory}
          isDarkMode={isDarkMode}
        />
        
        <UploadSection
          onUpload={handleUpload}
          onVideoUpload={handleVideoUpload}
          onNoteSubmit={handleNoteSubmit}
          onAddStory={() => setShowStoryUpload(true)}
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
          onEditNote={handleEditNote}
          isAdmin={isAdmin}
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
        isAdmin={isAdmin}
        isDarkMode={isDarkMode}
      />

      {/* Stories Viewer */}
      <StoriesViewer
        isOpen={showStoriesViewer}
        stories={stories}
        initialStoryIndex={currentStoryIndex}
        currentUser={userName || ''}
        onClose={() => setShowStoriesViewer(false)}
        onStoryViewed={handleStoryViewed}
        onDeleteStory={handleDeleteStory}
        isAdmin={isAdmin}
        isDarkMode={isDarkMode}
      />

      {/* Story Upload Modal */}
      <StoryUploadModal
        isOpen={showStoryUpload}
        onClose={() => setShowStoryUpload(false)}
        onUpload={handleStoryUpload}
        isDarkMode={isDarkMode}
      />

      <AdminPanel 
        isDarkMode={isDarkMode} 
        isAdmin={isAdmin}
        onToggleAdmin={setIsAdmin}
        mediaItems={mediaItems}
        siteStatus={siteStatus}
      />
    </div>
  );
}

export default App;