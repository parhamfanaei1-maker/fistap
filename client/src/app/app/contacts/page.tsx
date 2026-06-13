'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Toast } from '@/components/ui/Toast';
import {
  buildInviteText, isContactPickerSupported, matchContacts, pickContacts, type MatchData,
} from '@/services/contacts';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { NavContactsIcon, UiShareIcon } from '@/components/icons';

/**
 * صفحه مخاطبین — Task 4.1 (page_map.md §2 + page_capabilities.md §2)
 * Sync: Contact Picker API (اندروید) + fallback ورود دستی · Matching · Invite
 */
export default function ContactsPage() {
  const router = useRouter();
  const tokens = useAuthStore((s) => s.tokens);
  const setDraftRecipient = useChatStore((s) => s.setDraftRecipient);
  const [result, setResult] = useState<MatchData | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const runMatch = async (phones: string[]) => {
    if (!tokens || phones.length === 0) return;
    setLoading(true);
    const res = await matchContacts(tokens.accessToken, phones);
    setLoading(false);
    if (!res.ok) {
      notify(res.error.message);
      return;
    }
    setResult(res.data);
  };

  /** Sync با Contact Picker سیستم‌عامل (page_capabilities §2) */
  const syncFromDevice = async () => {
    const phones = await pickContacts();
    if (phones.length === 0) {
      notify('مخاطبی انتخاب نشد');
      return;
    }
    await runMatch(phones);
  };

  /** Fallback دسکتاپ/iOS: ورود دستی شماره‌ها */
  const syncManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const phones = manualInput.split(/[,\n\s]+/).map((s) => s.trim()).filter(Boolean);
    await runMatch(phones);
  };

  /** شروع چت — حل محدودیت ID دستی تسک 3.2 */
  const startChat = (userId: string, displayName: string) => {
    setDraftRecipient({ userId, displayName });
    router.push('/app/dashboard');
  };

  const invite = async (phone: string) => {
    const text = buildInviteText();
    if (navigator.share) {
      try { await navigator.share({ text }); return; } catch { /* انصراف */ }
    }
    await navigator.clipboard.writeText(text);
    notify(`متن دعوت برای ${phone} کپی شد`);
  };

  return (
    <AppShell>
      <section className="flex-1 h-full overflow-y-auto bg-neutral-100 dark:bg-slate-950 pb-20 md:pb-4">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
          <NavContactsIcon className="h-5 w-5 text-blue-600" />
          <h1 className="text-base font-bold text-slate-800 dark:text-slate-100">مخاطبین</h1>
        </header>

        <Toast message={toast} />

        <div className="mx-auto w-full max-w-2xl p-4">
          {/* Sync */}
          <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
            <h2 className="mb-3 text-sm font-bold text-slate-800 dark:text-slate-100">همگام‌سازی مخاطبین</h2>
            {isContactPickerSupported() ? (
              <PrimaryButton onClick={() => void syncFromDevice()} loading={loading} className="w-full">
                انتخاب از مخاطبین گوشی
              </PrimaryButton>
            ) : (
              <form onSubmit={syncManual} className="flex flex-col gap-3">
                <textarea
                  rows={3}
                  dir="ltr"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="0912xxxxxxx, 0935xxxxxxx"
                  className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <p className="text-[11px] text-slate-400">
                  مرورگر شما Contact Picker ندارد — شماره‌ها را با کاما یا خط جدید وارد کنید
                </p>
                <PrimaryButton type="submit" loading={loading} disabled={!manualInput.trim()} className="w-full">
                  بررسی شماره‌ها
                </PrimaryButton>
              </form>
            )}
          </div>

          {/* نتایج تطبیق */}
          {result ? (
            <>
              <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
                <h2 className="mb-2 text-sm font-bold text-emerald-600">در فیستپ ({result.matched.length})</h2>
                {result.matched.length === 0 ? (
                  <p className="py-3 text-center text-xs text-slate-400">هیچ‌کدام هنوز عضو نیستند</p>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                    {result.matched.map((c) => (
                      <li key={c.userId} className="flex items-center gap-3 py-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-teal-400 font-bold text-white">
                          {c.displayName.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{c.displayName}</p>
                          <p className="text-xs text-slate-400" dir="ltr">{c.username ? `@${c.username}` : c.phone}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => startChat(c.userId, c.displayName)}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
                        >
                          گفتگو
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
                <h2 className="mb-2 text-sm font-bold text-slate-500">دعوت به فیستپ ({result.notRegistered.length})</h2>
                <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                  {result.notRegistered.map((phone) => (
                    <li key={phone} className="flex items-center justify-between py-3">
                      <span className="text-sm text-slate-600 dark:text-slate-300" dir="ltr">{phone}</span>
                      <button
                        type="button"
                        onClick={() => void invite(phone)}
                        className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200"
                      >
                        <UiShareIcon className="h-3.5 w-3.5" /> دعوت
                      </button>
                    </li>
                  ))}
                </ul>
                {result.invalid > 0 ? (
                  <p className="mt-2 text-[11px] text-amber-600">{result.invalid} شماره نامعتبر نادیده گرفته شد</p>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
