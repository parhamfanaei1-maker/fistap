import webpush from 'web-push';
import { Schema, model, Types } from 'mongoose';
import mongoose from 'mongoose';
import { env } from '../../config/env.js';

/** اشتراک Push هر دستگاه کاربر — endpoint یکتا (database: کالکشن جدید pushsubscriptions) */
const pushSubSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  createdAt: { type: Date, default: Date.now },
});
export const PushSubscriptionModel = model('PushSubscription', pushSubSchema);

export interface WebPushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface PushPayload {
  title: string;
  body: string;
  /** آدرس باز شدن با کلیک روی اعلان */
  url: string;
  tag?: string;
}

/**
 * سرویس Push — Task 4.3 (system_architecture.md §2: گیرنده آفلاین → Push)
 * VAPID: از env یا تولید خودکار در dev (کلیدها در لاگ چاپ می‌شوند)
 */
export class PushService {
  readonly publicKey: string;
  private readonly enabled: boolean;
  private readonly log?: { info: (m: string) => void; warn: (m: string) => void };

  constructor(log?: { info: (m: string) => void; warn: (m: string) => void }) {
    this.log = log;
    let pub = env.VAPID_PUBLIC_KEY;
    let priv = env.VAPID_PRIVATE_KEY;
    if (!pub || !priv) {
      if (env.NODE_ENV === 'production') {
        log?.warn('⚠️ Push disabled: VAPID keys missing in production');
        this.publicKey = '';
        this.enabled = false;
        return;
      }
      const keys = webpush.generateVAPIDKeys();
      pub = keys.publicKey;
      priv = keys.privateKey;
      log?.info(`🔑 [dev] generated VAPID public key: ${pub}`);
    }
    webpush.setVapidDetails(env.VAPID_SUBJECT, pub, priv);
    this.publicKey = pub;
    this.enabled = true;
  }

  isEnabled(): boolean {
    return this.enabled && mongoose.connection.readyState === 1;
  }

  /** ثبت/به‌روزرسانی اشتراک یک دستگاه (upsert روی endpoint) */
  async subscribe(userId: string, sub: WebPushSubscription): Promise<boolean> {
    if (!this.isEnabled()) return false;
    await PushSubscriptionModel.findOneAndUpdate(
      { endpoint: sub.endpoint },
      { userId: new Types.ObjectId(userId), endpoint: sub.endpoint, keys: sub.keys },
      { upsert: true },
    );
    return true;
  }

  /** لغو اشتراک (toggle خاموش در تنظیمات) */
  async unsubscribe(userId: string, endpoint: string): Promise<void> {
    if (!this.isEnabled()) return;
    await PushSubscriptionModel.deleteOne({ endpoint, userId: new Types.ObjectId(userId) });
  }

  async hasSubscription(userId: string): Promise<boolean> {
    if (!this.isEnabled()) return false;
    return (await PushSubscriptionModel.countDocuments({ userId: new Types.ObjectId(userId) })) > 0;
  }

  /**
   * ارسال به همه دستگاه‌های کاربر — اشتراک‌های مرده (410/404) خودکار حذف می‌شوند
   * خروجی: تعداد ارسال موفق
   */
  async sendToUser(userId: string, payload: PushPayload): Promise<number> {
    if (!this.isEnabled()) return 0;
    const subs = await PushSubscriptionModel.find({ userId: new Types.ObjectId(userId) });
    let sent = 0;
    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.keys!.p256dh!, auth: sub.keys!.auth! } },
            JSON.stringify(payload),
            { TTL: 3600 },
          );
          sent += 1;
        } catch (err) {
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) {
            await PushSubscriptionModel.deleteOne({ _id: sub._id }); // اشتراک منقضی
          } else {
            // LL-007: مسیر best-effort هرگز نباید کاملاً ساکت باشد
            this.log?.warn(`⚠️ push send failed (${status ?? 'no-status'}): ${(err as Error).message?.slice(0, 120)}`);
          }
        }
      }),
    );
    return sent;
  }
}
