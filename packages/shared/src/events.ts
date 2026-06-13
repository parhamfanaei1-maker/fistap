/**
 * قرارداد واحد رویدادهای Socket.io — system_architecture.md §1
 * هر دو سمت (client/services/socket.ts و server/sockets/*) فقط از این فایل استفاده می‌کنند.
 */
import type { Message, MessageStatus, MessageType } from './types/message.js';

export const SOCKET_EVENTS = {
  // client -> server
  MESSAGE_SEND: 'message:send',
  MESSAGE_READ: 'message:read',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  // server -> client
  MESSAGE_NEW: 'message:new',
  MESSAGE_STATUS: 'message:status',
  TYPING_UPDATE: 'typing:update',
  PRESENCE_UPDATE: 'presence:update',
  /** Task 3.4: تغییر پیام پین‌شده گفتگو */
  CONVERSATION_PIN: 'conversation:pin',
} as const;

/** Task 2.2: پیام اول گفتگوی خصوصی با recipientId ارسال می‌شود (گفتگو خودکار ساخته می‌شود) */
export interface MessageSendPayload {
  conversationId?: string;
  recipientId?: string;
  content: string;
  type: MessageType;
  /** شناسه موقت کلاینت برای UI خوش‌بین (Optimistic) */
  tempId: string;
  /** ISS-001 (FEAT-02 Reply): پاسخ به پیام */
  replyToId?: string | null;
  /** ISS-002 (FEAT-02 Forward): بازارسال از پیام */
  forwardedFromId?: string | null;
}

export type MessageSendAck =
  | { ok: true; tempId: string; message: Message }
  | { ok: false; tempId: string; error: { code: string; message: string } };

export interface ClientToServerEvents {
  [SOCKET_EVENTS.MESSAGE_SEND]: (payload: MessageSendPayload, ack: (res: MessageSendAck) => void) => void;
  [SOCKET_EVENTS.MESSAGE_READ]: (payload: { conversationId: string; messageId: string }) => void;
  [SOCKET_EVENTS.TYPING_START]: (payload: { conversationId: string }) => void;
  [SOCKET_EVENTS.TYPING_STOP]: (payload: { conversationId: string }) => void;
}

export interface ServerToClientEvents {
  [SOCKET_EVENTS.MESSAGE_NEW]: (message: Message) => void;
  [SOCKET_EVENTS.MESSAGE_STATUS]: (payload: {
    conversationId: string;
    messageId: string;
    status: MessageStatus;
  }) => void;
  [SOCKET_EVENTS.TYPING_UPDATE]: (payload: { conversationId: string; userId: string; isTyping: boolean }) => void;
  [SOCKET_EVENTS.PRESENCE_UPDATE]: (payload: { userId: string; online: boolean; lastSeen: string }) => void;
  [SOCKET_EVENTS.CONVERSATION_PIN]: (payload: {
    conversationId: string;
    pinnedMessage: Message | null;
    pinnedBy: string;
  }) => void;
}
