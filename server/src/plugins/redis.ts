import type { FastifyInstance } from 'fastify';
import { Redis } from 'ioredis';
import { env } from '../config/env.js';

declare module 'fastify' {
  interface FastifyInstance { redis: Redis }
}

/** Redis — سشن/OTP/Presence/RateLimit طبق system_architecture.md §2 */
export async function registerRedis(app: FastifyInstance): Promise<void> {
  const redis = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => Math.min(times * 500, 5000),
  });
  try {
    await redis.connect();
    app.log.info('✅ Redis connected');
  } catch (err) {
    if (env.NODE_ENV === 'development') {
      app.log.warn({ err }, '⚠️ Redis unavailable (dev mode: continuing without cache)');
    } else {
      throw err;
    }
  }
  app.decorate('redis', redis);
  app.addHook('onClose', async () => { redis.disconnect(); });
}
