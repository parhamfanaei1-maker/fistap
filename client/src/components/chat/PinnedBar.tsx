'use client';

import type { Message } from '@fistap/shared';
import { UiPinIcon, UiCloseIcon } from '@/components/icons';

/**
 * نوار پیام پین‌شده — Task 3.4 (UI-PIN از implementation_plan.md Task 3.4)
 * بالای MessageList · کلیک = پرش به پیام · دکمه ضربدر = آن‌پین (فقط مجازها)
 */
export function PinnedBar({
  message,
  canUnpin,
  onJump,
  onUnpin,
}: {
  message: Message;
  canUnpin: boolean;
  onJump: () => void;
  onUnpin: () => void;
}) {
  const preview = message.type === 'text' ? message.content : {
    image: '🖼 تصویر', video: '🎬 ویدیو', audio: '🎵 پیام صوتی', file: '📎 فایل',
  }[message.type];

  return (
    <button
      type="button"
      onClick={onJump}
      className="flex w-full items-center gap-2 border-b border-blue-100 bg-blue-50/80 px-4 py-2 text-right backdrop-blur-sm transition-colors hover:bg-blue-100/80 dark:border-slate-800 dark:bg-slate-900/80 dark:hover:bg-slate-800/80"
    >
      <UiPinIcon className="h-4 w-4 shrink-0 text-blue-600" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold text-blue-600">پیام سنجاق‌شده</p>
        <p className="truncate text-xs text-slate-600 dark:text-slate-300">{preview}</p>
      </div>
      {canUnpin ? (
        <span
          role="button"
          tabIndex={0}
          aria-label="برداشتن سنجاق"
          onClick={(e) => {
            e.stopPropagation();
            onUnpin();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.stopPropagation();
              onUnpin();
            }
          }}
          className="p-1 text-slate-400 hover:text-red-500"
        >
          <UiCloseIcon className="h-4 w-4" />
        </span>
      ) : null}
    </button>
  );
}
