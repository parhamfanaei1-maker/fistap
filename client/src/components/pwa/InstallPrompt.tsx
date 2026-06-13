'use client';

import { useEffect, useState } from 'react';
import { UiCloseIcon } from '@/components/icons';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'fistap-install-dismissed';

const isIos = (): boolean =>
  typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);

const isStandalone = (): boolean =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true));

/**
 * بنر نصب PWA — Task 4.2 (acceptance_criteria §3: «کاربر باید بتواند Install کند»)
 * اندروید/کروم: beforeinstallprompt → دکمه نصب واقعی
 * iOS/سافاری: راهنمای Add to Home Screen (رویداد ندارد)
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISS_KEY)) return;

    if (isIos()) {
      setShowIosGuide(true);
      setVisible(true);
      return;
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === 'accepted') setVisible(false);
    setDeferred(null);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-16 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-blue-100 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-800 md:bottom-4">
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="" className="h-10 w-10 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">نصب فیستپ</p>
          {showIosGuide ? (
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              در سافاری: دکمه <span className="font-bold">اشتراک‌گذاری</span> را بزنید، سپس
              <span className="font-bold"> «Add to Home Screen» </span>را انتخاب کنید.
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              دسترسی سریع از صفحه اصلی گوشی — بدون مرورگر
            </p>
          )}
        </div>
        <button type="button" onClick={dismiss} aria-label="بستن" className="p-1 text-slate-400 hover:text-slate-600">
          <UiCloseIcon className="h-4 w-4" />
        </button>
      </div>
      {!showIosGuide ? (
        <button
          type="button"
          onClick={() => void install()}
          className="mt-3 w-full rounded-lg bg-blue-600 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700 active:scale-[0.98]"
        >
          نصب روی صفحه اصلی
        </button>
      ) : null}
    </div>
  );
}
