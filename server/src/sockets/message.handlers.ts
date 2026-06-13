import mongoose from 'mongoose';
import type { MessageSendAck, MessageSendPayload } from '@fistap/shared';
import { SOCKET_EVENTS } from '@fistap/shared';
import type { MessageService } from '../modules/messages/message.service.js';
import type { PushService } from '../modules/push/push.service.js';
import { userRoom, type FistapIo } from './index.js';

const MESSAGE_TYPES = new Set(['text', 'image', 'video', 'audio', 'file']);

/** Task 2.3: خاموشی خودکار typing اگر کلاینت stop نفرستد (قطعی شبکه و...) */
const TYPING_AUTO_STOP_MS = 5000;

/** پیش‌نمایش اعلان بر اساس نوع پیام — Task 4.3 */
const pushPreview = (type: string, content: string): string =>
  type === 'text'
    ? content.length > 80
      ? `${content.slice(0, 80)}…`
      : content
    : ({ image: '🖼 تصویر', video: '🎬 ویدیو', audio: '🎵 پیام صوتی', file: '📎 فایل' }[type] ?? 'پیام جدید');

/**
 * هندلر message:send — Task 2.2
 * جریان (system_architecture.md §2): دریافت از سوکت → ذخیره Mongo → ack به فرستنده
 * → تحویل لحظه‌ای message:new به اتاق همه گیرنده‌ها (همه دستگاه‌های هر گیرنده)
 */
