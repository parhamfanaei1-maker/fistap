import { randomBytes } from 'node:crypto';
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { MEDIA_MAX_SIZE_MB } from '@fistap/shared';
import { env } from '../../config/env.js';

/** نگاشت نوع پیام ← MIME های مجاز (امنیت: فقط لیست سفید) */
const ALLOWED_MIME: Record<string, RegExp> = {
  image: /^image\/(jpeg|png|webp|gif)$/,
  video: /^video\/(mp4|webm|quicktime)$/,
  audio: /^audio\/(mpeg|mp4|ogg|webm|wav|aac)$/,
  file: /^[\w.+-]+\/[\w.+-]+$/, // هر MIME معتبر — دانلود به صورت attachment
};

export type MediaKind = keyof typeof ALLOWED_MIME & ('image' | 'video' | 'audio' | 'file');

export interface PresignUploadInput {
  userId: string;
  kind: string;
  mime: string;
  sizeBytes: number;
  fileName?: string;
}

export type PresignUploadOutcome =
  | {
      ok: true;
      /** آدرس PUT مستقیم به Storage (acceptance_criteria §2: بدون عبور از سرور API) */
      uploadUrl: string;
      /** کلید آبجکت — بعد از آپلود در content پیام قرار می‌گیرد */
      objectKey: string;
      expiresInSeconds: number;
      maxSizeBytes: number;
    }
  | { ok: false; code: string };

export type PresignDownloadOutcome =
  | { ok: true; downloadUrl: string; expiresInSeconds: number }
  | { ok: false; code: string };

const UPLOAD_TTL_SECONDS = 600; // ۱۰ دقیقه برای آپلود
const DOWNLOAD_TTL_SECONDS = 3600; // ۱ ساعت برای دانلود

/**
 * سرویس رسانه — Task 3.3 (FEAT-03, تصمیم D-2: S3-compatible)
 * الگوی Presigned URL: کلاینت مستقیم با Storage حرف می‌زند؛ Fastify فقط مجوز صادر می‌کند.
 * production: ابر آروان (سازگار S3) · dev: MinIO docker-compose
 */
export class MediaService {
  private readonly s3: S3Client;

  constructor() {
    this.s3 = new S3Client({
      endpoint: env.S3_ENDPOINT,
      region: 'us-east-1', // برای سرویس‌های S3-compatible صوری است
      credentials: { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY },
      forcePathStyle: true, // MinIO/Arvan الزام دارند
    });
  }

  async presignUpload(input: PresignUploadInput): Promise<PresignUploadOutcome> {
    const pattern = ALLOWED_MIME[input.kind];
    if (!pattern) return { ok: false, code: 'INVALID_KIND' };
    if (!pattern.test(input.mime)) return { ok: false, code: 'INVALID_MIME' };

    const maxBytes = MEDIA_MAX_SIZE_MB * 1024 * 1024;
    if (!Number.isFinite(input.sizeBytes) || input.sizeBytes <= 0 || input.sizeBytes > maxBytes) {
      return { ok: false, code: 'FILE_TOO_LARGE' };
    }

    // کلید آبجکت: media/<kind>/<userId>/<random>.<ext> — غیرقابل حدس
    const ext = this.safeExt(input.mime, input.fileName);
    const objectKey = `media/${input.kind}/${input.userId}/${Date.now()}-${randomBytes(8).toString('hex')}${ext}`;

    const cmd = new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: objectKey,
      ContentType: input.mime,
      ContentLength: input.sizeBytes,
    });
    const uploadUrl = await getSignedUrl(this.s3, cmd, { expiresIn: UPLOAD_TTL_SECONDS });
    return { ok: true, uploadUrl, objectKey, expiresInSeconds: UPLOAD_TTL_SECONDS, maxSizeBytes: maxBytes };
  }

  /** تأیید وجود آبجکت پس از آپلود (قبل از ثبت پیام رسانه‌ای) */
  async objectExists(objectKey: string): Promise<boolean> {
    try {
      await this.s3.send(new HeadObjectCommand({ Bucket: env.S3_BUCKET, Key: objectKey }));
      return true;
    } catch {
      return false;
    }
  }

  async presignDownload(objectKey: string): Promise<PresignDownloadOutcome> {
    if (!/^media\/(image|video|audio|file)\/[a-f0-9]{24}\/[\w.-]+$/.test(objectKey)) {
      return { ok: false, code: 'INVALID_KEY' };
    }
    const cmd = new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: objectKey });
    const downloadUrl = await getSignedUrl(this.s3, cmd, { expiresIn: DOWNLOAD_TTL_SECONDS });
    return { ok: true, downloadUrl, expiresInSeconds: DOWNLOAD_TTL_SECONDS };
  }

  /** پسوند امن از MIME (نه از نام فایل کاربر — جلوگیری از تزریق) */
  private safeExt(mime: string, fileName?: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif',
      'video/mp4': '.mp4', 'video/webm': '.webm', 'video/quicktime': '.mov',
      'audio/mpeg': '.mp3', 'audio/mp4': '.m4a', 'audio/ogg': '.ogg', 'audio/webm': '.weba',
      'audio/wav': '.wav', 'audio/aac': '.aac',
    };
    if (map[mime]) return map[mime];
    const fromName = fileName?.match(/(\.[a-zA-Z0-9]{1,8})$/)?.[1];
    return fromName ?? '.bin';
  }
}
