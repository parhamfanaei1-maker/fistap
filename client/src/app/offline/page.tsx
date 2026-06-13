'use client';

import Image from 'next/image';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

/**
 * صفحه آفلاین — Task 4.2 (fallback ناوبری Service Worker)
 * FEAT-04: مکانیزم Retry برای محیط‌های با اینترنت ناپایدار
 */
export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-gradient-to-b from-blue-50 via-white to-teal-50 p-6 text-center dark:from-dark-background dark:via-dark-background dark:to-dark-surface">
      <Image src="/icons/icon-192.png" alt="Fistap" width={80} height={80} className="opacity-60 grayscale" />
      <div>
        <h1 className="mb-2 text-xl font-bold text-slate-800 dark:text-dark-text">اتصال اینترنت برقرار نیست</h1>
        <p className="text-sm leading-6 text-slate-500 dark:text-dark-textSecondary">
          فیستپ به محض وصل شدن اینترنت، خودکار ادامه می‌دهد.
          <br />
          پیام‌های کش‌شده همچنان قابل مشاهده‌اند.
        </p>
      </div>
      <PrimaryButton onClick={() => window.location.reload()}>تلاش دوباره</PrimaryButton>
    </main>
  );
}
