export interface MediaItem {
  id: string;
  name: string;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  deviceId: string;
  type: 'image' | 'video' | 'note';
  noteText?: string;
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