import withPWAInit from '@ducanh2912/next-pwa';

/**
 * PWA — Task 4.2 (FEAT-04: Service Worker + قابلیت نصب، acceptance_criteria.md §3)
 * استراتژی‌های کش:
 *  - استاتیک/فونت/تصاویر → CacheFirst (FEAT-04: «کش کردن فایل‌های استاتیک»)
 *  - API → NetworkFirst با timeout کوتاه (شبکه ناپایدار ایران → fallback به کش)
 *  - صفحات → NetworkFirst + fallback به /offline
 * نکته: Socket.io و presigned URL های Storage عمداً کش نمی‌شوند.
 */
const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  // Task 4.3: هندلر push/notificationclick سفارشی (در sw.js ادغام می‌شود)
  customWorkerSrc: 'src/worker',
  fallbacks: {
    document: '/offline', // ناوبری بدون شبکه → صفحه آفلاین اختصاصی
  },
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    navigateFallbackDenylist: [/^\/api\//, /^\/socket\.io\//],
    runtimeCaching: [
      {
        // فونت‌ها (self-host طبق الزام بدون VPN — بدون CDN خارجی)
        urlPattern: /\.(?:woff2?|ttf|otf|eot)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'fistap-fonts',
          expiration: { maxEntries: 8, maxAgeSeconds: 365 * 24 * 3600 },
        },
      },
      {
        // تصاویر استاتیک اپ (آیکون‌ها، لوگو)
        urlPattern: /\.(?:png|jpg|jpeg|webp|svg|gif|ico)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'fistap-images',
          expiration: { maxEntries: 64, maxAgeSeconds: 30 * 24 * 3600 },
        },
      },
      {
        // باندل‌های JS/CSS نکست
        urlPattern: /\/_next\/static\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'fistap-next-static',
          expiration: { maxEntries: 64, maxAgeSeconds: 30 * 24 * 3600 },
        },
      },
      {
        // GET های REST API — NetworkFirst: تازه اگر شد، وگرنه آخرین نسخه کش‌شده
        // (لیست گفتگوها/تاریخچه در حالت آفلاین قابل مشاهده می‌ماند)
        urlPattern: ({ url, request }) =>
          request.method === 'GET' && url.pathname.startsWith('/api/v1/'),
        handler: 'NetworkFirst',
        options: {
          cacheName: 'fistap-api',
          networkTimeoutSeconds: 4,
          expiration: { maxEntries: 128, maxAgeSeconds: 24 * 3600 },
          cacheableResponse: { statuses: [200] },
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@fistap/shared'],
  webpack: (config) => {
    // LL-005: پکیج shared با قرارداد NodeNext ایمپورت‌های ".js" دارد → resolve به ".ts"
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      '.js': ['.ts', '.tsx', '.js'],
    };
    return config;
  },
};

export default withPWA(nextConfig);
