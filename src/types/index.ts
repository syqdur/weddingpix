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

// Music Request Types
export interface MusicRequest {
  id: string;
  songTitle: string;
  artist: string;
  album?: string;
  spotifyUrl?: string;
  spotifyId?: string;
  spotifyUri?: string;
  requestedBy: string;
  deviceId: string;
  requestedAt: string;
  message?: string;
  status: 'pending' | 'approved' | 'played' | 'rejected';
  votes: number;
  votedBy: string[]; // Array of deviceIds who voted
  albumArt?: string;
  previewUrl?: string;
  duration?: number;
  popularity?: number;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  external_urls: {
    spotify: string;
  };
  uri: string;
  preview_url: string | null;
  duration_ms: number;
  popularity: number;
}