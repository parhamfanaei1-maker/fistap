'use client';

import { BtnNewChatIcon } from '@/components/icons';

/** UI-COMP-16 — Floating Action Button موبایل (کلاس‌ها عیناً از handoff) */
export function Fab({ onClick, label = 'گفتگوی جدید' }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="fixed bottom-20 left-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center z-50 md:hidden"
    >
      <BtnNewChatIcon className="h-6 w-6" />
    </button>
  );
}
