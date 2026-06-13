'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ChatListPanel } from '@/components/chat/ChatListPanel';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { CreateGroupModal } from '@/components/groups/CreateGroupModal';
import { Fab } from '@/components/ui/Fab';
import { useChatStore } from '@/store/chatStore';

/**
 * داشبورد — page_map.md §2 (Task 2.4 + 3.2)
 * دسکتاپ: Sidebar + ChatList + ChatWindow کنار هم (UI-COMP-01)
 * موبایل: یا لیست یا پنجره چت + FAB ساخت گفتگو (UI-COMP-16)
 */
export default function DashboardPage() {
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <AppShell>
      <ChatListPanel mobileVisible={!activeConversationId} onCreate={() => setCreateOpen(true)} />
      <ChatWindow mobileVisible={Boolean(activeConversationId)} />
      {!activeConversationId ? <Fab onClick={() => setCreateOpen(true)} /> : null}
      <CreateGroupModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </AppShell>
  );
}
