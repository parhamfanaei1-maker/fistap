'use client';

import { useEffect, useState } from 'react';
import { usePresenceStore } from '@/store/presenceStore';

/**
 * بنر وضعیت اتصال — Task 4.2 (FEAT-04: محیط با اینترنت ناپایدار)
 * آفلاین مرورگر یا قطع سوکت → بنر زرد «در حال اتصال مجدد...»
 * (reconnection پلکانی سوکت از Task 2.1 خودکار است)
 */
export function ConnectionBanner() {
  const socketConnected = usePresenceStore((s) => s.connected);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  if (online && socketConnected) return null;

  return (
    <div
      role="status"
      className={`fixed top-0 inset-x-0 z-[70] py-1.5 text-center text-xs font-bold text-white ${
        online ? 'bg-amber-500' : 'bg-slate-600'
      }`}
    >
      {online ? 'در حال اتصال مجدد...' : 'آفلاین — پیام‌ها پس از اتصال ارسال می‌شوند'}
    </div>
  );
}
