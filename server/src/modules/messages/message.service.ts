import { Types } from 'mongoose';
import type { Message } from '@fistap/shared';
import { MESSAGE_MAX_LENGTH } from '@fistap/shared';
import { ConversationModel } from '../../models/Conversation.js';
import { MessageModel } from '../../models/Message.js';

export interface SendMessageInput {
  senderId: string;
  conversationId?: string;
  recipientId?: string;
  content: string;
  type: Message['type'];
  /** ISS-001: پاسخ — باید پیام معتبرِ همان گفتگو باشد */
  replyToId?: string | null;
  /** ISS-002: بازارسال — پیام مبدأ باید برای فرستنده قابل‌دسترس باشد */
  forwardedFromId?: string | null;
}

export type SendMessageOutcome =
  | { ok: true; message: Message; recipientIds: string[] }
  | { ok: false; code: string; reason: string };

/** تبدیل سند Mongo به قرارداد مشترک Message — یک نقطه‌ی واحد serialization */
export function toMessageDto(doc: {
  _id: Types.ObjectId;
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  content: string;
  type: string;
  status: string;
  timestamp: Date;
  replyToId?: Types.ObjectId | null;
  forwardedFromId?: Types.ObjectId | null;
}): Message {
  return {
    _id: String(doc._id),
    conversationId: String(doc.conversationId),
    senderId: String(doc.senderId),
    content: doc.content,
    type: doc.type as Message['type'],
    status: doc.status as Message['status'],
    timestamp: doc.timestamp.toISOString(),
    replyToId: doc.replyToId ? String(doc.replyToId) : null,
    forwardedFromId: doc.forwardedFromId ? String(doc.forwardedFromId) : null,
  };
}

/**
 * سرویس پیام — Task 2.2 (database_schema.md §2/§3, FEAT-02)
 * - اولین پیام خصوصی: گفتگو خودکار ساخته می‌شود (findOneAndUpdate + upsert → بدون race)
 * - عضویت فرستنده در گفتگو همیشه بررسی می‌شود (امنیت: لایه ۴)
 * - last_message_id برای لود سریع Sidebar به‌روزرسانی می‌شود
 */
