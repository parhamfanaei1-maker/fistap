import { Types } from 'mongoose';
import { ConversationModel } from '../../models/Conversation.js';

export type GroupRole = 'owner' | 'admin' | 'member';

export interface CreateGroupInput {
  creatorId: string;
  type: 'group' | 'channel';
  title: string;
  memberIds: string[];
}

type Fail = { ok: false; code: string };

const fail = (code: string): Fail => ({ ok: false, code });
const oid = (s: string) => new Types.ObjectId(s);

export interface ConversationDto {
  _id: string;
  type: string;
  title?: string;
  participants: string[];
  ownerId: string | null;
  admins: string[];
  avatarUrl: string | null;
  createdAt: string;
  /** Task 3.4 */
  pinnedMessageId: string | null;
}

function toDto(c: {
  _id: Types.ObjectId;
  type: string;
  title?: string | null;
  participants: Types.ObjectId[];
  ownerId?: Types.ObjectId | null;
  admins?: Types.ObjectId[];
  avatarUrl?: string | null;
  createdAt?: Date;
  pinnedMessageId?: Types.ObjectId | null;
}): ConversationDto {
  return {
    _id: String(c._id),
    type: c.type,
    title: c.title ?? undefined,
    participants: c.participants.map(String),
    ownerId: c.ownerId ? String(c.ownerId) : null,
    admins: (c.admins ?? []).map(String),
    avatarUrl: c.avatarUrl ?? null,
    createdAt: c.createdAt?.toISOString() ?? new Date(0).toISOString(),
    pinnedMessageId: c.pinnedMessageId ? String(c.pinnedMessageId) : null,
  };
}

/**
 * سرویس گروه/کانال — Task 3.1 (user_roles.md + use case ۲)
 * سلسله نقش‌ها: owner > admin > member · سازنده = owner و admin
 */
export class ConversationService {
  /** نقش کاربر در گفتگو — مبنای همه مجوزها */
  roleOf(conv: { ownerId?: Types.ObjectId | null; admins?: Types.ObjectId[]; participants: Types.ObjectId[] }, userId: string): GroupRole | null {
    if (conv.ownerId && String(conv.ownerId) === userId) return 'owner';
    if ((conv.admins ?? []).some((a) => String(a) === userId)) return 'admin';
    if (conv.participants.some((p) => String(p) === userId)) return 'member';
    return null;
  }

  async create(input: CreateGroupInput): Promise<{ ok: true; conversation: ConversationDto } | Fail> {
    const title = input.title.trim();
    if (title.length < 1 || title.length > 64) return fail('INVALID_TITLE');
    if (input.type !== 'group' && input.type !== 'channel') return fail('INVALID_TYPE');

    const memberIds = [...new Set(input.memberIds.filter((id) => Types.ObjectId.isValid(id) && id !== input.creatorId))];
    if (input.memberIds.some((id) => !Types.ObjectId.isValid(id))) return fail('INVALID_MEMBER');
    if (memberIds.length > 200) return fail('TOO_MANY_MEMBERS');

    const conv = await ConversationModel.create({
      type: input.type,
      title,
      participants: [oid(input.creatorId), ...memberIds.map(oid)],
      ownerId: oid(input.creatorId),
      admins: [oid(input.creatorId)],
    });
    return { ok: true, conversation: toDto(conv) };
  }

  /** افزودن عضو — فقط admin/owner (user_roles.md §2: «مدیریت اعضا») */
  async addMembers(params: { actorId: string; conversationId: string; memberIds: string[] }): Promise<{ ok: true; conversation: ConversationDto } | Fail> {
    const conv = await this.loadGroup(params.conversationId);
    if (!conv) return fail('CONVERSATION_NOT_FOUND');
    const role = this.roleOf(conv, params.actorId);
    if (role !== 'owner' && role !== 'admin') return fail('FORBIDDEN');

    const valid = params.memberIds.filter((id) => Types.ObjectId.isValid(id));
    if (valid.length !== params.memberIds.length) return fail('INVALID_MEMBER');
    const existing = new Set(conv.participants.map(String));
    const toAdd = [...new Set(valid)].filter((id) => !existing.has(id));
    if (conv.participants.length + toAdd.length > 200) return fail('TOO_MANY_MEMBERS');

    conv.participants.push(...toAdd.map(oid));
    await conv.save();
    return { ok: true, conversation: toDto(conv) };
  }

  /** حذف عضو — admin/owner؛ admin نمی‌تواند admin/owner را حذف کند؛ owner حذف‌نشدنی */
  async removeMember(params: { actorId: string; conversationId: string; memberId: string }): Promise<{ ok: true; conversation: ConversationDto } | Fail> {
    const conv = await this.loadGroup(params.conversationId);
    if (!conv) return fail('CONVERSATION_NOT_FOUND');
    const actorRole = this.roleOf(conv, params.actorId);
    const targetRole = this.roleOf(conv, params.memberId);
    if (!targetRole) return fail('NOT_A_MEMBER');

    const selfLeave = params.actorId === params.memberId;
    if (targetRole === 'owner') return fail('CANNOT_REMOVE_OWNER');
    if (!selfLeave) {
      if (actorRole !== 'owner' && actorRole !== 'admin') return fail('FORBIDDEN');
      if (targetRole === 'admin' && actorRole !== 'owner') return fail('FORBIDDEN');
    }

    conv.participants = conv.participants.filter((p) => String(p) !== params.memberId);
    conv.admins = (conv.admins ?? []).filter((a) => String(a) !== params.memberId);
    await conv.save();
    return { ok: true, conversation: toDto(conv) };
  }

