export interface ChatMessage {
  messageId: number;
  conversationId: number;
  userId: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'VIDEO' | 'AUDIO';
  replyToMessageId: number | null;
  isEdited: boolean;
  isReply: boolean;
  createdAt: string;
  updatedAt: string;
  isMine?: boolean;
  sentAtLabel?: string;
}

export interface ChatParticipant {
  userId: string;
  username: string;
  email: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  status?: 'online' | 'idle' | 'offline';
  subtitle?: string;
}

export interface ChatConversation {
  id: number;
  type: 'GROUP' | 'DM';
  channelId?: number;
  createdAt: string;
  participant?: ChatParticipant;
  messages?: ChatMessage[];
  unreadCount?: number;
  lastMessagePreview?: string;
  lastMessageLabel?: string;
  lastMessageAt?: string;
}

export interface WebSocketNotification<T> {
  type: 'MESSAGE_CREATED' | 'MESSAGE_EDITED' | 'MESSAGE_DELETED';
  payload: T;
  timestamp: number;
}
