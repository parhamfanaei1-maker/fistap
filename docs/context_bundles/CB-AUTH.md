# 📦 Context Bundle — AUTH (احراز هویت و سشن)

> بسته کانتکست نقش ۱۲ منشور: هرچه یک توسعه‌دهنده/اصلاح‌کننده برای کار روی این ماژول لازم دارد.

## مستندات مرجع (لایه ۱/۲)
- `requirements.md §2.1` — ورود با شماره → OTP → سشن JWT
- `feature_spec.md` FEAT-01 — @username در اولین ورود
- `acceptance_criteria.md §1` — زنجیره کامل احراز
- UI: **UI-COMP-14** (PrimaryButton) · **UI-COMP-15** (OtpInput + filled_state) · **UI-COMP-22** (Toast)
- `user_flow.md` UF-01 + نقاط تصمیم DP-01/02/04

## فایل‌های کد
| فایل | مسئولیت |
|---|---|
| `server/src/modules/auth/phone.util.ts` | نرمال‌سازی E.164 ایران (ارقام فارسی/عربی) |
| `server/src/modules/auth/otp.{store,service}.ts` | OTP: hash SHA-256، TTL 120s، قفل ۵ تلاش، cooldown 60s |
| `server/src/modules/auth/session.{store,service}.ts` | JWT access 15m + refresh مات 30d با rotation |
| `server/src/modules/auth/auth.routes.ts` | ۵ endpoint (request/verify/refresh/logout/me) |
| `server/src/plugins/{jwt,authGuard}.ts` | امضا/تأیید + preHandler `app.authenticate` |
| `server/src/gateways/sms/*` | قرارداد SmsGateway + MockSmsDriver (D-1) |
| `client/src/app/auth/{welcome,verify,setup}/page.tsx` | سه صفحه جریان ورود |
| `client/src/services/auth.ts` + `store/authStore.ts` | کلاینت تایپ‌سیف + Zustand persist |

## قراردادها
کامل در `project_state.md` بخش‌های «API Contract — Task 1.2/1.4». خطاها: `OTP_INVALID/EXPIRED/LOCKED/COOLDOWN`, `REFRESH_INVALID`, `USERNAME_TAKEN(409)`.

## تست‌ها
`server/src/modules/auth/__tests__/` — ۲۳ تست (phone/otp/session/ttl)

## نکات/درس‌ها
LL-007 (redact لاگ — phone/code/refreshToken) · ISS-006 (rate-limit logout اعمال شد)
