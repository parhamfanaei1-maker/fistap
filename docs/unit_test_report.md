# 🧪 گزارش تست‌های واحد (Unit Test Report) — نقش ۱۷ منشور

**تاریخ اجرا:** 2026-06-12 · **ابزار:** Vitest 2 + mongodb-memory-server (دیتابیس واقعی ایزوله) · **نتیجه: 15/15 فایل، 101/101 تست سبز ✅ · مدت: 7.5s**

## نتایج به تفکیک ماژول

| ماژول | فایل تست | تست‌ها | پوشش رفتاری کلیدی |
|---|---|---|---|
| Auth/Phone | `phone.util.test.ts` | 7 ✅ | فرمت‌های ۰۹/۰۰۹۸/+۹۸/بدون‌صفر، ارقام فارسی، فاصله/خط‌تیره، رد ورودی خراب |
| Auth/OTP | `otp.service.test.ts` | 6 ✅ | happy path، یک‌بارمصرف، کاهش تلاش، قفل ۵تایی، cooldown، انقضا (fake timers) |
| Auth/Session | `session.service.test.ts` | 5 ✅ | صدور جفت توکن، **rotation ضد replay**، رد ناشناخته، revoke، انقضا |
| Auth/TTL | `ttl.util.test.ts` | 5 ✅ | پارس s/m/h/d + fail-fast فرمت غلط |
| Socket/Auth | `auth.middleware.test.ts` | 5 ✅ | پذیرش معتبر + ۴ حالت رد (غلط/خالی/غایب/غیر-string) |
| Socket/Presence | `presence.service.test.ts` | 5 ✅ | شمارنده چنددستگاهی: فقط اولین اتصال=آنلاین، آخرین قطع=آفلاین |
| Messages/Core | `message.service.test.ts` | 8 ✅ | ساخت خودکار گفتگو (بدون duplicate)، **امنیت non-member**، تاریخچه cursor، sidebar مرتب |
| Messages/Status | `message.status.test.ts` | 10 ✅ | delivered/read، **idempotency، عدم پس‌رفت وضعیت**، anchor خارجی رد |
| Messages/Reply+Fwd | `reply.forward.test.ts` | 5 ✅ | ذخیره واقعی در DB، **رد cross-conversation و no-access** (رگرسیون ISS-001/002) |
| Conversations/Roles | `conversation.service.test.ts` | 13 ✅ | کل ماتریس owner/admin/member، selfLeave، **CHANNEL_READONLY**، outsider |
| Conversations/Pin | `pin.test.ts` | 7 ✅ | مجوزها، unpin، **پین پیام گفتگوی دیگر رد**، انعکاس در sidebar |
| Media | `media.service.test.ts` | 7 ✅ | presign، سقف 50MB، **لیست سفید (SVG رد)**، پسوند از MIME، **ضد traversal** |
| Push | `push.service.test.ts` | 5 ✅ | VAPID dev، upsert بدون duplicate، ارسال per-user، **پاکسازی 410**، unsubscribe مالک |
| Contacts | `contacts.service.test.ts` | 6 ✅ | تطبیق همه فرمت‌ها، dedupe، **حذف شماره خود (privacy)**، سقف 500 |
| Search | `search.service.test.ts` | 7 ✅ | @username، فارسی partial، حذف خود، **عدم نشت phone، regex escape** |

## ارزیابی پوشش
- **سرویس‌های دامنه (منطق اصلی): 14/14 ماژول دارای تست** — همه مسیرهای موفق + خطا + سناریوهای امنیتی
- لایه‌های نازک (routes = اتصال zod+سرویس، plugins) عمداً با **E2E زنده** پوشش داده شدند نه unit (گزارش: `integration_report.md`)
- کلاینت: پوشش از طریق typecheck سخت‌گیرانه + build + E2E قراردادی — تست کامپوننتی React در backlog فاز Growth

## بازتولید
```bash
pnpm --filter @fistap/server test
```
