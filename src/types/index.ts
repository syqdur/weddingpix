export interface MediaItem {
  id: string;
  name: string;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  deviceId: string;
  type: 'image' | 'video';
}

export interface Comment {
  id: string;
  mediaId: string;
  text: string;
  userName: string;
  deviceId: string;
  createdAt: string;
}