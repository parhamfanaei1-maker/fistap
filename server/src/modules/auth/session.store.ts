import type { Redis } from 'ioredis';

export interface SessionRecord {
  userId: string;
  createdAt: number;
}

/**
 * مخزن سشن (Refresh Token) — system_architecture.md §2: وضعیت سشن در Redis
 * کلید = هش توکن (توکن خام هرگز ذخیره نمی‌شود — همان قانون امنیتی OTP در Task 1.2)
 */
export interface SessionStore {
  set(tokenHash: string, record: SessionRecord, ttlSeconds: number): Promise<void>;
  get(tokenHash: string): Promise<SessionRecord | null>;
  delete(tokenHash: string): Promise<void>;
}

const key = (hash: string): string => `session:${hash}`;

export class RedisSessionStore implements SessionStore {
  constructor(private readonly redis: Redis) {}

  async set(tokenHash: string, record: SessionRecord, ttlSeconds: number): Promise<void> {
    await this.redis.set(key(tokenHash), JSON.stringify(record), 'EX', ttlSeconds);
  }

  async get(tokenHash: string): Promise<SessionRecord | null> {
    const raw = await this.redis.get(key(tokenHash));
    return raw ? (JSON.parse(raw) as SessionRecord) : null;
  }

  async delete(tokenHash: string): Promise<void> {
    await this.redis.del(key(tokenHash));
  }
}

/** فالبک توسعه/تست — همان قرارداد (الگوی Task 1.2) */
export class MemorySessionStore implements SessionStore {
  private readonly map = new Map<string, { record: SessionRecord; expiresAt: number }>();

  async set(tokenHash: string, record: SessionRecord, ttlSeconds: number): Promise<void> {
    this.map.set(key(tokenHash), { record, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async get(tokenHash: string): Promise<SessionRecord | null> {
    const e = this.map.get(key(tokenHash));
    if (!e) return null;
    if (Date.now() > e.expiresAt) {
      this.map.delete(key(tokenHash));
      return null;
    }
    return e.record;
  }

  async delete(tokenHash: string): Promise<void> {
    this.map.delete(key(tokenHash));
  }
}
