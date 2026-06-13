'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { OtpInput } from '@/components/ui/OtpInput';
import { Toast } from '@/components/ui/Toast';
import { useCountdown } from '@/hooks/useCountdown';
import { requestOtp, verifyOtp } from '@/services/auth';
import { useAuthStore } from '@/store/authStore';

const OTP_TTL = 120; // هماهنگ با OTP_TTL_SECONDS سرور

/**
 * صفحه تایید کد OTP — UI-COMP-15 + تایمر ۱۲۰ ثانیه + ارسال مجدد
 * user_flow.md UF-01: موفق → setup (کاربر جدید) یا dashboard (موجود)
 */
export default function VerifyPage() {
  const router = useRouter();
  const { pendingPhone, setVerified } = useAuthStore();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { expired, label, reset } = useCountdown(OTP_TTL);

  // بدون شماره در جریان؟ برگرد به welcome (DP-02)
  useEffect(() => {
    if (!pendingPhone) router.replace('/auth/welcome');
  }, [pendingPhone, router]);

  const submit = async (value: string = code) => {
    if (value.length !== 5 || loading) return;
    setError(null);
    setLoading(true);
    const res = await verifyOtp(pendingPhone ?? '', value);
    setLoading(false);
    if (!res.ok) {
      setError(res.error.message);
      setCode('');
      return;
    }
    setVerified(res.data.userId, res.data.tokens, res.data.isNewUser);
    router.push(res.data.isNewUser ? '/auth/setup' : '/app/dashboard'); // DP-04
  };

  const resend = async () => {
    setError(null);
    const res = await requestOtp(pendingPhone ?? '');
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    reset(OTP_TTL);
    setCode('');
  };

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-gradient-to-b from-blue-50 via-white to-teal-50 p-6 dark:from-dark-background dark:via-dark-background dark:to-dark-surface">
      <Toast message={error} />

      <div className="text-center">
        <h1 className="mb-1 text-2xl font-bold text-neutral-900 dark:text-dark-text">کد تایید را وارد کنید</h1>
        <p className="text-sm text-neutral-500 dark:text-dark-textSecondary">
          کد ۵ رقمی به <span dir="ltr" className="font-bold">{pendingPhone}</span> ارسال شد
        </p>
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-white/40 bg-white/70 p-6 shadow-xl backdrop-blur-md dark:border-dark-border dark:bg-dark-surface/70">
        <OtpInput value={code} onChange={setCode} onComplete={submit} disabled={loading} />

        <div className="mt-4 text-center text-sm">
          {expired ? (
            <button type="button" onClick={resend} className="font-bold text-brand-blue-600 hover:underline">
              ارسال مجدد کد
            </button>
          ) : (
            <span dir="ltr" className="font-mono text-neutral-400 dark:text-dark-textMuted">{label}</span>
          )}
        </div>

        <PrimaryButton onClick={() => submit()} loading={loading} disabled={code.length !== 5} className="mt-4 w-full">
          تایید و ادامه
        </PrimaryButton>

        <button
          type="button"
          onClick={() => router.replace('/auth/welcome')}
          className="mt-3 w-full text-center text-xs text-neutral-400 hover:text-neutral-600 dark:text-dark-textMuted"
        >
          تغییر شماره موبایل
        </button>
      </div>
    </main>
  );
}
