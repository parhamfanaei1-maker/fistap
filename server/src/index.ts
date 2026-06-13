import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';
import { registerMongo } from './plugins/mongo.js';
import { registerRedis } from './plugins/redis.js';
import { registerJwt } from './plugins/jwt.js';
import { registerAuthGuard } from './plugins/authGuard.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { messagesRoutes } from './modules/messages/messages.routes.js';
import { MessageService } from './modules/messages/message.service.js';
import { conversationsRoutes, type PinNotifier } from './modules/conversations/conversations.routes.js';
import { ConversationService } from './modules/conversations/conversation.service.js';
import { mediaRoutes } from './modules/media/media.routes.js';
import { MediaService } from './modules/media/media.service.js';
import { contactsRoutes } from './modules/contacts/contacts.routes.js';
import { ContactsService } from './modules/contacts/contacts.service.js';
import { pushRoutes } from './modules/push/push.routes.js';
import { PushService } from './modules/push/push.service.js';
import { searchRoutes } from './modules/search/search.routes.js';
import { SearchService } from './modules/search/search.service.js';
import { registerMessageHandlers } from './sockets/message.handlers.js';
import { createSocketServer } from './sockets/index.js';
import { MemoryPresenceService, RedisPresenceService } from './sockets/presence.service.js';

/** Bootstrap — Fastify (REST) + Socket.io (Real-time) روی یک سرور HTTP */
async function main(): Promise<void> {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      // ISS-005: داده‌های حساس هرگز در لاگ ثبت نشوند
      redact: {
        paths: [
          'req.headers.authorization',
          'req.body.refreshToken',
          'req.body.code',
          'req.body.phone',
        ],
        censor: '[REDACTED]',
      },
    },
  });

  await app.register(helmet);
  await app.register(cors, { origin: env.CORS_ORIGIN, credentials: true });
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

  await registerMongo(app);
  await registerRedis(app);
  await registerJwt(app);
  registerAuthGuard(app);

  app.get('/health', async () => ({
    ok: true,
    data: { service: 'fistap-server', version: '0.1.0', uptime: process.uptime() },
  }));

  const messageService = new MessageService();
  const conversationService = new ConversationService(); // Task 3.1
  const mediaService = new MediaService(); // Task 3.3 (D-2: S3/MinIO)
  const pinNotifier: PinNotifier = {}; // Task 3.4 — بعد از ساخت io پر می‌شود

  await app.register(authRoutes, { prefix: '/api/v1' });
  await app.register(usersRoutes, { prefix: '/api/v1' });
  await app.register(messagesRoutes, { prefix: '/api/v1', messageService });
  await app.register(conversationsRoutes, { prefix: '/api/v1', conversationService, pinNotifier });
  await app.register(mediaRoutes, { prefix: '/api/v1', mediaService });
  await app.register(contactsRoutes, { prefix: '/api/v1', contactsService: new ContactsService() }); // Task 4.1
  const pushService = new PushService({
    info: (m) => app.log.info(m),
    warn: (m) => app.log.warn(m),
  }); // Task 4.3
  await app.register(pushRoutes, { prefix: '/api/v1', pushService });
  await app.register(searchRoutes, { prefix: '/api/v1', searchService: new SearchService() }); // Task 4.4

  await app.ready();

  // Task 2.1: Socket.io با احراز JWT + Presence (Redis یا فالبک dev — الگوی Task 1.2/1.4)
  const presence =
    app.redis.status === 'ready'
      ? new RedisPresenceService(app.redis)
      : new MemoryPresenceService();
  if (app.redis.status !== 'ready') {
    app.log.warn('⚠️ Presence: using in-memory fallback (dev only — not for production)');
  }
  const io = createSocketServer(app.server, {
    verifier: { verify: (token) => app.jwt.verify<{ sub: string }>(token) },
    presence,
    log: {
      info: (msg) => app.log.info(msg),
      warn: (msg) => app.log.warn(msg),
    },
  });
  registerMessageHandlers(io, messageService, pushService); // Task 2.2 + 4.3 (push برای آفلاین)

  // Task 3.4: اتصال PinNotifier به io — رویداد به اتاق همه اعضا
  pinNotifier.notify = ({ conversationId, participants, pinnedMessage, pinnedBy }) => {
    for (const userId of participants) {
      io.to(`user:${userId}`).emit('conversation:pin', { conversationId, pinnedMessage, pinnedBy });
    }
  };

  await app.listen({ port: env.PORT, host: env.HOST });
  app.log.info(`🚀 Fistap server on http://${env.HOST}:${env.PORT}`);
}

main().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
