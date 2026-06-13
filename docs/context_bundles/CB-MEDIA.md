# 📦 Context Bundle — MEDIA (رسانه/S3)

## مستندات مرجع
FEAT-03 · acceptance §2 (آپلود بدون توقف) · تصمیم D-2 (S3-compatible: MinIO dev / آروان prod)

## الگو
Presigned URL — کلاینت مستقیم PUT/GET با Storage؛ Fastify فقط مجوز (TTL آپلود 10min، دانلود 1h)

## فایل‌های کد
`server/src/modules/media/{media.service,media.routes}.ts` · `client/src/services/media.ts` (XHR progress) · `client/src/components/chat/MediaContent.tsx` · پچ MessageInput (دکمه پیوست + نوار درصد)

## امنیت
لیست سفید MIME per-kind (SVG رد — XSS) · پسوند از MIME · objectKey regex (ضد traversal) · سقف MEDIA_MAX_SIZE_MB=50 · ISS-004: دانلود فقط آپلودر/عضو گفتگوی حامل پیام (403)

## تست‌ها: ۷ تست · پیام رسانه‌ای: content=objectKey (INVALID_MEDIA_KEY در غیر این صورت)