export class MessageService {
  async send(input: SendMessageInput): Promise<SendMessageOutcome> {
    const content = input.content.trim();
    if (!content || content.length > MESSAGE_MAX_LENGTH) {
      return { ok: false, code: 'INVALID_CONTENT', reason: `content must be 1..${MESSAGE_MAX_LENGTH} chars` };
    }
    // Task 3.3: پیام رسانه‌ای → content باید objectKey معتبر Storage باشد (نه متن دلخواه)
    if (input.type !== 'text' && !/^media\/(image|video|audio|file)\/[a-f0-9]{24}\/[\w.-]+$/.test(content)) {
      return { ok: false, code: 'INVALID_MEDIA_KEY', reason: 'media message content must be a valid object key' };
    }

    let conversation;
    if (input.conversationId) {
      if (!Types.ObjectId.isValid(input.conversationId)) {
        return { ok: false, code: 'INVALID_CONVERSATION', reason: 'bad conversation id' };
      }
      conversation = await ConversationModel.findById(input.conversationId);
      if (!conversation) return { ok: false, code: 'CONVERSATION_NOT_FOUND', reason: 'no such conversation' };
      const isMember = conversation.participants.some((p) => String(p) === input.senderId);
      if (!isMember) return { ok: false, code: 'NOT_A_MEMBER', reason: 'sender not in conversation' };
      // Task 3.1 — قاعده کانال: فقط owner/admin پیام می‌فرستد (user_roles.md §2)
      if (conversation.type === 'channel') {
        const isPrivileged =
          (conversation.ownerId && String(conversation.ownerId) === input.senderId) ||
          (conversation.admins ?? []).some((a) => String(a) === input.senderId);
        if (!isPrivileged) return { ok: false, code: 'CHANNEL_READONLY', reason: 'only admins can post in channels' };
      }
    } else if (input.recipientId) {
      if (!Types.ObjectId.isValid(input.recipientId) || input.recipientId === input.senderId) {
        return { ok: false, code: 'INVALID_RECIPIENT', reason: 'bad recipient' };
      }
      const pair = [new Types.ObjectId(input.senderId), new Types.ObjectId(input.recipientId)].sort((a, b) =>
        String(a).localeCompare(String(b)),
      );
      // upsert اتمیک روی کلید یکتا: همزمانیِ دو پیام اول → فقط یک گفتگو
      // (LL: کوئری $all+$size برای upsert قابل استنتاج نیست — privateKey ایندکس unique دارد)
      const privateKey = pair.map(String).join(':');
      conversation = await ConversationModel.findOneAndUpdate(
        { type: 'private', privateKey },
        { $setOnInsert: { type: 'private', privateKey, participants: pair } },
        { new: true, upsert: true },
      );
    } else {
      return { ok: false, code: 'MISSING_TARGET', reason: 'conversationId or recipientId required' };
    }

    // ISS-001: اعتبارسنجی Reply — لنگر باید پیامِ همان گفتگو باشد
    let replyToId: Types.ObjectId | null = null;
    if (input.replyToId) {
      if (!Types.ObjectId.isValid(input.replyToId)) {
        return { ok: false, code: 'INVALID_REPLY', reason: 'bad replyToId' };
      }
      const anchor = await MessageModel.findOne({ _id: input.replyToId, conversationId: conversation._id }).select('_id');
      if (!anchor) return { ok: false, code: 'INVALID_REPLY', reason: 'reply target not in this conversation' };
      replyToId = anchor._id;
    }

    // ISS-002: اعتبارسنجی Forward — پیام مبدأ باید در گفتگویی باشد که فرستنده عضو آن است
    let forwardedFromId: Types.ObjectId | null = null;
    if (input.forwardedFromId) {
      if (!Types.ObjectId.isValid(input.forwardedFromId)) {
        return { ok: false, code: 'INVALID_FORWARD', reason: 'bad forwardedFromId' };
      }
      const source = await MessageModel.findById(input.forwardedFromId).select('conversationId');
      if (!source) return { ok: false, code: 'INVALID_FORWARD', reason: 'source message not found' };
      const sourceConv = await ConversationModel.findById(source.conversationId).select('participants');
      const canAccess = sourceConv?.participants.some((p) => String(p) === input.senderId) ?? false;
      if (!canAccess) return { ok: false, code: 'INVALID_FORWARD', reason: 'no access to source message' };
      forwardedFromId = source._id;
    }

    const doc = await MessageModel.create({
      conversationId: conversation._id,
      senderId: new Types.ObjectId(input.senderId),
      content,
      type: input.type,
      status: 'sent',
      replyToId,
      forwardedFromId,
    });

    conversation.lastMessageId = doc._id;
    await conversation.save();

    const recipientIds = conversation.participants.map(String).filter((id) => id !== input.senderId);
    return { ok: true, message: toMessageDto(doc), recipientIds };
  }

  /**
   * Task 2.3 — Delivered: وقتی پیام به دستگاه آنلاین گیرنده تحویل شد.
   * فقط پیام‌های «sent» دیگران (نه پیام‌های خود گیرنده) ارتقا می‌یابند — وضعیت هرگز پس‌رفت نمی‌کند.
   * خروجی: پیام‌های ارتقایافته برای اطلاع فرستنده‌ها (message:status).
   */
  async markDelivered(params: {
    userId: string;
    conversationId: string;
  }): Promise<{ ok: true; updated: Array<{ messageId: string; senderId: string }> } | { ok: false; code: string }> {
    if (!Types.ObjectId.isValid(params.conversationId)) return { ok: false, code: 'INVALID_CONVERSATION' };
    const conversation = await ConversationModel.findById(params.conversationId);
    if (!conversation) return { ok: false, code: 'CONVERSATION_NOT_FOUND' };
    if (!conversation.participants.some((p) => String(p) === params.userId)) {
      return { ok: false, code: 'NOT_A_MEMBER' };
    }

    const docs = await MessageModel.find({
      conversationId: conversation._id,
      senderId: { $ne: new Types.ObjectId(params.userId) },
      status: 'sent',
    }).select('_id senderId');
    if (docs.length === 0) return { ok: true, updated: [] };

    await MessageModel.updateMany(
      { _id: { $in: docs.map((d) => d._id) } },
      { $set: { status: 'delivered' } },
    );
    return { ok: true, updated: docs.map((d) => ({ messageId: String(d._id), senderId: String(d.senderId) })) };
  }

