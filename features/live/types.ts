export type LiveEventType =
  | 'chat.message'
  | 'chat.typing'
  | 'location.update'
  | 'presence.update'
  | 'night.updated';

export interface EncryptedEventPayload {
  type: LiveEventType;
  payload: string; // base64-encoded encrypted blob
  sender_id: string;
  timestamp: string;
}

export interface DecryptedChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: string;
}

export interface DecryptedLocationUpdate {
  senderId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface PresenceMember {
  id: string;
  name: string;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
