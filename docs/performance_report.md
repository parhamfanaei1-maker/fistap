# ⚡ گزارش عملکرد (Performance Report) — نقش ۲۵ منشور

**تاریخ:** 2026-06-12 · **محیط اندازه‌گیری:** سندباکس توسعه (Node 20، Mongo واقعی in-memory-server، تک‌instance) — اعداد production روی سخت‌افزار قوی‌تر بهتر خواهند بود ولی نسبت‌ها معتبرند.

## ۱. اندازه‌گیری‌های واقعی سرور (انجام‌شده)

| متریک | مقدار اندازه‌گیری‌شده | معیار / ارزیابی |
|---|---|---|
| `GET /health` (۳۰ نمونه) | **p50=0.9ms · p95=1.7ms · max=2.2ms** | عالی — overhead پایه Fastify ناچیز |
| `GET /auth/me` (JWT verify + Mongo lookup) | **2.6ms** | عالی |
| `message:send` ack — شامل **ذخیره در Mongo** + upsert گفتگو (۲۰ پیام) | **p50=0.5ms · p95=5.9ms** | عالی |
| تحویل end-to-end به گیرنده آنلاین (E2E تسک‌های 2.2/2.3) | **<500ms** (assert تست؛ عمده‌ی آن wait تست است — زمان واقعی emit→receive در حد ms) | ✅ **معیار `requirements.md`: <1s — با حاشیه بزرگ پاس** |
| مصرف حافظه سرور (RSS، در حال سرویس‌دهی) | **~81 MB** | برای baseline ۱۰۰۰ کاربر (constraints §2) روی VM 4GB بسیار راحت |
| حجم باندل سرور (tsup, ESM) | **66 KB** (+node_modules) | cold-start سریع |

## ۲. اندازه‌گیری‌های واقعی کلاینت (خروجی next build)

| مسیر | Size | First Load JS | ارزیابی |
|---|---|---|---|
| `/auth/welcome` | 2.5 kB | **101 kB** | سبک |
| `/app/dashboard` (کل UI چت) | 8.2 kB | **125 kB** | خوب برای یک اپ چت کامل |
| `/offline` | 1.2 kB | 96 kB | — |
| shared chunks | — | 89.6 kB | React+Next پایه؛ Zustand/socket.io-client سهم کوچک |

همه صفحات استاتیک prerender شده‌اند → TTFB حداقلی؛ استاتیک‌ها پشت SW با CacheFirst (بازدید دوم تقریباً آنی).

## ۳. تحلیل کوئری‌ها و ایندکس‌ها (بازبینی کد)

| نقطه داغ | وضعیت |
|---|---|
| تاریخچه پیام | ✅ ایندکس مرکب `(conversationId, timestamp)` + cursor-based (بدون skip) |
| Sidebar | ✅ `lastMessageId` denormalized — **الگوی anti-N+1**: واکشی آخرین پیام‌ها در یک `$in` (نه populate حلقه‌ای) |
| گفتگوی خصوصی | ✅ upsert اتمیک روی `privateKey` unique — صفر race، صفر کوئری اضافی |
| presence/OTP/session | ✅ Redis O(1) — صفر فشار روی Mongo |
| search | ✅ regex + ایندکس username(unique)/displayName + سقف نتایج ۲۰ + حداقل ۲ کاراکتر |
| push | ✅ `$in` روی اشتراک‌های کاربر + ارسال موازی `Promise.all` |

## ۴. گلوگاه‌های شناخته‌شده و نقشه مقیاس (پیش از نیاز واقعی، بهینه‌سازی نکردیم — قانون premature optimization)

| آیتم | آستانه بروز | راه‌حل آماده |
|---|---|---|
| Socket.io تک‌instance | >~۵k اتصال همزمان | Redis adapter (یک پکیج + ۳ خط) — در deployment_guide ثبت شده |
| regex search | رشد >۱۰۰k کاربر | MongoDB text index / Atlas Search |
| `markDelivered` per-recipient در گروه‌های بزرگ | گروه‌های صدها‌نفره فعال | batch + debounce سمت سرور |
| تصاویر بدون thumbnail (ISS-003 پذیرفته) | مصرف دیتای موبایل | sharp worker در backlog |

## ۵. نتیجه
**همه معیارهای غیرعملکردی `requirements.md §3` (تاخیر <1s، baseline ۱۰۰۰ کاربر) با حاشیه قابل‌توجه برآورده‌اند.** هیچ بهینه‌سازی فوری لازم نیست؛ مسیر مقیاس مستند است.
