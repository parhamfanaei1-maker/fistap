# 📦 Context Bundle — PWA (آفلاین/نصب/Push/مخاطبین/جستجو)

## مستندات مرجع
FEAT-04 · acceptance §3 · page_capabilities §2/§3 · تکمیل جریان system_architecture §2 (آفلاین→push)

## فایل‌های کد
| حوزه | فایل‌ها |
|---|---|
| SW/کش | `client/next.config.mjs` (استراتژی‌ها + fallback /offline + customWorkerSrc) · `client/src/worker/index.ts` (push/notificationclick) |
| نصب/اتصال | `client/src/components/pwa/{InstallPrompt,ConnectionBanner}.tsx` · `app/offline/page.tsx` |
| Push سرور | `server/src/modules/push/{push.service,push.routes}.ts` — VAPID، کالکشن pushsubscriptions، پاکسازی 410 |
| Push کلاینت | `client/src/services/push.ts` (enable/disable، base64url→ArrayBuffer) |
| مخاطبین | `server/src/modules/contacts/*` · `client/src/services/contacts.ts` · `app/app/contacts/page.tsx` (Picker+fallback+invite+draftRecipient) |
| جستجو | `server/src/modules/search/*` · `client/src/services/search.ts` + `hooks/useDebounce.ts` · `app/app/search/page.tsx` |
| تنظیمات | `app/app/settings/page.tsx` (toggle push/تم/خروج) |

## نکات/درس‌ها
LL-005 (extensionAlias) · LL-007 (push فقط HTTPS + debug-log در best-effort) · VAPID ثابت بماند (تغییر = ابطال اشتراک‌ها)

## تست‌ها: contacts ۶ + push ۵ + search ۷ = ۱۸ تست
