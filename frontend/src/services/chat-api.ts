import { http, type ApiResponse } from './api-client';

export const CHAT_BODY_MAX = 2000;
export const CHAT_ATTACHMENT_MAX_BYTES = 100 * 1024 * 1024;

export const CHAT_ATTACHMENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
] as const;

export type ChatAttachmentType = (typeof CHAT_ATTACHMENT_TYPES)[number];

export interface ChatPeer {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export interface ChatLastMessage {
  id: string;
  senderId: string;
  preview: string;
  createdAt: string;
}

export interface ChatConversation {
  friendshipId: string;
  peer: ChatPeer;
  unreadCount: number;
  lastMessage: ChatLastMessage | null;
}

export interface ChatAttachment {
  kind: 'IMAGE' | 'VIDEO';
  contentType: string;
  byteSize: number;
  url: string | null;
}

export interface ChatMessage {
  id: string;
  friendshipId: string;
  senderId: string;
  body: string | null;
  createdAt: string;
  read: boolean;
  attachment: ChatAttachment | null;
}

export interface ChatHistory {
  messages: ChatMessage[];
  nextBefore: string | null;
}

export interface ChatPresign {
  uploadUrl: string;
  objectKey: string;
  headers: Record<string, string>;
  expiresInSeconds: number;
  method: 'PUT';
}

export function listChatConversations(): Promise<ApiResponse<ChatConversation[]>> {
  return http.get<ChatConversation[]>('/chat/conversations');
}

export function listChatMessages(
  friendshipId: string,
  before?: string | null
): Promise<ApiResponse<ChatHistory>> {
  return http.get<ChatHistory>(
    `/chat/conversations/${encodeURIComponent(friendshipId)}/messages`,
    before ? { params: { before } } : undefined
  );
}

export function sendChatMessage(
  friendshipId: string,
  body: {
    body?: string;
    attachment?: { objectKey: string; contentType: string; byteSize: number };
  }
): Promise<ApiResponse<ChatMessage>> {
  return http.post<ChatMessage>(
    `/chat/conversations/${encodeURIComponent(friendshipId)}/messages`,
    body
  );
}

export function markChatRead(friendshipId: string): Promise<ApiResponse<{ lastReadAt: string }>> {
  return http.post<{ lastReadAt: string }>(
    `/chat/conversations/${encodeURIComponent(friendshipId)}/read`
  );
}

export function presignChatAttachment(body: {
  friendshipId: string;
  contentType: ChatAttachmentType;
  fileSizeBytes: number;
}): Promise<ApiResponse<ChatPresign>> {
  return http.post<ChatPresign>('/chat/attachments/presign', body);
}
