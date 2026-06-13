'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { useDebounce } from '@/hooks/useDebounce';
import { globalSearch, type SearchData } from '@/services/search';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { NavSearchIcon } from '@/components/icons';

/**
 * صفحه جستجوی جهانی — Task 4.4 (page_map.md §2: /app/search)
 * UI-COMP-05 search input · debounce 350ms · دو بخش: کاربران / گفتگوهای من
 * شروع چت از نتیجه: الگوی draftRecipient (Task 4.1)
 */
export default function SearchPage() {
  const router = useRouter();
  const tokens = useAuthStore((s) => s.tokens);
  const { setDraftRecipient, setActiveConversation } = useChatStore();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query);
  const [result, setResult] = useState<SearchData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (!tokens || q.length < 2) {
      setResult(null);
      return;
    }
    let alive = true;
    setLoading(true);
    void globalSearch(tokens.accessToken, q).then((res) => {
      if (!alive) return;
      setLoading(false);
      if (res.ok) setResult(res.data);
    });
    return () => {
      alive = false;
    };
  }, [debouncedQuery, tokens]);

  const openUser = (userId: string, displayName: string) => {
    setDraftRecipient({ userId, displayName });
    router.push('/app/dashboard');
  };

  const openConversation = (conversationId: string) => {
    setActiveConversation(conversationId);
    router.push('/app/dashboard');
  };

  return (
    <AppShell>
      <section className="flex-1 h-full overflow-y-auto bg-neutral-100 dark:bg-slate-950 pb-20 md:pb-4">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center gap-2">
            <NavSearchIcon className="h-5 w-5 text-blue-600" />
            <h1 className="text-base font-bold text-slate-800 dark:text-slate-100">جستجو</h1>
          </div>
          {/* UI-COMP-05 search_input — کلاس‌ها عیناً از handoff */}
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی @username، نام یا گروه..."
            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400 dark:text-slate-100"
          />
        </header>

        <div className="mx-auto w-full max-w-2xl p-4 flex flex-col gap-4">
          {query.trim().length > 0 && query.trim().length < 2 ? (
            <p className="text-center text-xs text-slate-400">حداقل ۲ کاراکتر وارد کنید</p>
          ) : null}
          {loading ? <p className="text-center text-xs text-slate-400">در حال جستجو...</p> : null}

          {result ? (
            <>
              {/* کاربران */}
              <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
                <h2 className="mb-2 text-sm font-bold text-blue-600">کاربران ({result.users.length})</h2>
                {result.users.length === 0 ? (
                  <p className="py-3 text-center text-xs text-slate-400">کاربری یافت نشد</p>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                    {result.users.map((u) => (
                      <li key={u.userId}>
                        <button
                          type="button"
                          onClick={() => openUser(u.userId, u.displayName)}
                          className="flex w-full items-center gap-3 py-3 text-right transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-teal-400 font-bold text-white">
                            {u.displayName.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                              {u.displayName}
                            </p>
                            {u.username ? (
                              <p className="text-xs text-slate-400" dir="ltr">@{u.username}</p>
                            ) : null}
                          </div>
                          <span className="text-xs font-bold text-blue-600">گفتگو ←</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* گفتگوهای من */}
              <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
                <h2 className="mb-2 text-sm font-bold text-teal-600">گفتگوهای من ({result.conversations.length})</h2>
                {result.conversations.length === 0 ? (
                  <p className="py-3 text-center text-xs text-slate-400">گفتگویی یافت نشد</p>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                    {result.conversations.map((c) => (
                      <li key={c._id}>
                        <button
                          type="button"
                          onClick={() => openConversation(c._id)}
                          className="flex w-full items-center gap-3 py-3 text-right transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 font-bold text-white">
                            {(c.title ?? 'گ').charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                              {c.title ?? 'گفتگو'}
                              <span className="mr-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                                {c.type === 'channel' ? 'کانال' : 'گروه'}
                              </span>
                            </p>
                            {c.lastMessageContent ? (
                              <p className="truncate text-xs text-slate-400">{c.lastMessageContent}</p>
                            ) : null}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
