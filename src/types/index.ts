export interface MediaItem {
  id: string;
  name: string;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  deviceId: string;
  type: 'image' | 'video' | 'note';
  noteText?: string;
  isUnavailable?: boolean;
}

export interface Comment {
  id: string;
  mediaId: string;
  text: string;
  userName: string;
  deviceId: string;
  createdAt: string;
}

export interface Like {
  id: string;
  mediaId: string;
  userName: string;
  deviceId: string;
  createdAt: string;
}

// Spotify Types
export interface SpotifyCredentials {
  id: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  createdAt: string;
}

export interface SelectedPlaylist {
  id: string;
  playlistId: string;
  name: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  uri: string;
}

// Timeline Types
export interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  imageUrl?: string;
  mediaType?: 'image' | 'video';
  uploadedBy: string;
  createdAt: string;
  position?: 'left' | 'right'; // For alternating display
}