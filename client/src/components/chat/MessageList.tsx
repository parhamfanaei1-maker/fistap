'use client';

import { useEffect, useRef } from 'react';
import { SOCKET_EVENTS } from '@fistap/shared';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { getSocket } from '@/services/socket';
import { useState } from 'react';
import type { Message } from '@fistap/shared';
import { setPinnedMessage } from '@/services/groups';
import { MessageBubble } from './MessageBubble';
import { DateDivider, dateLabel } from './DateDivider';
import { TypingIndicator } from './TypingIndicator';
import { ForwardModal } from './ForwardModal';

/**
 * UI-COMP-08 — Message List Container (کلاس‌ها عیناً از handoff)
 * - اسکرول خودکار به آخرین پیام
 * - ارسال message:read وقتی آخرین پیام دیگران دیده شد (Task 2.3)
 * - UI-COMP-11 بین روزهای متفاوت · UI-COMP-12 هنگام تایپ طرف مقابل
 */
export function MessageList() {
  const myId = useAuthStore((s) => s.userId);
  const tokens = useAuthStore((s) => s.tokens);
  const { messagesByConv, activeConversationId, typingByConv, setReplyTo } = useChatStore();
  const endRef = useRef<HTMLDivElement>(null);
  const lastReadRef = useRef<string | null>(null);
  const [forwardOf, setForwardOf] = useState<Message | null>(null); // ISS-002

  const messages = activeConversationId ? (messagesByConv[activeConversationId] ?? []) : [];
  const isTyping = activeConversationId ? (typingByConv[activeConversationId] ?? []).length > 0 : false;

  // اسکرول به انتها با پیام جدید/تایپ
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, isTyping]);

  // Task 2.3: علامت «خوانده شد» برای آخرین پیام دیگران
  useEffect(() => {
    if (!activeConversationId) return;
    const lastOther = [...messages].reverse().find((m) => m.senderId !== myId && !m.pending);
    if (!lastOther || lastReadRef.current === lastOther._id) return;
    lastReadRef.current = lastOther._id;
    getSocket()?.emit(SOCKET_EVENTS.MESSAGE_READ, {
      conversationId: activeConversationId,
      messageId: lastOther._id,
    });
  }, [messages, activeConversationId, myId]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth flex flex-col">
      {messages.map((m, i) => {
        const prev = messages[i - 1];
        const newDay = !prev || dateLabel(prev.timestamp) !== dateLabel(m.timestamp);
        return (
          <div key={m.tempId ?? m._id} className="flex flex-col">
            {newDay ? <DateDivider label={dateLabel(m.timestamp)} /> : null}
            <MessageBubble
              message={m}
              isMine={m.senderId === myId}
              onReply={() => setReplyTo(m)}
              onPin={
                !m.pending && tokens && activeConversationId
                  ? () => void setPinnedMessage(tokens.accessToken, activeConversationId, m._id)
                  : undefined
              }
              onForward={!m.pending ? () => setForwardOf(m) : undefined}
            />
          </div>
        );
      })}
      {isTyping ? <TypingIndicator /> : null}
      <div ref={endRef} />
      {forwardOf ? <ForwardModal message={forwardOf} onClose={() => setForwardOf(null)} /> : null}
    </div>
  );
}