  /** انتصاب/عزل ادمین — فقط owner (use case ۲: «یکی از اعضا را ادمین منصوب می‌کند») */
  async setAdmin(params: { actorId: string; conversationId: string; memberId: string; isAdmin: boolean }): Promise<{ ok: true; conversation: ConversationDto } | Fail> {
    const conv = await this.loadGroup(params.conversationId);
    if (!conv) return fail('CONVERSATION_NOT_FOUND');
    if (this.roleOf(conv, params.actorId) !== 'owner') return fail('FORBIDDEN');
    const targetRole = this.roleOf(conv, params.memberId);
    if (!targetRole) return fail('NOT_A_MEMBER');
    if (targetRole === 'owner') return fail('CANNOT_CHANGE_OWNER');

    const isCurrentlyAdmin = (conv.admins ?? []).some((a) => String(a) === params.memberId);
    if (params.isAdmin && !isCurrentlyAdmin) conv.admins.push(oid(params.memberId));
    if (!params.isAdmin && isCurrentlyAdmin) conv.admins = conv.admins.filter((a) => String(a) !== params.memberId);
    await conv.save();
    return { ok: true, conversation: toDto(conv) };
  }

  /** قاعده کانال: فقط owner/admin پیام می‌فرستد (FEAT-02 / user_roles.md §2) */
  async canSendMessage(userId: string, conversationId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(conversationId)) return false;
    const conv = await ConversationModel.findById(conversationId).select('type participants ownerId admins');
    if (!conv) return false;
    const role = this.roleOf(conv, userId);
    if (!role) return false;
    if (conv.type === 'channel') return role === 'owner' || role === 'admin';
    return true;
  }

  /** تغییر اطلاعات گروه/کانال (نام) — admin/owner */
  async updateInfo(params: { actorId: string; conversationId: string; title: string }): Promise<{ ok: true; conversation: ConversationDto } | Fail> {
    const conv = await this.loadGroup(params.conversationId);
    if (!conv) return fail('CONVERSATION_NOT_FOUND');
    const role = this.roleOf(conv, params.actorId);
    if (role !== 'owner' && role !== 'admin') return fail('FORBIDDEN');
    const title = params.title.trim();
    if (title.length < 1 || title.length > 64) return fail('INVALID_TITLE');
    conv.title = title;
    await conv.save();
    return { ok: true, conversation: toDto(conv) };
  }

  /**
   * پین/آن‌پین پیام — Task 3.4 (FEAT-02: pinnedMessageId per conversation)
   * مجوز: گفتگوی خصوصی = هر دو طرف · گروه/کانال = فقط admin/owner (user_roles.md §2)
   * messageId=null → برداشتن پین
   */
  async setPinned(params: {
    actorId: string;
    conversationId: string;
    messageId: string | null;
  }): Promise<{ ok: true; conversation: ConversationDto; participants: string[] } | Fail> {
    if (!Types.ObjectId.isValid(params.conversationId)) return fail('CONVERSATION_NOT_FOUND');
    const conv = await ConversationModel.findById(params.conversationId);
    if (!conv) return fail('CONVERSATION_NOT_FOUND');

    const role = this.roleOf(conv, params.actorId);
    if (!role) return fail('NOT_A_MEMBER');
    if (conv.type !== 'private' && role === 'member') return fail('FORBIDDEN');

    if (params.messageId !== null) {
      if (!Types.ObjectId.isValid(params.messageId)) return fail('MESSAGE_NOT_FOUND');
      // پیام باید متعلق به همین گفتگو باشد (ضد پین کردن پیام گفتگوی دیگر)
      const { MessageModel } = await import('../../models/Message.js');
      const msg = await MessageModel.findOne({ _id: params.messageId, conversationId: conv._id });
      if (!msg) return fail('MESSAGE_NOT_FOUND');
      conv.pinnedMessageId = msg._id;
    } else {
      conv.pinnedMessageId = null;
    }
    await conv.save();
    return { ok: true, conversation: toDto(conv), participants: conv.participants.map(String) };
  }

  /** دریافت یک گفتگو — فقط اعضا (Task 3.2: تغذیه صفحه group-settings) */
  async getById(params: { userId: string; conversationId: string }): Promise<{ ok: true; conversation: ConversationDto } | Fail> {
    if (!Types.ObjectId.isValid(params.conversationId)) return fail('CONVERSATION_NOT_FOUND');
    const conv = await ConversationModel.findById(params.conversationId);
    if (!conv) return fail('CONVERSATION_NOT_FOUND');
    if (!this.roleOf(conv, params.userId)) return fail('NOT_A_MEMBER');
    return { ok: true, conversation: toDto(conv) };
  }

  private async loadGroup(conversationId: string) {
    if (!Types.ObjectId.isValid(conversationId)) return null;
    const conv = await ConversationModel.findById(conversationId);
    if (!conv || conv.type === 'private') return null;
    return conv;
  }
}
