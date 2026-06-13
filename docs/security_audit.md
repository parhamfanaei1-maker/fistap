# 🔐 ممیزی امنیتی (Security Audit) — لایه ۴ AI-DOS

**تاریخ:** 2026-06-12 · **ممیز:** AI حسابرس امنیتی (نقش ۱۹) · **دامنه:** سطح حمله کامل سرور + کلاینت

## ✅ نقاط قوت تأییدشده (با تست)

| حوزه | کنترل | راستی‌آزمایی |
|---|---|---|
| OTP | SHA-256 hash (هرگز خام) · timingSafeEqual · یک‌بارمصرف · قفل ۵ تلاش · cooldown ۶۰s | unit + E2E زنده |
| Session | refresh فقط hash در Redis · rotation یک‌بارمصرف (ضد replay — تست شد) · prod بدون secret واقعی بالا نمی‌آید | unit + E2E |
| Socket | JWT الزامی در handshake — اتصال ناشناس/جعلی رد (E2E) · payload ناشناخته validate | E2E زنده |
| Authorization | عضویت در هر عملیات پیام/تاریخچه/پین چک می‌شود · ماتریس نقش‌ها (owner>admin>member) ۱۳ تست · کانال readonly | unit + E2E |
| Media | لیست سفید MIME (SVG رد = ضد XSS) · پسوند از MIME نه نام فایل · objectKey regex (ضد traversal — تست `../../etc/passwd`) · سقف 50MB | unit + E2E |
| Search | regex escape (ضد ReDoS — تست `.*`) · عدم نشت phone · فقط گفتگوهای خود کاربر · min 2 char | unit + E2E |
| Contacts | عدم بازگشت شماره‌های غیرپرسیده · حذف شماره خود · سقف 500 · rate-limit 10/15min | unit + E2E |
| HTTP | helmet ✅ · CORS با origin مشخص ✅ · rate-limit سراسری 100/min + اختصاصی‌های سخت‌گیرانه | کد |
| Input | zod روی تمام بدنه‌ها/کوئری‌ها · Mongoose ODM (بدون string query — ضد NoSQLi) | کد |

## ⚠️ یافته‌ها (Issues)

### ISS-004 (متوسط) — `POST /media/presign-download` کنترل عضویت ندارد
هر کاربر احرازشده‌ای که `objectKey` را بداند می‌تواند لینک دانلود بگیرد. کلیدها غیرقابل حدس‌اند (timestamp+rand16) و فقط از طریق پیام‌های گفتگو منتشر می‌شوند، بنابراین ریسک عملی پایین است — اما **defense-in-depth** نقض شده. اصلاح پیشنهادی: نگاشت objectKey→messageId→عضویت گفتگو (نیازمند فیلد جدید یا کالکشن media).

### ISS-005 (متوسط) — redact در لاگر تنظیم نیست
بدنه‌ها لاگ نمی‌شوند (فقط متادیتای request) پس نشت فعلی رخ نمی‌دهد، اما با هر تغییر سطح لاگ، `refreshToken`/`code` در معرض ثبت‌اند. اصلاح: `logger.redact` برای هدر authorization و کلیدهای حساس.

### ISS-006 (کم) — `POST /auth/logout` بدون authenticate و بدون rate-limit
ابطال نیازمند دانستن خود توکن ۹۶-هگزی است (غیرقابل حدس)، پس سوءاستفاده عملی نیست؛ اما endpoint بدون محافظ نرخ است. اصلاح: rate-limit.

### ISS-007 (کم) — توکن‌ها در localStorage (persist)
سطح XSS: در صورت XSS موفق، توکن قابل سرقت است. کنترل‌های جبرانی موجود: helmet/CSP پایه، React escaping، عدم رندر HTML خام، رد SVG. پذیرفته‌شده برای MVP (الگوی رایج PWA)؛ مهاجرت به httpOnly cookie در backlog هاردنینگ.

### ISS-008 (اطلاعاتی) — maxHttpBufferSize سوکت پیش‌فرض (1MB)
کافی و ایمن برای پیام ≤4096 کاراکتر؛ صریح‌سازی به 64KB توصیه می‌شود (کاهش سطح DoS).

### ISS-009 (اطلاعاتی) — race در یکتایی username
چک `findOne` سپس update — در همزمانی نادر، duplicate key 11000 به 500 تبدیل می‌شود نه 409. ایندکس unique از داده محافظت می‌کند (مشکل فقط UX خطا).

## نتیجه
**هیچ یافته بحرانی (Critical) وجود ندارد.** ۲ متوسط، ۲ کم، ۲ اطلاعاتی — همه دارای کنترل جبرانی. مسیر اصلاح در `issues.md`.
