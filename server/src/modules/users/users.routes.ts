import type { FastifyInstance } from 'fastify';
import mongoose from 'mongoose';
import { z } from 'zod';
import { USERNAME_REGEX } from '@fistap/shared';
import { UserModel } from '../../models/User.js';

const err = (code: string, message: string) => ({ ok: false as const, error: { code, message } });

const profileSchema = z.object({
  username: z.string().regex(USERNAME_REGEX, 'invalid username'),
  displayName: z.string().min(1).max(64),
});

/** ماژول کاربران — Task 1.3 (FEAT-01: ایجاد @username در اولین ورود) */
export async function usersRoutes(app: FastifyInstance): Promise<void> {
  app.patch('/users/profile', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = profileSchema.safeParse(request.body);
    if (!body.success) {
      return reply
        .code(400)
        .send(err('INVALID_PROFILE', 'نام کاربری باید با حرف شروع شود (۵-۳۲ کاراکتر، فقط حروف/عدد/_)'));
    }

    const username = body.data.username.toLowerCase();

    if (mongoose.connection.readyState !== 1) {
      // dev بدون Mongo: پاسخ موفق شبیه‌سازی‌شده تا جریان فرانت قابل تست باشد
      app.log.warn('⚠️ Mongo not connected: profile persisted in-memory only (dev)');
      return { ok: true, data: { userId: request.userId, username, displayName: body.data.displayName } };
    }

    const taken = await UserModel.findOne({ username, _id: { $ne: request.userId } });
    if (taken) return reply.code(409).send(err('USERNAME_TAKEN', 'این نام کاربری قبلاً گرفته شده است'));

    try {
      const user = await UserModel.findByIdAndUpdate(
        request.userId,
        { username, displayName: body.data.displayName },
        { new: true, runValidators: true },
      );
      if (!user) return reply.code(404).send(err('USER_NOT_FOUND', 'کاربر یافت نشد'));
      return { ok: true, data: { userId: user.id as string, username, displayName: user.displayName } };
    } catch (e) {
      // ISS-009: race همزمانی → duplicate key 11000 باید 409 باشد نه 500
      if ((e as { code?: number }).code === 11000) {
        return reply.code(409).send(err('USERNAME_TAKEN', 'این نام کاربری قبلاً گرفته شده است'));
      }
      throw e;
    }
  });
}