export function registerMessageHandlers(
  io: FistapIo,
  messageService: MessageService,
  pushService?: PushService,
): void {
  io.on('connection', (socket) => {
    socket.on(SOCKET_EVENTS.MESSAGE_SEND, async (payload: MessageSendPayload, ack) => {
      const reply = (res: MessageSendAck) => {
        if (typeof ack === 'function') ack(res);
      };
      const tempId = typeof payload?.tempId === 'string' ? payload.tempId : '';

      // اعتبارسنجی ورودی ناشناخته از شبکه (امنیت لایه ۴)
      if (
        !payload ||
        typeof payload.content !== 'string' ||
        !MESSAGE_TYPES.has(payload.type) ||
        !tempId
      ) {
        reply({ ok: false, tempId, error: { code: 'INVALID_PAYLOAD', message: 'بدنه پیام نامعتبر است' } });
        return;
      }
      if (mongoose.connection.readyState !== 1) {
        reply({ ok: false, tempId, error: { code: 'DB_UNAVAILABLE', message: 'پایگاه داده در دسترس نیست' } });
        return;
      }

      const outcome = await messageService.send({
        senderId: socket.data.userId,
        conversationId: payload.conversationId,
        recipientId: payload.recipientId,
        content: payload.content,
        type: payload.type,
        // ISS-001/002: فقط string معتبر pass می‌شود (ورودی ناشناخته شبکه)
        replyToId: typeof payload.replyToId === 'string' ? payload.replyToId : null,
        forwardedFromId: typeof payload.forwardedFromId === 'string' ? payload.forwardedFromId : null,
      });

      if (!outcome.ok) {
        reply({ ok: false, tempId, error: { code: outcome.code, message: outcome.reason } });
        return;
      }

      // ack موفق به فرستنده (جایگزینی پیام خوش‌بین tempId → پیام واقعی)
      reply({ ok: true, tempId, message: outcome.message });

      // تحویل به گیرنده‌ها + سایر دستگاه‌های خود فرستنده
      for (const recipientId of outcome.recipientIds) {
        io.to(userRoom(recipientId)).emit(SOCKET_EVENTS.MESSAGE_NEW, outcome.message);
      }
      socket.to(userRoom(socket.data.userId)).emit(SOCKET_EVENTS.MESSAGE_NEW, outcome.message);

      // Task 2.3 — Delivered (آنلاین) + Task 4.3 — Push (آفلاین)
      // جریان کامل system_architecture.md §2:
      // «ارسال سریع به گیرنده اگر آنلاین است؛ در غیر این صورت Push Notification»
      const conversationId = outcome.message.conversationId;
      for (const recipientId of outcome.recipientIds) {
        const online = (await io.in(userRoom(recipientId)).fetchSockets()).length > 0;

        if (!online) {
          // گیرنده آفلاین → Web Push (best-effort؛ خطا جریان پیام را نمی‌شکند)
          void pushService
            ?.sendToUser(recipientId, {
              title: 'پیام جدید در فیستپ',
              body: pushPreview(outcome.message.type, outcome.message.content),
              url: '/app/dashboard',
              tag: `conv-${conversationId}`, // اعلان‌های یک گفتگو جایگزین هم می‌شوند
            })
            .catch(() => undefined);
          continue;
        }

        const res = await messageService.markDelivered({ userId: recipientId, conversationId });
        if (res.ok) {
          for (const u of res.updated) {
            io.to(userRoom(u.senderId)).emit(SOCKET_EVENTS.MESSAGE_STATUS, {
              conversationId,
              messageId: u.messageId,
              status: 'delivered',
            });
          }
        }
      }
    });

    /** Task 2.3 — Read: کاربر گفتگو را تا پیام مشخص خواند → تیک آبی برای فرستنده‌ها */
    socket.on(SOCKET_EVENTS.MESSAGE_READ, async (payload) => {
      if (
        !payload ||
        typeof payload.conversationId !== 'string' ||
        typeof payload.messageId !== 'string' ||
        mongoose.connection.readyState !== 1
      ) {
        return;
      }
      const res = await messageService.markRead({
        userId: socket.data.userId,
        conversationId: payload.conversationId,
        upToMessageId: payload.messageId,
      });
      if (!res.ok) return;
      for (const u of res.updated) {
        io.to(userRoom(u.senderId)).emit(SOCKET_EVENTS.MESSAGE_STATUS, {
          conversationId: payload.conversationId,
          messageId: u.messageId,
          status: 'read',
        });
      }
    });

    // ---- Task 2.3 — Typing Indicator (بک‌اند UI-COMP-12) ----
    /** تایمرهای خاموشی خودکار per-conversation برای همین سوکت */
    const typingTimers = new Map<string, NodeJS.Timeout>();

    const broadcastTyping = async (conversationId: string, isTyping: boolean): Promise<void> => {
      if (typeof conversationId !== 'string' || mongoose.connection.readyState !== 1) return;
      // فقط اعضای گفتگو (امنیت: عضو نبودن = سکوت)
      if (!(await messageService.isMember(socket.data.userId, conversationId))) return;
      const others = await messageService.otherParticipants(socket.data.userId, conversationId);
      for (const userId of others) {
        io.to(userRoom(userId)).emit(SOCKET_EVENTS.TYPING_UPDATE, {
          conversationId,
          userId: socket.data.userId,
          isTyping,
        });
      }
    };

    socket.on(SOCKET_EVENTS.TYPING_START, async (payload) => {
      const conversationId = payload?.conversationId;
      await broadcastTyping(conversationId, true);
      // auto-stop ایمنی
      clearTimeout(typingTimers.get(conversationId));
      typingTimers.set(
        conversationId,
        setTimeout(() => {
          void broadcastTyping(conversationId, false);
          typingTimers.delete(conversationId);
        }, TYPING_AUTO_STOP_MS),
      );
    });

    socket.on(SOCKET_EVENTS.TYPING_STOP, async (payload) => {
      const conversationId = payload?.conversationId;
      clearTimeout(typingTimers.get(conversationId));
      typingTimers.delete(conversationId);
      await broadcastTyping(conversationId, false);
    });

    socket.on('disconnect', () => {
      // قطع اتصال وسط تایپ → خاموشی برای همه گفتگوها
      for (const [conversationId, timer] of typingTimers) {
        clearTimeout(timer);
        void broadcastTyping(conversationId, false);
      }
      typingTimers.clear();
    });
  });
}
