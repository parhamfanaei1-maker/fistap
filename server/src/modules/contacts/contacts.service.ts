import mongoose from 'mongoose';
import { UserModel } from '../../models/User.js';
import { normalizePhone } from '../auth/phone.util.js';

export interface MatchedContact {
  phone: string;
  userId: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
}

export interface MatchResult {
  /** مخاطبانی که کاربر فیستپ هستند */
  matched: MatchedContact[];
  /** شماره‌های نرمال‌شده‌ای که عضو نیستند → لیست دعوت */
  notRegistered: string[];
  /** ورودی‌هایی که شماره معتبر نبودند */
  invalid: number;
}

/** سقف هر درخواست تطبیق — جلوگیری از کوئری سنگین (constraints.md: baseline ۱۰۰۰ کاربر) */
export const MATCH_BATCH_LIMIT = 500;

/**
 * سرویس تطبیق مخاطبین — Task 4.1 (page_capabilities.md §2: Matching)
 * بازاستفاده از normalizePhone تسک 1.2 (ارقام فارسی، ۰۹/۹۸+/۰۰۹۸)
 * حریم خصوصی: فقط کاربرانِ شماره‌های ارسالی برگردانده می‌شوند؛ شماره خودِ کاربر حذف می‌شود
 */
export class ContactsService {
  async match(params: { requesterId: string; phones: string[] }): Promise<MatchResult> {
    const seen = new Set<string>();
    let invalid = 0;

    for (const raw of params.phones.slice(0, MATCH_BATCH_LIMIT)) {
      const normalized = normalizePhone(String(raw));
      if (!normalized) {
        invalid += 1;
        continue;
      }
      seen.add(normalized);
    }

    // شماره خود درخواست‌دهنده در نتایج نیاید
    const me = await UserModel.findById(params.requesterId).select('phone');
    if (me?.phone) seen.delete(me.phone);

    const phones = [...seen];
    if (phones.length === 0) return { matched: [], notRegistered: [], invalid };

    const users = await UserModel.find({ phone: { $in: phones } }).select(
      'phone username displayName avatarUrl',
    );

    const registered = new Set(users.map((u) => u.phone));
    return {
      matched: users.map((u) => ({
        phone: u.phone,
        userId: u.id as string,
        username: u.username ?? null,
        displayName: u.displayName || (u.username ? `@${u.username}` : 'کاربر فیستپ'),
        avatarUrl: u.avatarUrl ?? null,
      })),
      notRegistered: phones.filter((p) => !registered.has(p)),
      invalid,
    };
  }

  dbReady(): boolean {
    return mongoose.connection.readyState === 1;
  }
}
