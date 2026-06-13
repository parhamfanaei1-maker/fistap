'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Toast } from '@/components/ui/Toast';
import { requestOtp } from '@/services/auth';
import { useAuthStore } from '@/store/authStore';

/**
 * صفحه ورود شماره تلفن — page_map.md §1 / user_flow.md UF-01
 * UI-COMP-14 (Primary Button) + توکن‌های برند (brand-blue / glassmorphism ملایم)
 */
export default function WelcomePage() {
  const router = useRouter();
  const setOtpSent = useAuthStore((s) => s.setOtpSent);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await requestOtp(phone.trim());
    setLoading(false);
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    setOtpSent(res.data.phone);
    router.push('/auth/verify');
  };

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-gradient-to-b from-blue-50 via-white to-teal-50 p-6 dark:from-dark-background dark:via-dark-background dark:to-dark-surface">
      <Toast message={error} />

      <div className="flex flex-col items-center gap-3">
        <Image src="/icons/icon-192.png" alt="Fistap" width={96} height={96} priority className="drop-shadow-lg" />
        <h1 className="text-3xl font-bold text-brand-blue-700 dark:text-brand-blue-300">فیستپ</h1>
        <p className="text-sm text-neutral-500 dark:text-dark-textSecondary">پیام‌رسان سریع و امن</p>
      </div>

      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-white/40 bg-white/70 p-6 shadow-xl backdrop-blur-md dark:border-dark-border dark:bg-dark-surface/70"
      >
        <label htmlFor="phone" className="mb-2 block text-sm font-medium text-neutral-700 dark:text-dark-text">
          شماره موبایل
        </label>
        <input
          id="phone"
          dir="ltr"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0912 123 4567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mb-4 w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-2.5 text-center text-lg outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-dark-text"
          required
        />
        <PrimaryButton type="submit" loading={loading} className="w-full">
          دریافت کد تایید
        </PrimaryButton>
        <p className="mt-4 text-center text-xs leading-5 text-neutral-400 dark:text-dark-textMuted">
          با ادامه، شرایط استفاده و حریم خصوصی فیستپ را می‌پذیرید.
        </p>
      </form>
    </main>
  );
}
