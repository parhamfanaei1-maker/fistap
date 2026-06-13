'use client';

import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { setPinnedMessage } from '@/services/groups';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { PinnedBar } from './PinnedBar';

/** UI-COMP-04 — Chat Window (کلاس‌ها عیناً از handoff): Header + PinnedBar + Messages + Input */
export function ChatWindow({ mobileVisible }: { mobileVisible: boolean }) {
  const { activeConversationId, setActiveConversation, pinnedByConv, conversations, draftRecipient, setDraftRecipient } =
    useChatStore();
  const tokens = useAuthStore((s) => s.tokens);
  const myId = useAuthStore((s) => s.userId);

  const conv = conversations.find((c) => c._id === activeConversationId);
  const pinned = activeConversationId ? (pinnedByConv[activeConversationId] ?? null) : null;
  /** مجوز آن‌پین آینه‌ی قاعده سرور: خصوصی = همه؛ گروه/کانال = در UI ساده‌سازی (سرور منبع حقیقت 403) */
  const canUnpin = Boolean(conv && myId && (conv.type === 'private' || true));

  const jumpToPinned = () => {
    if (!pinned) return;
    document.querySelector(`[data-mid="${pinned._id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const unpin = () => {
    if (!tokens || !activeConversationId) return;
    void setPinnedMessage(tokens.accessToken, activeConversationId, null);
  };

  return (
    <section
      className={`flex-1 h-full bg-neutral-100 dark:bg-slate-950 flex-col relative ${
        mobileVisible ? 'flex' : 'hidden'
      } md:flex`}
    >
      {activeConversationId ? (
        <>
          <ChatHeader onBack={() => setActiveConversation(null)} />
          {pinned ? (
            <PinnedBar message={pinned} canUnpin={canUnpin} onJump={jumpToPinned} onUnpin={unpin} />
          ) : null}
          <MessageList />
          <MessageInput />
        </>
      ) : draftRecipient ? (
        /* Task 4.1: چت پیش‌نویس از مخاطبین — گفتگو با اولین پیام ساخته می‌شود */
        <>
          <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 px-4 z-10 shrink-0">
            <button type="button" onClick={() => setDraftRecipient(null)} className="md:hidden p-1 text-slate-500" aria-label="بازگشت">
              ←
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center text-white font-bold">
              {draftRecipient.displayName.charAt(0)}
            </div>
            <div>
              <p className="text-base font-bold text-slate-800 dark:text-slate-100">{draftRecipient.displayName}</p>
              <p className="text-xs text-slate-400">گفتگوی جدید</p>
            </div>
          </header>
          <div className="flex-1 flex items-center justify-center">
            <p className="rounded-full bg-white/60 dark:bg-slate-800/60 px-4 py-2 text-sm text-slate-500 dark:text-slate-400 shadow-sm">
              اولین پیام را بفرستید 👋
            </p>
          </div>
          <MessageInput />
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="rounded-full bg-white/60 dark:bg-slate-800/60 px-4 py-2 text-sm text-slate-500 dark:text-slate-400 shadow-sm">
            یک گفتگو را انتخاب کنید
          </p>
        </div>
      )}
    </section>
  );
}
