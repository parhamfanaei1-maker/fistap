'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SOCKET_EVENTS } from '@fistap/shared';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { getSocket } from '@/services/socket';
import { fetchConversations, fetchMessages } from '@/services/chat';
import { SidebarNav } from './SidebarNav';
import { BottomNav } from './BottomNav';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { ConnectionBanner } from '@/components/pwa/ConnectionBanner';

/**
 * UI-COMP-01 — App Shell (کلاس‌ها عیناً از handoff)
 * مسئولیت‌ها: گارد ورود · اتصال سوکت (useSocket) · لود Sidebar · ثبت listener های چت
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { tokens, phase } = useAuthStore();
  const { setConversations, setMessages, addIncoming, applyStatus, setTyping, setPinned, activeConversationId } =
    useChatStore();

  useSocket(); // Task 2.1: اتصال خودکار + presence

  // گارد: بدون سشن → welcome (DP-01)
  useEffect(() => {
    if (phase !== 'authenticated' || !tokens) router.replace('/auth/welcome');
  }, [phase, tokens, router]);

  // لود گفتگوها برای Sidebar (Task 2.2 REST)
  useEffect(() => {
    if (!tokens) return;
    void fetchConversations(tokens.accessToken).then((res) => {
      if (res.ok) setConversations(res.data.conversations);
    });
  }, [tokens, setConversations]);

  // لود تاریخچه گفتگوی فعال
  useEffect(() => {
    if (!tokens || !activeConversationId) return;
    void fetchMessages(tokens.accessToken, activeConversationId).then((res) => {
      if (res.ok) setMessages(activeConversationId, res.data.messages);
    });
  }, [tokens, activeConversationId, setMessages]);

  // listener های لحظه‌ای چت — قراردادهای Task 2.2/2.3
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onNew = addIncoming;
    const onStatus = (p: { conversationId: string; messageId: string; status: 'sent' | 'delivered' | 'read' }) =>
      applyStatus(p.conversationId, p.messageId, p.status);
    const onTyping = (p: { conversationId: string; userId: string; isTyping: boolean }) =>
      setTyping(p.conversationId, p.userId, p.isTyping);
    const onPin = (p: { conversationId: string; pinnedMessage: Parameters<typeof setPinned>[1] }) =>
      setPinned(p.conversationId, p.pinnedMessage);

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, onNew);
    socket.on(SOCKET_EVENTS.MESSAGE_STATUS, onStatus);
    socket.on(SOCKET_EVENTS.TYPING_UPDATE, onTyping);
    socket.on(SOCKET_EVENTS.CONVERSATION_PIN, onPin);
    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, onNew);
      socket.off(SOCKET_EVENTS.MESSAGE_STATUS, onStatus);
      socket.off(SOCKET_EVENTS.TYPING_UPDATE, onTyping);
      socket.off(SOCKET_EVENTS.CONVERSATION_PIN, onPin);
    };
  }, [addIncoming, applyStatus, setTyping, setPinned]);

  return (
    <div className="flex h-screen w-full bg-neutral-50 dark:bg-slate-900 overflow-hidden font-sans text-slate-800 dark:text-slate-100">
      <ConnectionBanner />
      <SidebarNav />
      {children}
      <BottomNav />
      <InstallPrompt />
    </div>
  );
}
