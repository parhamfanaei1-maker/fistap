'use client';

import { useState } from 'react';
import type { Message } from '@fistap/shared';
import { SOCKET_EVENTS, type MessageSendAck } from '@fistap/shared';
import { Modal } from '@/components/ui/Modal';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { getSocket } from '@/services/socket';

/**
 * مودال فوروارد — ISS-002 (FEAT-02 Forward)
 * انتخاب گفتگوی مقصد از Sidebar → ارسال با forwardedFromId (اعتبارسنجی دسترسی در سرور)
 */
export function ForwardModal({ message, onClose }: { message: Message | null; onClose: () => void }) {
  const { conversations, addIncoming } = useChatStore();
  const myId = useAuthStore((s) => s.userId);
  const [sending, setSending] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());

  if (!message) return null;

  const forwardTo = (conversationId: string) => {
    const socket = getSocket();
    if (!socket || sending) return;
    setSending(conversationId);
    socket.emit(
      SOCKET_EVENTS.MESSAGE_SEND,
      {
        conversationId,
        content: message.content,
        type: message.type,
        tempId: `fwd-${Date.now()}`,
        forwardedFromId: message._id,
      },
      (ack: MessageSendAck) => {
        setSending(null);
        if (ack.ok) {
          addIncoming(ack.message);
          setDone((prev) => new Set(prev).add(conversationId));
        }
      },
    );
  };

  const titleOf = (c: (typeof conversations)[number]): string => {
    if (c.title) return c.title;
    const other = c.participants.find((p) => p !== myId);
    return other ? `کاربر ${other.slice(-4)}` : 'گفتگو';
  };

  return (
    <Modal open title="بازارسال به..." onClose={onClose}>
      {conversations.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-400">گفتگویی ندارید</p>
      ) : (
        <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-700">
          {conversations.map((c) => (
            <li key={c._id}>
              <button
                type="button"
                disabled={sending !== null || done.has(c._id)}
                onClick={() => forwardTo(c._id)}
                className="flex w-full items-center gap-3 py-3 text-right transition-colors hover:bg-slate-50 disabled:opacity-60 dark:hover:bg-slate-700/40"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-teal-400 text-sm font-bold text-white">
                  {titleOf(c).charAt(0)}
                </div>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {titleOf(c)}
                </span>
                <span className="text-xs font-bold text-blue-600">
                  {done.has(c._id) ? '✓ ارسال شد' : sending === c._id ? '...' : 'ارسال'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
