import type { FastifyInstance } from 'fastify';
import mongoose from 'mongoose';
import { z } from 'zod';
import type { Message } from '@fistap/shared';
import type { ConversationService } from './conversation.service.js';

/** Task 3.4: امیتر لحظه‌ای پین — bootstrap بعد از ساخت io آن را پر می‌کند (lazy ref) */
export interface PinNotifier {
  notify?: (params: {
    conversationId: string;
    participants: string[];
    pinnedMessage: Message | null;
    pinnedBy: string;
  }) => void;
}

const err = (code: string, message: string) => ({ ok: false as const, error: { code, message } });

/** نگاشت کد سرویس → HTTP status */
const STATUS_MAP: Record<string, number> = {
  CONVERSATION_NOT_FOUND: 404,
  NOT_A_MEMBER: 404,
  FORBIDDEN: 403,
  CANNOT_REMOVE_OWNER: 403,
  CANNOT_CHANGE_OWNER: 403,
  INVALID_TITLE: 400,
  INVALID_TYPE: 400,
  INVALID_MEMBER: 400,
  TOO_MANY_MEMBERS: 400,
};

const createSchema = z.object({
  type: z.enum(['group', 'channel']),
  title: z.string().min(1).max(64),
  memberIds: z.array(z.string()).max(200).default([]),
});

const membersSchema = z.object({ memberIds: z.array(z.string()).min(1).max(200) });
const adminSchema = z.object({ isAdmin: z.boolean() });
const infoSchema = z.object({ title: z.string().min(1).max(64) });
const pinSchema = z.object({ messageId: z.string().nullable() });

/** REST گروه/کانال — Task 3.1 (همه با authenticate · پیام فارسی برای کاربر) */
export async function conversationsRoutes(
  app: FastifyInstance,
  opts: { conversationService: ConversationService; pinNotifier?: PinNotifier },
): Promise<void> {
  const svc = opts.conversationService;
  const pinNotifier = opts.pinNotifier;

  const guardDb = (reply: { code: (n: number) => { send: (b: unknown) => unknown } }) => {
    if (mongoose.connection.readyState !== 1) {
      reply.code(503).send(err('DB_UNAVAILABLE', 'پایگاه داده در دسترس نیست'));
      return false;
    }
    return true;
  };

  /** ساخت گروه/کانال */
  app.post('/conversations', { preHandler: [app.authenticate] }, async (request, reply) => {
    if (!guardDb(reply)) return;
    const body = createSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send(err('INVALID_BODY', 'ورودی نامعتبر است'));
    const res = await svc.create({ creatorId: request.userId, ...body.data });
    if (!res.ok) return reply.code(STATUS_MAP[res.code] ?? 400).send(err(res.code, 'ساخت گفتگو ممکن نیست'));
    return { ok: true, data: { conversation: res.conversation } };
  });

  /** دریافت یک گفتگو — اعضا فقط (Task 3.2) */
  app.get<{ Params: { id: string } }>(
    '/conversations/:id',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      if (!guardDb(reply)) return;
      const res = await svc.getById({ userId: request.userId, conversationId: request.params.id });
      if (!res.ok) return reply.code(STATUS_MAP[res.code] ?? 400).send(err(res.code, 'گفتگو یافت نشد'));
      return { ok: true, data: { conversation: res.conversation } };
    },
  );

  /** افزودن اعضا */
  app.post<{ Params: { id: string } }>(
    '/conversations/:id/members',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      if (!guardDb(reply)) return;
      const body = membersSchema.safeParse(request.body);
      if (!body.success) return reply.code(400).send(err('INVALID_BODY', 'ورودی نامعتبر است'));
      const res = await svc.addMembers({
        actorId: request.userId,
        conversationId: request.params.id,
        memberIds: body.data.memberIds,
      });
      if (!res.ok) return reply.code(STATUS_MAP[res.code] ?? 400).send(err(res.code, 'افزودن عضو ممکن نیست'));
      return { ok: true, data: { conversation: res.conversation } };
    },
  );

  /** حذف عضو / خروج خود */
  app.delete<{ Params: { id: string; memberId: string } }>(
    '/conversations/:id/members/:memberId',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      if (!guardDb(reply)) return;
      const res = await svc.removeMember({
        actorId: request.userId,
        conversationId: request.params.id,
        memberId: request.params.memberId,
      });
      if (!res.ok) return reply.code(STATUS_MAP[res.code] ?? 400).send(err(res.code, 'حذف عضو ممکن نیست'));
      return { ok: true, data: { conversation: res.conversation } };
    },
  );

  /** انتصاب/عزل ادمین — فقط owner */
  app.patch<{ Params: { id: string; memberId: string } }>(
    '/conversations/:id/admins/:memberId',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      if (!guardDb(reply)) return;
      const body = adminSchema.safeParse(request.body);
      if (!body.success) return reply.code(400).send(err('INVALID_BODY', 'ورودی نامعتبر است'));
      const res = await svc.setAdmin({
        actorId: request.userId,
        conversationId: request.params.id,
        memberId: request.params.memberId,
        isAdmin: body.data.isAdmin,
      });
      if (!res.ok) return reply.code(STATUS_MAP[res.code] ?? 400).send(err(res.code, 'تغییر نقش ممکن نیست'));
      return { ok: true, data: { conversation: res.conversation } };
    },
  );

  /** پین/آن‌پین پیام — Task 3.4 (FEAT-02 / UI-PIN) */
  app.patch<{ Params: { id: string } }>(
    '/conversations/:id/pin',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      if (!guardDb(reply)) return;
      const body = pinSchema.safeParse(request.body);
      if (!body.success) return reply.code(400).send(err('INVALID_BODY', 'ورودی نامعتبر است'));

      const res = await svc.setPinned({
        actorId: request.userId,
        conversationId: request.params.id,
        messageId: body.data.messageId,
      });
      if (!res.ok) {
        const map: Record<string, number> = { ...STATUS_MAP, MESSAGE_NOT_FOUND: 404 };
        return reply.code(map[res.code] ?? 400).send(err(res.code, 'پین کردن ممکن نیست'));
      }

      // پیام کامل برای نوار پین + رویداد لحظه‌ای
      let pinnedMessage = null;
      if (res.conversation.pinnedMessageId) {
        const { MessageModel } = await import('../../models/Message.js');
        const { toMessageDto } = await import('../messages/message.service.js');
        const doc = await MessageModel.findById(res.conversation.pinnedMessageId);
        if (doc) pinnedMessage = toMessageDto(doc);
      }
      pinNotifier?.notify?.({
        conversationId: res.conversation._id,
        participants: res.participants,
        pinnedMessage,
        pinnedBy: request.userId,
      });
      return { ok: true, data: { conversation: res.conversation, pinnedMessage } };
    },
  );

  /** تغییر اطلاعات (نام) — admin/owner */
  app.patch<{ Params: { id: string } }>(
    '/conversations/:id',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      if (!guardDb(reply)) return;
      const body = infoSchema.safeParse(request.body);
      if (!body.success) return reply.code(400).send(err('INVALID_BODY', 'ورودی نامعتبر است'));
      const res = await svc.updateInfo({
        actorId: request.userId,
        conversationId: request.params.id,
        title: body.data.title,
      });
      if (!res.ok) return reply.code(STATUS_MAP[res.code] ?? 400).send(err(res.code, 'ویرایش ممکن نیست'));
      return { ok: true, data: { conversation: res.conversation } };
    },
  );
}
