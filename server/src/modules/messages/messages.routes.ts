import type { FastifyInstance } from 'fastify';
import mongoose from 'mongoose';
import { z } from 'zod';
import type { MessageService } from './message.service.js';

const err = (code: string, message: string) => ({ ok: false as const, error: { code, message } });

const historyQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  before: z.string().datetime().optional(),
});

/** REST پیام‌ها — Task 2.2: تاریخچه (صفحه‌بندی cursor) + لیست گفتگوها برای Sidebar */
export async function messagesRoutes(app: FastifyInstance, opts: { messageService: MessageService }): Promise<void> {
  const { messageService } = opts;

  app.get('/conversations', { preHandler: [app.authenticate] }, async (request, reply) => {
    if (mongoose.connection.readyState !== 1) {
      return reply.code(503).send(err('DB_UNAVAILABLE', 'پایگاه داده در دسترس نیست'));
    }
    const conversations = await messageService.listConversations(request.userId);
    return { ok: true, data: { conversations } };
  });

  app.get<{ Params: { id: string } }>(
    '/conversations/:id/messages',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      if (mongoose.connection.readyState !== 1) {
        return reply.code(503).send(err('DB_UNAVAILABLE', 'پایگاه داده در دسترس نیست'));
      }
      const query = historyQuerySchema.safeParse(request.query);
      if (!query.success) return reply.code(400).send(err('INVALID_QUERY', 'پارامترهای صفحه‌بندی نامعتبر است'));

      const result = await messageService.history({
        userId: request.userId,
        conversationId: request.params.id,
        limit: query.data.limit,
        before: query.data.before,
      });
      if (!result.ok) {
        const status = result.code === 'NOT_A_MEMBER' ? 403 : result.code === 'CONVERSATION_NOT_FOUND' ? 404 : 400;
        return reply.code(status).send(err(result.code, 'دسترسی به این گفتگو ممکن نیست'));
      }
      return { ok: true, data: { messages: result.messages } };
    },
  );
}
