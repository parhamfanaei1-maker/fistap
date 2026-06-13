import type { Redis } from 'ioredis';

/**
 * سرویس Presence — system_architecture.md §2:
 * «وضعیت آنلاین بودن کاربر در Redis ذخیره می‌شود تا فشار روی MongoDB کاهش یابد»
 * شمارنده اتصال per-user: چند تب/دستگاه همزمان → فقط با بسته‌شدن آخرین اتصال، آفلاین
 */
export interface PresenceService {
  /** اتصال جدید؛ خروجی: آیا کاربر همین الان آنلاین شد (اولین اتصال)؟ */
  connected(userId: string): Promise<boolean>;
  /** قطع اتصال؛ خروجی: آیا کاربر کاملاً آفلاین شد (آخرین اتصال)؟ */
  disconnected(userId: string): Promise<boolean>;
  isOnline(userId: string): Promise<boolean>;
}

const key = (userId: string): string => `presence:${userId}`;
/** TTL ایمنی: اگر سرور کرش کند، کلیدهای یتیم حداکثر بعد از این مدت پاک می‌شوند */
const PRESENCE_TTL_SECONDS = 24 * 3600;

export class RedisPresenceService implements PresenceService {
  constructor(private readonly redis: Redis) {}

  async connected(userId: string): Promise<boolean> {
    const count = await this.redis.incr(key(userId));
    await this.redis.expire(key(userId), PRESENCE_TTL_SECONDS);
    return count === 1;
  }

  async disconnected(userId: string): Promise<boolean> {
    const count = await this.redis.decr(key(userId));
    if (count <= 0) {
      await this.redis.del(key(userId));
      return true;
    }
    return false;
  }

  async isOnline(userId: string): Promise<boolean> {
    const raw = await this.redis.get(key(userId));
    return Number(raw ?? 0) > 0;
  }
}

/** فالبک توسعه/تست — همان قرارداد (الگوی تثبیت‌شده Task 1.2/1.4) */
export class MemoryPresenceService implements PresenceService {
  private readonly counts = new Map<string, number>();

  async connected(userId: string): Promise<boolean> {
    const next = (this.counts.get(userId) ?? 0) + 1;
    this.counts.set(userId, next);
    return next === 1;
  }

  async disconnected(userId: string): Promise<boolean> {
    const next = (this.counts.get(userId) ?? 0) - 1;
    if (next <= 0) {
      this.counts.delete(userId);
      return true;
    }
    this.counts.set(userId, next);
    return false;
  }

  async isOnline(userId: string): Promise<boolean> {
    return (this.counts.get(userId) ?? 0) > 0;
  }
}
