import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import { OTP_LENGTH } from '@fistap/shared';
import type { OtpStore } from './otp.store.js';
import type { SmsGateway } from '../../gateways/sms/index.js';

export interface OtpConfig {
  ttlSeconds: number;       // OTP_TTL_SECONDS=120
  maxAttempts: number;      // OTP_MAX_ATTEMPTS=5
  resendCooldownSeconds: number; // جلوگیری از اسپم پیامک
}

export type RequestOtpOutcome =
  | { status: 'sent'; ttlSeconds: number }
  | { status: 'cooldown'; retryAfterSeconds: number };

export type VerifyOtpOutcome =
  | { status: 'verified' }
  | { status: 'invalid'; attemptsLeft: number }
  | { status: 'expired' }
  | { status: 'locked' };

const hashCode = (code: string): string => createHash('sha256').update(code).digest('hex');

/** سرویس OTP — FEAT-01 / acceptance_criteria.md §1 (کد خام هرگز ذخیره نمی‌شود؛ فقط هش) */
export class OtpService {
  constructor(
    private readonly store: OtpStore,
    private readonly sms: SmsGateway,
    private readonly config: OtpConfig,
  ) {}

  async requestOtp(phone: string): Promise<RequestOtpOutcome> {
    const remaining = await this.store.ttl(phone);
    const elapsed = this.config.ttlSeconds - remaining;
    if (remaining > 0 && elapsed < this.config.resendCooldownSeconds) {
      return { status: 'cooldown', retryAfterSeconds: this.config.resendCooldownSeconds - elapsed };
    }

    const code = String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, '0');
    await this.store.set(
      phone,
      { codeHash: hashCode(code), attempts: 0, createdAt: Date.now() },
      this.config.ttlSeconds,
    );
    await this.sms.sendOtp(phone, code);
    return { status: 'sent', ttlSeconds: this.config.ttlSeconds };
  }

  async verifyOtp(phone: string, code: string): Promise<VerifyOtpOutcome> {
    const record = await this.store.get(phone);
    if (!record) return { status: 'expired' };

    if (record.attempts >= this.config.maxAttempts) {
      await this.store.delete(phone);
      return { status: 'locked' };
    }

    const expected = Buffer.from(record.codeHash, 'hex');
    const actual = Buffer.from(hashCode(code), 'hex');
    const match = expected.length === actual.length && timingSafeEqual(expected, actual);

    if (!match) {
      const attempts = await this.store.incrementAttempts(phone);
      const left = Math.max(0, this.config.maxAttempts - attempts);
      if (left === 0) {
        await this.store.delete(phone);
        return { status: 'locked' };
      }
      return { status: 'invalid', attemptsLeft: left };
    }

    await this.store.delete(phone); // یک‌بارمصرف
    return { status: 'verified' };
  }
}
