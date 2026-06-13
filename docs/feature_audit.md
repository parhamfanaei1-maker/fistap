# ✅ ممیزی فیچرها (Feature Audit) — لایه ۴ AI-DOS

**تاریخ:** 2026-06-12 · **ممیز:** AI تحلیلگر ویژگی‌ها (نقش ۱۶) · **مبنا:** `feature_spec.md`, `mvp_definition.md`, `acceptance_criteria.md`

## FEAT-01: Auth & Profile — ✅ کامل
| الزام | وضعیت | شواهد |
|---|---|---|
| شماره تلفن → کد OTP | ✅ | Task 1.2 — OTP hash+TTL+قفل، تست E2E زنده |
| خروجی: دسترسی به داشبورد | ✅ | Task 1.4 — JWT access/refresh + rotation |
| ایجاد @username در اولین ورود | ✅ | Task 1.3 — `/auth/setup` + `PATCH /users/profile` + یکتایی |

## FEAT-02: Messaging Core — ⚠️ یک شکاف
| الزام | وضعیت | شواهد |
|---|---|---|
| WebSockets (Socket.io) | ✅ | Task 2.1 — JWT handshake + presence |
| ارسال لحظه‌ای | ✅ | Task 2.2 — ack/tempId + تحویل <500ms در E2E |
| تیک‌های خوانده شدن | ✅ | Task 2.3 — sent/delivered/read + عدم پس‌رفت |
| **Reply** | ✅ (پس از fix ISS-001) | زنجیره کامل + اعتبارسنجی same-conversation + ۵ تست |
| **Forward** | ✅ (پس از impl ISS-002) | ForwardModal + چک دسترسی مبدأ + badge + ۵ تست |
| پین: ذخیره ID پیام پین در دیتابیس | ✅ | Task 3.4 — REST + رویداد لحظه‌ای + PinnedBar |

## FEAT-03: Media Handling — ⚠️ انحراف مستند
| الزام | وضعیت | شواهد |
|---|---|---|
| Object Storage | ✅ | Task 3.3 — S3/MinIO presigned + لیست سفید MIME |
| **تولید Thumbnail** | ⚠️ **ISS-003** | از قبل به‌عنوان انحراف ثبت شده (backlog فاز ۵) — پیش‌نمایش با object-cover. تصمیم مدیر لازم: قبول برای MVP یا پیاده‌سازی |

## FEAT-04: PWA & Connectivity — ✅ کامل
| الزام | وضعیت | شواهد |
|---|---|---|
| SW: کش استاتیک | ✅ | Task 4.2 — CacheFirst fonts/images/static |
| مکانیزم Retry | ✅ | apiFetch retry + socket reconnection پلکانی + NetworkFirst + ConnectionBanner |

## MVP Checklist (`mvp_definition.md`)
ورود OTP ✅ · پروفایل/username ✅ · چت ۱:۱/گروه/کانال ✅ · رسانه ✅ · مخاطبین ✅ · PWA+Push ✅ · تنظیمات+تم ✅ · جستجو ✅ · **بدون VPN: زیرساختی (Nginx/S3-ایران آماده؛ تصمیم استقرار)**

## Acceptance Criteria
§1 احراز ✅ (E2E کامل) · §2 تحویل <1s ✅ (~500ms) + آپلود بدون توقف ✅ (presigned) · §3 نصب ✅ + push پس‌زمینه ✅ · §4 دسترسی داخلی ⏳ (نیازمند استقرار واقعی)

**نتیجه (به‌روز پس از لایه ۵): FEAT-01/02/04 = 100% ✅ · FEAT-03 = پذیرفته‌شده برای MVP (thumbnail در backlog با تصمیم مدیر) — MVP feature-complete**
