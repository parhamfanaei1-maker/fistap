import type { FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import { env } from '../config/env.js';

/** JWT اسکلت — منطق کامل سشن در Task 1.4 پیاده می‌شود */
export async function registerJwt(app: FastifyInstance): Promise<void> {
  await app.register(fastifyJwt, {
    secret: env.JWT_ACCESS_SECRET,
    sign: { expiresIn: env.JWT_ACCESS_TTL },
  });
}
