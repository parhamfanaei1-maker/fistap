import { z } from 'zod';

/** اعتبارسنجی fail-fast متغیرهای محیطی — متخصص محیط (نقش ۱۴ AI-DOS) */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  MONGO_URI: z.string().default('mongodb://localhost:27017/fistap'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  JWT_ACCESS_SECRET: z.string().default('dev-only-access-secret'),
  JWT_REFRESH_SECRET: z.string().default('dev-only-refresh-secret'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),

  OTP_TTL_SECONDS: z.coerce.number().default(120),
  OTP_MAX_ATTEMPTS: z.coerce.number().default(5),
  SMS_DRIVER: z.enum(['mock', 'kavenegar', 'smsir']).default('mock'),

  S3_ENDPOINT: z.string().default('http://localhost:9000'),
  S3_ACCESS_KEY: z.string().default('minioadmin'),
  S3_SECRET_KEY: z.string().default('minioadmin'),
  S3_BUCKET: z.string().default('fistap-media'),

  // Task 4.3 — Web Push (VAPID)
  VAPID_PUBLIC_KEY: z.string().default(''),
  VAPID_PRIVATE_KEY: z.string().default(''),
  VAPID_SUBJECT: z.string().default('mailto:admin@fistap.example'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const IS_PROD = env.NODE_ENV === 'production';

if (IS_PROD && (env.JWT_ACCESS_SECRET.startsWith('dev-only') || env.JWT_REFRESH_SECRET.startsWith('dev-only'))) {
  console.error('❌ Refusing to start in production with dev JWT secrets.');
  process.exit(1);
}