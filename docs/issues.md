# 🐞 Issues — وضعیت پس از چرخه لایه ۵ (The Hospital) — 2026-06-12

| ID | شدت | شرح | وضعیت | راستی‌آزمایی |
|---|---|---|---|---|
| ISS-001 | 🔴 بالا | Reply در DB ذخیره نمی‌شد | ✅ **FIXED** — زنجیره کامل: events.ts → هندلر سوکت → سرویس (با اعتبارسنجی same-conversation) → MessageInput | 3 unit + 2 E2E (شامل رد cross-conv) |
| ISS-002 | 🟡 متوسط | Forward مسیر نداشت | ✅ **IMPLEMENTED** (تصمیم مدیر) — forwardedFromId در قرارداد/سرویس (با چک دسترسی به مبدأ) + ForwardModal + دکمه روی حباب + badge «بازارسال‌شده» | 2 unit + 3 E2E (شامل رد no-access) |
| ISS-003 | 🟡 متوسط | Thumbnail سرور | ✅ **ACCEPTED for MVP** (تصمیم مدیر) — backlog بهینه‌سازی پس از لانچ | تصمیم ثبت شد |
| ISS-004 | 🟡 متوسط | presign-download بدون چک عضویت | ✅ **FIXED** — آپلودکننده یا عضو گفتگوی حامل پیام؛ غیر آن 403 | E2E: آپلودر 200 / غریبه 403 |
| ISS-005 | 🟡 متوسط | redact لاگر | ✅ **FIXED** — authorization/refreshToken/code/phone | E2E: صفر شماره خام در لاگ |
| ISS-006 | 🟢 کم | logout بدون rate-limit | ✅ **FIXED** — 30/15min | کد |
| ISS-007 | 🟢 کم | توکن در localStorage | 📋 **BACKLOG** (پذیرفته MVP) — httpOnly cookie در هاردنینگ | — |
| ISS-008 | ⚪ اطلاعاتی | سقف سوکت | ✅ **FIXED** — maxHttpBufferSize=64KB | کد |
| ISS-009 | ⚪ اطلاعاتی | race username → 500 | ✅ **FIXED** — catch 11000 → 409 | کد |

**جمع‌بندی: ۷ اصلاح اعمال و تست شد · ۱ پذیرفته‌شده · ۱ backlog · رگرسیون کامل سبز (101 unit + جریان پایه پیام/تیک‌ها در E2E)**
