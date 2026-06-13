import { PHONE_REGEX } from '@fistap/shared';

/**
 * نرمال‌سازی شماره تلفن به فرمت E.164 با تمرکز بر ایران — FEAT-01
 * "09121234567"  -> "+989121234567"
 * "9121234567"   -> "+989121234567"
 * "00989121..."  -> "+989121..."
 * "+98912..."    -> بدون تغییر
 */
export function normalizePhone(raw: string): string | null {
  let p = raw.trim().replace(/[\s\-()]/g, '');
  // تبدیل ارقام فارسی/عربی به لاتین
  p = p.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
  p = p.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

  if (p.startsWith('0098')) p = `+98${p.slice(4)}`;
  else if (p.startsWith('098')) p = `+98${p.slice(3)}`;
  else if (p.startsWith('09')) p = `+98${p.slice(1)}`;
  else if (p.startsWith('98') && p.length === 12) p = `+${p}`;
  else if (/^9\d{9}$/.test(p)) p = `+98${p}`;

  if (!PHONE_REGEX.test(p)) return null;
  return p;
}
