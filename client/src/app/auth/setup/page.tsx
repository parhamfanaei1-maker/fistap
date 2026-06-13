'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Toast } from '@/components/ui/Toast';
import { updateProfile } from '@/services/auth';
import { useAuthStore } from '@/store/authStore';

/**
 * صفحه تکمیل پروفایل — FEAT-01: ایجاد @username در اولین ورود
 * USERNAME_REGEX سمت سرور: شروع با حرف، ۵-۳۲ کاراکتر (حروف/عدد/_)
 */
export default function SetupPage() {
  const router = useRouter();
  const { tokens, phase, setProfile } = useAuthStore();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // فقط کاربرِ تأییدشده اجازه دارد (UF-01)
  useEffect(() => {
    if (phase === 'idle' || !tokens) router.replace('/auth/welcome');
    if (phase === 'authenticated') router.replace('/app/dashboard');
  }, [phase, tokens, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await updateProfile(tokens?.accessToken ?? '', {
      username: username.trim().toLowerCase(),
      displayName: displayName.trim(),
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    setProfile(res.data.username, res.data.displayName);
    router.push('/app/dashboard');
  };

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-gradient-to-b from-blue-50 via-white to-teal-50 p-6 dark:from-dark-background dark:via-dark-background dark:to-dark-surface">
      <Toast message={error} />

      <div className="text-center">
        <h1 className="mb-1 text-2xl font-bold text-neutral-900 dark:text-dark-text">پروفایل خود را بسازید</h1>
        <p className="text-sm text-neutral-500 dark:text-dark-textSecondary">یک قدم تا شروع گفتگو!</p>
      </div>

      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-white/40 bg-white/70 p-6 shadow-xl backdrop-blur-md dark:border-dark-border dark:bg-dark-surface/70"
      >
        <label htmlFor="displayName" className="mb-2 block text-sm font-medium text-neutral-700 dark:text-dark-text">
          نام نمایشی
        </label>
        <input
          id="displayName"
          type="text"
          maxLength={64}
          placeholder="مثلاً: سارا محمدی"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="mb-4 w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-2.5 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-dark-text"
          required
        />

        <label htmlFor="username" className="mb-2 block text-sm font-medium text-neutral-700 dark:text-dark-text">
          نام کاربری
        </label>
        <div dir="ltr" className="relative mb-1">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center font-bold text-neutral-400">@</span>
          <input
            id="username"
            type="text"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
            className="w-full rounded-lg border-2 border-slate-200 bg-white py-2.5 pl-8 pr-4 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-dark-text"
            required
            minLength={5}
            maxLength={32}
          />
        </div>
        <p className="mb-4 text-xs text-neutral-400 dark:text-dark-textMuted">
          با حرف انگلیسی شروع شود · ۵ تا ۳۲ کاراکتر · حروف، عدد و _
        </p>

        <PrimaryButton type="submit" loading={loading} className="w-full">
          شروع گفتگو
        </PrimaryButton>
      </form>
    </main>
  );
}
