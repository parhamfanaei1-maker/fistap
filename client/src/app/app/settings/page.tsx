'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { Toast } from '@/components/ui/Toast';
import { disablePush, enablePush, fetchPushStatus, isPushSupported } from '@/services/push';
import { logout } from '@/services/auth';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { NavSettingsIcon, UiLogoutIcon } from '@/components/icons';

/**
 * صفحه تنظیمات — page_map.md §3 + page_capabilities.md §3 (Task 4.3)
 * Notification Toggle (Web Push) · تم Light/Dark (mvp_definition) · خروج
 */
export default function SettingsPage() {
  const router = useRouter();
  const { tokens, username, displayName, clearSession } = useAuthStore();
  const { theme, toggleTheme } = useUiStore();
  const [pushOn, setPushOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // وضعیت فعلی اشتراک از سرور
  useEffect(() => {
    if (!tokens) return;
    void fetchPushStatus(tokens.accessToken).then((res) => {
      if (res.ok) setPushOn(res.data.subscribed);
    });
  }, [tokens]);

  // اعمال تم روی <html> — mvp_definition: تم Light/Dark
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const togglePush = async (next: boolean) => {
    if (!tokens || busy) return;
    setBusy(true);
    if (next) {
      const res = await enablePush(tokens.accessToken);
      if (res.ok) {
        setPushOn(true);
        notify('اعلان‌ها فعال شد ✅');
      } else {
        notify(res.reason ?? 'فعال‌سازی ناموفق بود');
      }
    } else {
      await disablePush(tokens.accessToken);
      setPushOn(false);
      notify('اعلان‌ها خاموش شد');
    }
    setBusy(false);
  };

  const signOut = async () => {
    if (tokens) await logout(tokens.refreshToken);
    clearSession();
    router.replace('/auth/welcome');
  };

  return (
    <AppShell>
      <section className="flex-1 h-full overflow-y-auto bg-neutral-100 dark:bg-slate-950 pb-20 md:pb-4">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
          <NavSettingsIcon className="h-5 w-5 text-blue-600" />
          <h1 className="text-base font-bold text-slate-800 dark:text-slate-100">تنظیمات</h1>
        </header>

        <Toast message={toast} />

        <div className="mx-auto w-full max-w-2xl p-4 flex flex-col gap-4">
          {/* پروفایل خلاصه */}
          <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-teal-400 text-lg font-bold text-white">
              {(displayName ?? 'ف').charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                {displayName ?? 'کاربر فیستپ'}
              </p>
              {username ? <p className="text-xs text-slate-400" dir="ltr">@{username}</p> : null}
            </div>
          </div>

          {/* اعلان‌ها — page_capabilities §3: Notification Toggle */}
          <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">اعلان پیام‌های جدید</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {isPushSupported()
                    ? 'دریافت اعلان حتی وقتی فیستپ بسته است'
                    : 'مرورگر شما پشتیبانی نمی‌کند'}
                </p>
              </div>
              <ToggleSwitch
                checked={pushOn}
                disabled={busy || !isPushSupported()}
                onChange={(next) => void togglePush(next)}
                label="اعلان‌ها"
              />
            </div>
          </div>

          {/* تم — mvp_definition: Light/Dark */}
          <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">حالت تاریک</p>
                <p className="mt-0.5 text-xs text-slate-400">تم {theme === 'dark' ? 'تاریک' : 'روشن'} فعال است</p>
              </div>
              <ToggleSwitch checked={theme === 'dark'} onChange={() => toggleTheme()} label="حالت تاریک" />
            </div>
          </div>

          {/* خروج */}
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex items-center justify-center gap-2 rounded-2xl bg-white p-4 text-sm font-bold text-red-500 shadow-sm transition-colors hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-900/10"
          >
            <UiLogoutIcon className="h-4 w-4" />
            خروج از حساب
          </button>
        </div>
      </section>
    </AppShell>
  );
}
