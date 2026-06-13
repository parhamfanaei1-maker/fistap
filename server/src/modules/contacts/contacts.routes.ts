import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ContactsService, MATCH_BATCH_LIMIT } from './contacts.service.js';

const err = (code: string, message: string) => ({ ok: false as const, error: { code, message } });

const matchSchema = z.object({
  phones: z.array(z.string().max(32)).min(1).max(MATCH_BATCH_LIMIT),
});

/** REST مخاطبین — Task 4.1 (rate-limit: sync عملیات سنگین است) */
export async function contactsRoutes(app: FastifyInstance, opts: { contactsService: ContactsService }): Promise<void> {
  const { contactsService } = opts;

  app.post(
    '/contacts/match',
    { preHandler: [app.authenticate], config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } },
    async (request, reply) => {
      if (!contactsService.dbReady()) {
        return reply.code(503).send(err('DB_UNAVAILABLE', 'پایگاه داده در دسترس نیست'));
      }
      const body = matchSchema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send(err('INVALID_BODY', `حداکثر ${MATCH_BATCH_LIMIT} شماره در هر درخواست`));
      }
      const result = await contactsService.match({ requesterId: request.userId, phones: body.data.phones });
      return { ok: true, data: result };
    },
  );
}
