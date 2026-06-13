import type { Redis } from 'ioredis';

export interface OtpRecord {
  codeHash: string;
  attempts: number;
  createdAt: number;
}

/** قرارداد مخزن OTP — Redis در production، Memory در dev بدون Redis (LL-safe، قابل تست) */
export interface OtpStore {
  set(phone: string, record: OtpRecord, ttlSeconds: number): Promise<void>;
  get(phone: string): Promise<OtpRecord | null>;
  incrementAttempts(phone: string): Promise<number>;
  delete(phone: string): Promise<void>;
  /** ثانیه‌های باقیمانده تا امکان ارسال مجدد؛ 0 یعنی مجاز */
  ttl(phone: string): Promise<number>;
}

const key = (phone: string): string => `otp:${phone}`;

export class RedisOtpStore implements OtpStore {
  constructor(private readonly redis: Redis) {}

  async set(phone: string, record: OtpRecord, ttlSeconds: number): Promise<void> {
    await this.redis.set(key(phone), JSON.stringify(record), 'EX', ttlSeconds);
  }

  async get(phone: string): Promise<OtpRecord | null> {
    const raw = await this.redis.get(key(phone));
    return raw ? (JSON.parse(raw) as OtpRecord) : null;
  }

  async incrementAttempts(phone: string): Promise<number> {
    const rec = await this.get(phone);
    if (!rec) return Number.MAX_SAFE_INTEGER;
    rec.attempts += 1;
    const remaining = await this.redis.ttl(key(phone));
    if (remaining > 0) await this.redis.set(key(phone), JSON.stringify(rec), 'EX', remaining);
    return rec.attempts;
  }

  async delete(phone: string): Promise<void> {
    await this.redis.del(key(phone));
  }

  async ttl(phone: string): Promise<number> {
    const t = await this.redis.ttl(key(phone));
    return t > 0 ? t : 0;
  }
}

/** فالبک توسعه/تست — همان قرارداد، بدون وابستگی خارجی */
export class MemoryOtpStore implements OtpStore {
  private readonly map = new Map<string, { record: OtpRecord; expiresAt: number }>();

  private alive(phone: string) {
    const e = this.map.get(key(phone));
    if (!e) return null;
    if (Date.now() > e.expiresAt) {
      this.map.delete(key(phone));
      return null;
    }
    return e;
  }

  async set(phone: string, record: OtpRecord, ttlSeconds: number): Promise<void> {
    this.map.set(key(phone), { record, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async get(phone: string): Promise<OtpRecord | null> {
    return this.alive(phone)?.record ?? null;
  }

  async incrementAttempts(phone: string): Promise<number> {
    const e = this.alive(phone);
    if (!e) return Number.MAX_SAFE_INTEGER;
    e.record.attempts += 1;
    return e.record.attempts;
  }

  async delete(phone: string): Promise<void> {
    this.map.delete(key(phone));
  }

  async ttl(phone: string): Promise<number> {
    const e = this.alive(phone);
    return e ? Math.ceil((e.expiresAt - Date.now()) / 1000) : 0;
  }
}
