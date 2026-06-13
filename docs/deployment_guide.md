# 🚀 راهنمای استقرار فیستپ — v0.1.0 MVP (لایه ۶ AI-DOS)

**هدف:** استقرار روی زیرساخت داخل ایران برای الزام «دسترسی بدون VPN» (`constraints.md §1`).

---

## ۱. انتخاب زیرساخت (الزام بدون VPN)

| جزء | پیشنهاد (داخل ایران) | چرا |
|---|---|---|
| سرور (VM) | ابر آروان / پارس‌پک / ایران‌سرور — حداقل 2vCPU/4GB برای baseline ۱۰۰۰ کاربر | میزبانی داخلی = بدون فیلترینگ خروجی |
| Object Storage | **ابر آروان S3-compatible** (تصمیم D-2) | فقط `S3_ENDPOINT/KEY/SECRET` عوض می‌شود — کد آماده است |
| SMS Gateway | کاوه‌نگار یا SMS.ir (تصمیم D-1: درایور جدید در `server/src/gateways/sms/` — قرارداد `SmsGateway` فقط یک متد دارد) | OTP داخلی |
| دامنه + TLS | دامنه `.ir` + گواهی (certbot یا گواهی آروان) | PWA/Push/Contact Picker **الزاماً HTTPS** |
| CDN (اختیاری) | ابر آروان CDN | کش استاتیک نزدیک کاربر (مکمل SW) |

## ۲. چک‌لیست `.env.production` (الزامی — سرور با مقادیر dev بالا نمی‌آید)

```bash
NODE_ENV=production
PORT=4000
PUBLIC_ORIGIN=https://your-domain.ir        # برای compose (آدرس عمومی کلاینت)
CORS_ORIGIN=https://your-domain.ir

# 🔐 سکرت‌های قوی بسازید: openssl rand -hex 64
JWT_ACCESS_SECRET=<64-hex>
JWT_REFRESH_SECRET=<64-hex-متفاوت>
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d

OTP_TTL_SECONDS=120
OTP_MAX_ATTEMPTS=5
SMS_DRIVER=kavenegar                        # پس از افزودن درایور؛ تا آن زمان mock
# KAVENEGAR_API_KEY=...

# ابر آروان S3
S3_ENDPOINT=https://s3.ir-thr-at1.arvanstorage.ir
S3_ACCESS_KEY=<arvan-key>
S3_SECRET_KEY=<arvan-secret>
S3_BUCKET=fistap-media

# 🔑 Web Push — یکبار بسازید و ثابت نگه دارید (تغییر = باطل شدن همه اشتراک‌ها)
# تولید: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=<...>
VAPID_PRIVATE_KEY=<...>
VAPID_SUBJECT=mailto:admin@your-domain.ir
```

## ۳. گام‌های استقرار

```bash
# 1) روی سرور
git clone <repo> fistap && cd fistap
cp .env.example .env.production   # و مقادیر بالا را پر کنید

# 2) گواهی TLS → infra/certs/{fullchain.pem,privkey.pem}
#    certbot certonly --standalone -d your-domain.ir

# 3) دامنه را در infra/nginx/nginx.prod.conf جایگزین server_name کنید

# 4) بالا آوردن
docker compose -f infra/docker-compose.prod.yml --env-file .env.production up -d --build

# 5) ساخت bucket رسانه (یکبار) — از پنل آروان یا aws-cli با endpoint آروان

# 6) دودکشی (smoke):
curl -s https://your-domain.ir/api/v1/../../health   # → باید 200 از /health بدهد
#    + ورود واقعی با شماره خودتان + نصب PWA روی گوشی + تست push با گوشی خاموش‌صفحه
```

## ۴. نکات عملیاتی

- **پایداری ۹۹.۹٪** (constraints §2): `restart: unless-stopped` روی همه سرویس‌ها + healthcheck های mongo/redis فعال‌اند. برای ارتقا: `docker compose ... up -d --build` (بدون قطعی nginx).
- **بکاپ:** والیوم‌های `mongo_data`/`redis_data` + bucket آروان (versioning روشن).
- **مقیاس بعدی (روی نقشه از tech_stack_spec §4):** Kubernetes + Socket.io Redis adapter (برای چند instance سرور) — برای baseline ۱۰۰۰ کاربر فعلاً لازم نیست.
- **امنیت شبکه:** mongo/redis فقط در شبکه داخلی docker (publish نشده‌اند)؛ فقط 80/443 باز است.
- **مانیتورینگ حداقلی:** `docker compose logs -f server` (pino JSON — redact فعال) + uptime-checker بیرونی روی `/health`.

## ۵. کارهای پس از لانچ (backlog ثبت‌شده)
ISS-007 (httpOnly cookie) · Thumbnail worker (ISS-003) · درایور SMS واقعی · Redis adapter سوکت · اولویت ۲ roadmap (تماس، فولدر، استیکر، جستجوی تاریخچه)