  /**
   * Task 2.3 — Read: کاربر گفتگو را تا پیام مشخصی خواند (تا آن لحظه‌ی زمانی).
   * sent|delivered → read برای پیام‌های دیگران؛ ایده‌مپوتنت.
   */
  async markRead(params: {
    userId: string;
    conversationId: string;
    upToMessageId: string;
  }): Promise<{ ok: true; updated: Array<{ messageId: string; senderId: string }> } | { ok: false; code: string }> {
    if (!Types.ObjectId.isValid(params.conversationId) || !Types.ObjectId.isValid(params.upToMessageId)) {
      return { ok: false, code: 'INVALID_ID' };
    }
    const conversation = await ConversationModel.findById(params.conversationId);
    if (!conversation) return { ok: false, code: 'CONVERSATION_NOT_FOUND' };
    if (!conversation.participants.some((p) => String(p) === params.userId)) {
      return { ok: false, code: 'NOT_A_MEMBER' };
    }
    const anchor = await MessageModel.findOne({ _id: params.upToMessageId, conversationId: conversation._id });
    if (!anchor) return { ok: false, code: 'MESSAGE_NOT_FOUND' };

    const docs = await MessageModel.find({
      conversationId: conversation._id,
      senderId: { $ne: new Types.ObjectId(params.userId) },
      status: { $in: ['sent', 'delivered'] },
      timestamp: { $lte: anchor.timestamp },
    }).select('_id senderId');
    if (docs.length === 0) return { ok: true, updated: [] };

    await MessageModel.updateMany(
      { _id: { $in: docs.map((d) => d._id) } },
      { $set: { status: 'read' } },
    );
    return { ok: true, updated: docs.map((d) => ({ messageId: String(d._id), senderId: String(d.senderId) })) };
  }

  /** عضویت کاربر در گفتگو — برای اعتبارسنجی typing (Task 2.3) */
  async isMember(userId: string, conversationId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(conversationId)) return false;
    const conversation = await ConversationModel.findById(conversationId).select('participants');
    return conversation?.participants.some((p) => String(p) === userId) ?? false;
  }

  /** شرکای گفتگو به‌جز خود کاربر — برای هدف‌گیری رویدادهای typing/status */
  async otherParticipants(userId: string, conversationId: string): Promise<string[]> {
    if (!Types.ObjectId.isValid(conversationId)) return [];
    const conversation = await ConversationModel.findById(conversationId).select('participants');
    if (!conversation) return [];
    return conversation.participants.map(String).filter((id) => id !== userId);
  }

  /** تاریخچه با صفحه‌بندی cursor-based (before=timestamp) — ایندکس (conversationId, timestamp) از Task 1.1 */
  async history(params: {
    userId: string;
    conversationId: string;
    limit?: number;
    before?: string;
  }): Promise<{ ok: true; messages: Message[] } | { ok: false; code: string }> {
    if (!Types.ObjectId.isValid(params.conversationId)) return { ok: false, code: 'INVALID_CONVERSATION' };
    const conversation = await ConversationModel.findById(params.conversationId);
    if (!conversation) return { ok: false, code: 'CONVERSATION_NOT_FOUND' };
    if (!conversation.participants.some((p) => String(p) === params.userId)) {
      return { ok: false, code: 'NOT_A_MEMBER' };
    }

    const limit = Math.min(Math.max(params.limit ?? 50, 1), 100);
    const filter: Record<string, unknown> = { conversationId: conversation._id };
    if (params.before) filter.timestamp = { $lt: new Date(params.before) };

    const docs = await MessageModel.find(filter).sort({ timestamp: -1 }).limit(limit);
    return { ok: true, messages: docs.reverse().map(toMessageDto) };
  }

  /** لیست گفتگوهای کاربر برای Sidebar — مرتب بر اساس آخرین پیام */
  async listConversations(userId: string) {
    const docs = await ConversationModel.find({ participants: new Types.ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .limit(100);

    // واکشی آخرین پیام‌ها در یک کوئری (به‌جای populate که تایپ‌ها را می‌شکند — LL-001 خانواده)
    const lastIds = docs.map((c) => c.lastMessageId).filter((id): id is Types.ObjectId => id != null);
    const lastDocs = await MessageModel.find({ _id: { $in: lastIds } });
    const lastById = new Map(lastDocs.map((m) => [String(m._id), toMessageDto(m)]));

    return docs.map((c) => ({
      _id: String(c._id),
      type: c.type,
      participants: c.participants.map(String),
      createdAt: c.createdAt?.toISOString() ?? new Date(0).toISOString(),
      lastMessage: c.lastMessageId ? (lastById.get(String(c.lastMessageId)) ?? null) : null,
      pinnedMessageId: c.pinnedMessageId ? String(c.pinnedMessageId) : null,
      title: c.title,
      avatarUrl: c.avatarUrl ?? null,
    }));
  }
}
