import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { PushService } from './push.service.js';

const err = (code: string, message: string) => ({ ok: false as const, error: { code, message } });

const subscribeSchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({ p256dh: z.string().min(10).max(300), auth: z.string().min(10).max(100) }),
});

const unsubscribeSchema = z.object({ endpoint: z.string().url().max(1000) });

/** REST Push — Task 4.3 (page_capabilities §3: Notification Toggle) */
export async function pushRoutes(app: FastifyInstance, opts: { pushService: PushService }): Promise<void> {
  const { pushService } = opts;

  /** کلید عمومی VAPID برای PushManager.subscribe کلاینت */
  app.get('/push/vapid-public-key', { preHandler: [app.authenticate] }, async () => ({
    ok: true,
    data: { publicKey: pushService.publicKey, enabled: pushService.isEnabled() },
  }));

  app.post('/push/subscribe', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = subscribeSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send(err('INVALID_BODY', 'اشتراک نامعتبر است'));
    const ok = await pushService.subscribe(request.userId, body.data);
    if (!ok) return reply.code(503).send(err('PUSH_UNAVAILABLE', 'سرویس اعلان در دسترس نیست'));
    return { ok: true, data: { subscribed: true } };
  });

  app.post('/push/unsubscribe', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = unsubscribeSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send(err('INVALID_BODY', 'ورودی نامعتبر است'));
    await pushService.unsubscribe(request.userId, body.data.endpoint);
    return { ok: true, data: { subscribed: false } };
  });

  app.get('/push/status', { preHandler: [app.authenticate] }, async (request) => ({
    ok: true,
    data: { subscribed: await pushService.hasSubscription(request.userId) },
  }));
}
