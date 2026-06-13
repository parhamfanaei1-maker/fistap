'use client';

import type { Message } from '@fistap/shared';
import { UiCloseIcon } from '@/components/icons';

/** UI-COMP-13 — Reply Bar (کلاس‌ها عیناً از handoff) */
export function ReplyBar({ message, onClose }: { message: Message; onClose: () => void }) {
  return (
    <div className="mx-3 mb-2 bg-slate-50 dark:bg-slate-800 border-l-4 border-blue-500 rounded-r-lg p-2 flex items-center gap-2">
      <span className="text-blue-600 text-xs font-bold">پاسخ به</span>
      <span className="text-slate-500 text-xs truncate flex-1">{message.content}</span>
      <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1" aria-label="بستن پاسخ">
        <UiCloseIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
