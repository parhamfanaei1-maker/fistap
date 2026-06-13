'use client';

import { useRouter } from 'next/navigation';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { usePresenceStore } from '@/store/presenceStore';
import { UiBackIcon, NavSettingsIcon } from '@/components/icons';

const lastSeenLabel = (iso?: string): string => {
  if (!iso) return 'آفلاین';
  return `آخرین بازدید ${new Date(iso).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`;
};

/** UI-COMP-07 — Chat Header (کلاس‌ها عیناً از handoff) + وضعیت آنلاین/تایپینگ/LastSeen */
export function ChatHeader({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const myId = useAuthStore((s) => s.userId);
  const { conversations, activeConversationId, typingByConv } = useChatStore();
  const presence = usePresenceStore((s) => s.byUser);

  const conv = conversations.find((c) => c._id === activeConversationId);
  if (!conv) return null;

  const other = conv.participants.find((p) => p !== myId);
  const otherPresence = other ? presence[other] : undefined;
  const isTyping = (typingByConv[conv._id] ?? []).length > 0;
  const title = conv.title ?? (other ? `کاربر ${other.slice(-4)}` : 'گفتگو');

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 z-10 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button type="button" onClick={onBack} className="md:hidden p-1 text-slate-500" aria-label="بازگشت">
          <UiBackIcon className="h-5 w-5" />
        </button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center text-white font-bold shrink-0">
          {title.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="text-base font-bold text-slate-800 dark:text-slate-100 truncate">{title}</p>
          {isTyping ? (
            <p className="text-xs text-emerald-500 font-medium animate-pulse">در حال نوشتن...</p>
          ) : otherPresence?.online ? (
            <p className="text-xs text-emerald-500 font-medium">آنلاین</p>
          ) : (
            <p className="text-xs text-slate-400">{lastSeenLabel(otherPresence?.lastSeen)}</p>
          )}
        </div>
      </div>

      {/* Task 3.2: دسترسی به تنظیمات گروه/کانال (page_map.md §3) */}
      {conv.type !== 'private' ? (
        <button
          type="button"
          onClick={() => router.push(`/app/group-settings/${conv._id}`)}
          className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
          aria-label="تنظیمات گفتگو"
        >
          <NavSettingsIcon className="h-5 w-5" />
        </button>
      ) : null}
    </header>
  );
}
