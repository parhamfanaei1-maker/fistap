import { create } from 'zustand';
import type { Message, MessageStatus } from '@fistap/shared';

export interface ConversationSummary {
  _id: string;
  type: 'private' | 'group' | 'channel';
  participants: string[];
  createdAt: string;
  lastMessage: Message | null;
  pinnedMessageId: string | null;
  title?: string;
  avatarUrl: string | null;
}

/** پیام خوش‌بین: قبل از ack سرور با tempId در UI نشان داده می‌شود */
export interface PendingMessage extends Message {
  pending?: boolean;
  failed?: boolean;
  tempId?: string;
}

interface ChatState {
  conversations: ConversationSummary[];
  /** conversationId → پیام‌ها (مرتب زمانی صعودی) */
  messagesByConv: Record<string, PendingMessage[]>;
  activeConversationId: string | null;
  /** conversationId → userId هایی که در حال تایپ‌اند */
  typingByConv: Record<string, string[]>;
  replyTo: Message | null;
  /** Task 3.4: conversationId → پیام پین‌شده کامل (برای PinnedBar) */
  pinnedByConv: Record<string, Message | null>;
  /** Task 4.1: شروع چت از مخاطب — قبل از اولین پیام هنوز گفتگویی وجود ندارد */
  draftRecipient: { userId: string; displayName: string } | null;

  setConversations: (list: ConversationSummary[]) => void;
  setActiveConversation: (id: string | null) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  /** افزودن خوش‌بین — Task 2.2: tempId تا زمان ack */
  addPending: (conversationId: string, message: PendingMessage) => void;
  /** ack موفق: جایگزینی tempId با پیام واقعی (+ جابجایی به conversation واقعی اگر اولین پیام بود) */
  resolvePending: (conversationId: string, tempId: string, real: Message) => void;
  failPending: (conversationId: string, tempId: string) => void;
  /** دریافت message:new — با محافظ تکرار */
  addIncoming: (message: Message) => void;
  /** message:status — ارتقای وضعیت بدون پس‌رفت */
  applyStatus: (conversationId: string, messageId: string, status: MessageStatus) => void;
  setTyping: (conversationId: string, userId: string, isTyping: boolean) => void;
  setReplyTo: (message: Message | null) => void;
  bumpConversation: (message: Message) => void;
  /** Task 3.4 */
  setPinned: (conversationId: string, message: Message | null) => void;
  /** Task 4.1 */
  setDraftRecipient: (draft: { userId: string; displayName: string } | null) => void;
}

const STATUS_RANK: Record<MessageStatus, number> = { sent: 0, delivered: 1, read: 2 };

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  messagesByConv: {},
  activeConversationId: null,
  typingByConv: {},
  replyTo: null,
  pinnedByConv: {},
  draftRecipient: null,

  setConversations: (list) => set({ conversations: list }),
  setActiveConversation: (id) => set({ activeConversationId: id, replyTo: null, draftRecipient: null }),

  setDraftRecipient: (draft) => set({ draftRecipient: draft, activeConversationId: null, replyTo: null }),

  setMessages: (conversationId, messages) =>
    set((s) => ({ messagesByConv: { ...s.messagesByConv, [conversationId]: messages } })),

  addPending: (conversationId, message) =>
    set((s) => ({
      messagesByConv: {
        ...s.messagesByConv,
        [conversationId]: [...(s.messagesByConv[conversationId] ?? []), message],
      },
    })),

  resolvePending: (conversationId, tempId, real) =>
    set((s) => {
      const tempList = (s.messagesByConv[conversationId] ?? []).filter((m) => m.tempId !== tempId);
      const targetList = conversationId === real.conversationId ? tempList : (s.messagesByConv[real.conversationId] ?? []);
      const next = { ...s.messagesByConv, [real.conversationId]: [...targetList, real] };
      if (conversationId !== real.conversationId) next[conversationId] = tempList;
      return { messagesByConv: next };
    }),

  failPending: (conversationId, tempId) =>
    set((s) => ({
      messagesByConv: {
        ...s.messagesByConv,
        [conversationId]: (s.messagesByConv[conversationId] ?? []).map((m) =>
          m.tempId === tempId ? { ...m, pending: false, failed: true } : m,
        ),
      },
    })),

  addIncoming: (message) => {
    const { messagesByConv } = get();
    const list = messagesByConv[message.conversationId] ?? [];
    if (list.some((m) => m._id === message._id)) return; // محافظ تکرار (چند دستگاه)
    set((s) => ({
      messagesByConv: {
        ...s.messagesByConv,
        [message.conversationId]: [...(s.messagesByConv[message.conversationId] ?? []), message],
      },
    }));
    get().bumpConversation(message);
  },

  applyStatus: (conversationId, messageId, status) =>
    set((s) => ({
      messagesByConv: {
        ...s.messagesByConv,
        [conversationId]: (s.messagesByConv[conversationId] ?? []).map((m) =>
          m._id === messageId && STATUS_RANK[status] > STATUS_RANK[m.status] ? { ...m, status } : m,
        ),
      },
    })),

  setTyping: (conversationId, userId, isTyping) =>
    set((s) => {
      const current = s.typingByConv[conversationId] ?? [];
      const next = isTyping
        ? current.includes(userId) ? current : [...current, userId]
        : current.filter((id) => id !== userId);
      return { typingByConv: { ...s.typingByConv, [conversationId]: next } };
    }),

  setReplyTo: (message) => set({ replyTo: message }),

  setPinned: (conversationId, message) =>
    set((s) => ({ pinnedByConv: { ...s.pinnedByConv, [conversationId]: message } })),

  bumpConversation: (message) =>
    set((s) => {
      const idx = s.conversations.findIndex((c) => c._id === message.conversationId);
      if (idx === -1) return {};
      const updated = { ...s.conversations[idx]!, lastMessage: message };
      const rest = s.conversations.filter((_, i) => i !== idx);
      return { conversations: [updated, ...rest] };
    }),
}));
