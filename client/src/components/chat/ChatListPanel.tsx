'use client';

import { useMemo, useState } from 'react';
import { useChatStore, type ConversationSummary } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { usePresenceStore } from '@/store/presenceStore';

const timeOf = (iso: string): string =>
  new Date(iso).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

/** نام نمایشی گفتگو: عنوان گروه/کانال یا «گفتگوی خصوصی» (نام کاربر در فاز ۳ با users API غنی می‌شود) */
function convTitle(c: ConversationSummary, myId: string | null): string {
  if (c.title) return c.title;
  const other = c.participants.find((p) => p !== myId);
  return other ? `کاربر ${other.slice(-4)}` : 'گفتگو';
}

/** UI-COMP-06 — Chat List Item (کلاس‌ها + active_state عیناً از handoff) */
function ChatListItem({ conv, active, onSelect }: { conv: ConversationSummary; active: boolean; onSelect: () => void }) {
  const myId = useAuthStore((s) => s.userId);
  const presence = usePresenceStore((s) => s.byUser);
  const other = conv.participants.find((p) => p !== myId);
  const online = other ? presence[other]?.online : false;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-right flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors border-b border-slate-50 dark:border-slate-800/50 ${
        active ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-r-blue-600' : ''
      }`}
    >
      {/* UI-COMP-19: آواتار با نشانگر وضعیت */}
      <div className="relative w-12 h-12 shrink-0">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center text-white font-bold">
          {convTitle(conv, myId).charAt(0)}
        </div>
        {online ? (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold text-slate-800 dark:text-slate-100 truncate">{convTitle(conv, myId)}</p>
        <p className="text-sm text-slate-500 truncate mt-0.5">{conv.lastMessage?.content ?? 'بدون پیام'}</p>
      </div>
      <div className="flex flex-col items-end shrink-0">
        <span className="text-xs text-slate-400 dark:text-slate-500 mb-1">
          {conv.lastMessage ? timeOf(conv.lastMessage.timestamp) : ''}
        </span>
      </div>
    </button>
  );
}

/** UI-COMP-03 + UI-COMP-05 — Chat List Panel با هدر و جستجو (کلاس‌ها عیناً از handoff) */
export function ChatListPanel({ mobileVisible, onCreate }: { mobileVisible: boolean; onCreate?: () => void }) {
  const { conversations, activeConversationId, setActiveConversation } = useChatStore();
  const [query, setQuery] = useState('');
  const myId = useAuthStore((s) => s.userId);

  const filtered = useMemo(
    () =>
      query.trim()
        ? conversations.filter(
            (c) =>
              convTitle(c, myId).includes(query.trim()) ||
              (c.lastMessage?.content ?? '').includes(query.trim()),
          )
        : conversations,
    [conversations, query, myId],
  );

  return (
    <aside
      className={`w-full md:w-[360px] h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex-col z-10 ${
        mobileVisible ? 'flex' : 'hidden'
      } md:flex`}
    >
      {/* UI-COMP-05 */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">گفتگوها</h2>
          {onCreate ? (
            <button
              type="button"
              onClick={onCreate}
              className="hidden md:block rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20"
            >
              + جدید
            </button>
          ) : null}
        </div>
        <input
          type="search"
          placeholder="جستجو..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400 dark:text-slate-100"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-400">گفتگویی یافت نشد</p>
        ) : (
          filtered.map((c) => (
            <ChatListItem
              key={c._id}
              conv={c}
              active={c._id === activeConversationId}
              onSelect={() => setActiveConversation(c._id)}
            />
          ))
        )}
      </div>
    </aside>
  );
}
