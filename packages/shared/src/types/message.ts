/** Messages Collection — per docs/database_schema.md §3 */
export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'file';
export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string; // text or FileURL
  type: MessageType;
  status: MessageStatus;
  timestamp: string; // ISO DateTime
  /** FEAT-02: reply & forward */
  replyToId?: string | null;
  forwardedFromId?: string | null;
}
