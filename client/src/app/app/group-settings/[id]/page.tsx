'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { GroupSettingsPanel } from '@/components/groups/GroupSettingsPanel';
import { fetchConversation, type GroupConversation } from '@/services/groups';
import { useAuthStore } from '@/store/authStore';
import { UiBackIcon } from '@/components/icons';

/**
 * صفحه مدیریت گروه/کانال — page_map.md §3 (Task 3.2)
 * گارد: فقط اعضا (سرور 404/403 برمی‌گرداند)
 */
export default function GroupSettingsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const tokens = useAuthStore((s) => s.tokens);
  const [conversation, setConversation] = useState<GroupConversation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokens || !params.id) return;
    void fetchConversation(tokens.accessToken, params.id).then((res) => {
      if (res.ok) setConversation(res.data.conversation);
      else setError(res.error.message);
    });
  }, [tokens, params.id]);

  return (
    <AppShell>
      <section className="flex-1 h-full overflow-y-auto bg-neutral-100 dark:bg-slate-950 pb-20 md:pb-4">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
          <button type="button" onClick={() => router.back()} className="p-1 text-slate-500" aria-label="بازگشت">
            <UiBackIcon className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold text-slate-800 dark:text-slate-100">
            تنظیمات {conversation?.type === 'channel' ? 'کانال' : 'گروه'}
          </h1>
        </header>

        {error ? (
          <p className="p-6 text-center text-sm text-red-500">{error}</p>
        ) : conversation ? (
          <GroupSettingsPanel conversation={conversation} onUpdated={setConversation} />
        ) : (
          <p className="p-6 text-center text-sm text-slate-400">در حال بارگذاری...</p>
        )}
      </section>
    </AppShell>
  );
}
