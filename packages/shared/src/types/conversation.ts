/** Conversations Collection — per docs/database_schema.md §2 */
export type ConversationType = 'private' | 'group' | 'channel';

export interface Conversation {
  _id: string;
  type: ConversationType;
  participants: string[]; // UserIDs
  createdAt: string;
  lastMessageId: string | null;
  /** FEAT-02: pinned message id stored per conversation */
  pinnedMessageId?: string | null;
  /** group/channel metadata (Phase 3) */
  title?: string;
  avatarUrl?: string | null;
}
