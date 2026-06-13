import mongoose, { Types } from 'mongoose';
import { UserModel } from '../../models/User.js';
import { ConversationModel } from '../../models/Conversation.js';
import { MessageModel } from '../../models/Message.js';
import { toMessageDto } from '../messages/message.service.js';

export interface UserSearchResult {
  userId: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
}

export interface ConversationSearchResult {
  _id: string;
  type: string;
  title?: string;
  participants: string[];
  lastMessageContent: string | null;
}

export interface SearchResult {
  users: UserSearchResult[];
  conversations: ConversationSearchResult[];
}

const RESULT_LIMIT = 20;

/** escape ورودی کاربر برای regex — ضد ReDoS/injection (حسابرس لایه ۴) */
const escapeRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * سرویس جستجوی جهانی — Task 4.4 (implementation_plan: «جستجوی جهانی کاربران و چت‌ها»)
 * users: همه کاربران با username/displayName (حریم خصوصی: شماره تلفن هرگز برنمی‌گردد)
 * conversations: فقط گفتگوهای خود کاربر (عنوان گروه/کانال)
 */
export class SearchService {
  dbReady(): boolean {
    return mongoose.connection.readyState === 1;
  }

  async search(params: { userId: string; query: string }): Promise<SearchResult> {
    const q = params.query.trim();
    if (q.length < 2) return { users: [], conversations: [] };

    const safe = escapeRegex(q.replace(/^@/, ''));
    const rx = new RegExp(safe, 'i');

    const [users, conversations] = await Promise.all([
      // کاربران — به جز خود جستجوگر
      UserModel.find({
        _id: { $ne: new Types.ObjectId(params.userId) },
        $or: [{ username: rx }, { displayName: rx }],
      })
        .select('username displayName avatarUrl')
        .limit(RESULT_LIMIT),

      // گفتگوهای خود کاربر — عنوان گروه/کانال
      ConversationModel.find({
        participants: new Types.ObjectId(params.userId),
        title: rx,
      })
        .select('type title participants lastMessageId')
        .limit(RESULT_LIMIT),
    ]);

    // آخرین پیام گفتگوها در یک کوئری (الگوی Task 2.2 — بدون populate، LL-004 خانواده)
    const lastIds = conversations
      .map((c) => c.lastMessageId)
      .filter((id): id is Types.ObjectId => id != null);
    const lastDocs = await MessageModel.find({ _id: { $in: lastIds } });
    const lastById = new Map(lastDocs.map((m) => [String(m._id), toMessageDto(m)]));

    return {
      users: users.map((u) => ({
        userId: u.id as string,
        username: u.username ?? null,
        displayName: u.displayName || (u.username ? `@${u.username}` : 'کاربر فیستپ'),
        avatarUrl: u.avatarUrl ?? null,
      })),
      conversations: conversations.map((c) => ({
        _id: String(c._id),
        type: c.type,
        title: c.title ?? undefined,
        participants: c.participants.map(String),
        lastMessageContent: c.lastMessageId
          ? (lastById.get(String(c.lastMessageId))?.content ?? null)
          : null,
      })),
    };
  }
}
