import type { FastifyInstance } from 'fastify';
import mongoose from 'mongoose';
import { env } from '../../config/env.js';
import { createSmsGateway } from '../../gateways/sms/index.js';
import { UserModel } from '../../models/User.js';
import { requestOtpSchema, verifyOtpSchema, refreshSchema } from './auth.schemas.js';
import { normalizePhone } from './phone.util.js';
import { OtpService } from './otp.service.js';
import { MemoryOtpStore, RedisOtpStore, type OtpStore } from './otp.store.js';
import { SessionService } from './session.service.js';
import { MemorySessionStore, RedisSessionStore, type SessionStore } from './session.store.js';
import { ttlToSeconds } from './ttl.util.js';

/** پاسخ خطای یکنواخت — قرارداد ApiResponse در @fistap/shared */
const err = (code: string, message: string) => ({ ok: false as const, error: { code, message } });

/**
 * مسیرهای احراز هویت — Task 1.2 (FEAT-01, acceptance_criteria.md §1)
 * صدور توکن JWT در Task 1.4 تکمیل می‌شود (قانون گیت).
 */
export async function authRoutes(app: FastifyInstance): Promise<void> {
  // انتخاب مخزن: Redis اگر متصل است، وگرنه فالبک حافظه (فقط dev)
  const store: OtpStore =
    app.redis.status === 'ready' ? new RedisOtpStore(app.redis) : new MemoryOtpStore();
  if (app.redis.status !== 'ready') {
    app.log.warn('⚠️ OTP store: using in-memory fallback (dev only — not for production)');
  }

  const otpService = new OtpService(store, createSmsGateway(), {
    ttlSeconds: env.OTP_TTL_SECONDS,
    maxAttempts: env.OTP_MAX_ATTEMPTS,
    resendCooldownSeconds: 60,
  });

  // Task 1.4: سرویس سشن — Refresh در Redis (فالبک حافظه فقط dev، الگوی Task 1.2)
  const sessionStore: SessionStore =
    app.redis.status === 'ready' ? new RedisSessionStore(app.redis) : new MemorySessionStore();
  const sessionService = new SessionService(
    sessionStore,
    { sign: (payload) => app.jwt.sign(payload) },
    { refreshTtlSeconds: ttlToSeconds(env.JWT_REFRESH_TTL) },
  );

  /** درخواست کد — Rate-Limit سخت‌گیرانه‌تر علیه اسپم پیامک */
  app.post(
    '/auth/otp/request',
    { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } },
    async (request, reply) => {
      const body = requestOtpSchema.safeParse(request.body);
      if (!body.success) return reply.code(400).send(err('INVALID_BODY', 'شماره تلفن نامعتبر است'));

      const phone = normalizePhone(body.data.phone);
      if (!phone) return reply.code(400).send(err('INVALID_PHONE', 'فرمت شماره تلفن صحیح نیست'));

      const outcome = await otpService.requestOtp(phone);
      if (outcome.status === 'cooldown') {
        return reply
          .code(429)
          .send(err('OTP_COOLDOWN', `لطفاً ${outcome.retryAfterSeconds} ثانیه دیگر تلاش کنید`));
      }
      return { ok: true, data: { phone, ttlSeconds: outcome.ttlSeconds } };
    },
  );

  /** تأیید کد — در موفقیت: upsert کاربر + isNewUser (توکن‌ها در Task 1.4) */
  app.post(
    '/auth/otp/verify',
    { config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } },
    async (request, reply) => {
      const body = verifyOtpSchema.safeParse(request.body);
      if (!body.success) return reply.code(400).send(err('INVALID_BODY', 'ورودی نامعتبر است'));

      const phone = normalizePhone(body.data.phone);
      if (!phone) return reply.code(400).send(err('INVALID_PHONE', 'فرمت شماره تلفن صحیح نیست'));

      const outcome = await otpService.verifyOtp(phone, body.data.code);
      switch (outcome.status) {
        case 'expired':
          return reply.code(410).send(err('OTP_EXPIRED', 'کد منقضی شده؛ دوباره درخواست دهید'));
        case 'locked':
          return reply.code(423).send(err('OTP_LOCKED', 'تلاش بیش از حد؛ کد جدید درخواست دهید'));
        case 'invalid':
          return reply
            .code(401)
            .send(err('OTP_INVALID', `کد اشتباه است (${outcome.attemptsLeft} تلاش باقی‌مانده)`));
        case 'verified': {
          // upsert کاربر طبق database_schema.md §1
          let userId = `dev-${phone.replace('+', '')}`; // شناسه پایدار در dev بدون Mongo
          let isNewUser = true;
          if (mongoose.connection.readyState === 1) {
            const existing = await UserModel.findOne({ phone });
            if (existing) {
              isNewUser = !existing.username; // پروفایل ناقص = هنوز «جدید»
              userId = existing.id as string;
            } else {
              const created = await UserModel.create({ phone });
              userId = created.id as string;
            }
          } else {
            app.log.warn('⚠️ Mongo not connected: user upsert skipped (dev only)');
          }
          // Task 1.4: صدور توکن‌ها — تکمیل acceptance_criteria.md §1
          const tokens = await sessionService.issueTokens(userId);
          return { ok: true, data: { verified: true, userId, isNewUser, tokens } };
        }
      }
    },
  );

  /** تمدید سشن با چرخش توکن — Task 1.4 */
  app.post(
    '/auth/refresh',
    { config: { rateLimit: { max: 30, timeWindow: '15 minutes' } } },
    async (request, reply) => {
      const body = refreshSchema.safeParse(request.body);
      if (!body.success) return reply.code(400).send(err('INVALID_BODY', 'ورودی نامعتبر است'));

      const outcome = await sessionService.refresh(body.data.refreshToken);
      if (outcome.status === 'invalid') {
        return reply
          .code(401)
          .send(err('REFRESH_INVALID', 'سشن نامعتبر یا منقضی است؛ دوباره وارد شوید'));
      }
      return { ok: true, data: { tokens: outcome.tokens } };
    },
  );

  /** خروج — ابطال Refresh Token (ISS-006: rate-limit) */
  app.post('/auth/logout', { config: { rateLimit: { max: 30, timeWindow: '15 minutes' } } }, async (request, reply) => {
    const body = refreshSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send(err('INVALID_BODY', 'ورودی نامعتبر است'));
    await sessionService.revoke(body.data.refreshToken);
    return { ok: true, data: { loggedOut: true } };
  });

  /** نمونه مسیر محافظت‌شده — هویت کاربر جاری (پایه‌ی پروفایل در Task 1.3) */
  app.get('/auth/me', { preHandler: [app.authenticate] }, async (request) => {
    if (mongoose.connection.readyState === 1) {
      const user = await UserModel.findById(request.userId).lean();
      if (user) {
        return {
          ok: true,
          data: {
            userId: request.userId,
            phone: user.phone,
            username: user.username ?? null,
            displayName: user.displayName ?? '',
          },
        };
      }
    }
    return { ok: true, data: { userId: request.userId, phone: null, username: null, displayName: '' } };
  });
}
