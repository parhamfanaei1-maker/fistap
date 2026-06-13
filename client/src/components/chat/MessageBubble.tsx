'use client';

import type { PendingMessage } from '@/store/chatStore';
import { MsgSentIcon, MsgDeliveredIcon, MsgReadIcon, UiPinIcon, MsgForwardIcon } from '@/components/icons';
import { MediaContent } from './MediaContent';

interface MessageBubbleProps {
  message: PendingMessage;
  isMine: boolean;
  onReply?: () => void;
  /** Task 3.4: پین کردن این پیام (hover در دسکتاپ) */
  onPin?: () => void;
  /** ISS-002: بازارسال این پیام */
  onForward?: () => void;
}

const timeOf = (iso: string): string =>
  new Date(iso).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

/** تیک وضعیت — آیکون‌های لایه ۲ (msg-sent/delivered/read.svg) · فقط پیام‌های خودم */
function StatusTick({ message }: { message: PendingMessage }) {
  if (message.failed) return <span className="text-[10px] text-red-300">✕ ناموفق</span>;
  if (message.pending) return <span className="text-[10px] opacity-60">🕓</span>;
  if (message.status === 'read') return <MsgReadIcon className="h-4 w-4 text-cyan-300" aria-label="خوانده شد" />;
  if (message.status === 'delivered') return <MsgDeliveredIcon className="h-4 w-4 text-blue-200" aria-label="تحویل شد" />;
  return <MsgSentIcon className="h-4 w-4 text-blue-200" aria-label="ارسال شد" />;
}

/**
 * UI-COMP-10 — Message Bubble (کلاس‌های هر دو variant عیناً از handoff)
 * دابل‌کلیک = Reply (نوار UI-COMP-13)
 */
export function MessageBubble({ message, isMine, onReply, onPin, onForward }: MessageBubbleProps) {
  const bubble = isMine
    ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm px-4 py-2 max-w-[70%] self-end ml-4 shadow-sm'
    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl rounded-bl-sm px-4 py-2 max-w-[70%] self-start mr-4 shadow-sm';

  return (
    <div
      className={`group relative ${bubble} ${message.pending ? 'opacity-70' : ''}`}
      onDoubleClick={onReply}
      data-mid={message._id}
    >
      {onPin || onForward ? (
        <span className={`absolute -top-2 ${isMine ? '-left-2' : '-right-2'} hidden gap-1 group-hover:flex`}>
          {onPin ? (
            <button
              type="button"
              onClick={onPin}
              aria-label="سنجاق کردن پیام"
              className="rounded-full bg-white p-1 text-slate-400 shadow-md hover:text-blue-600 dark:bg-slate-700"
            >
              <UiPinIcon className="h-3.5 w-3.5" />
            </button>
          ) : null}
          {onForward ? (
            <button
              type="button"
              onClick={onForward}
              aria-label="بازارسال پیام"
              className="rounded-full bg-white p-1 text-slate-400 shadow-md hover:text-blue-600 dark:bg-slate-700"
            >
              <MsgForwardIcon className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </span>
      ) : null}
      {message.forwardedFromId ? (
        <p className={`mb-1 text-[10px] italic opacity-70 ${isMine ? 'text-blue-100' : 'text-slate-400'}`}>
          ↪ بازارسال‌شده
        </p>
      ) : null}
      {message.replyToId ? (
        <div className={`mb-1 border-r-2 pr-2 text-xs opacity-70 ${isMine ? 'border-blue-300' : 'border-blue-500'}`}>
          پاسخ به پیام
        </div>
      ) : null}
      {message.type === 'text' ? (
        <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p>
      ) : (
        <MediaContent objectKey={message.content} type={message.type} />
      )}
      <div className="flex items-center justify-end gap-1 mt-1 select-none">
        <span className={`text-[10px] opacity-70 ${isMine ? 'text-blue-200' : 'text-slate-400'}`}>
          {timeOf(message.timestamp)}
        </span>
        {isMine ? <StatusTick message={message} /> : null}
      </div>
    </div>
  );
}
