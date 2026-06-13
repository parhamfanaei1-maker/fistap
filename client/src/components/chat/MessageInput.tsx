'use client';

import { useRef, useState } from 'react';
import { SOCKET_EVENTS, type MessageSendAck, type MessageType } from '@fistap/shared';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { getSocket } from '@/services/socket';
import { kindOfFile, presignUpload, uploadToStorage } from '@/services/media';
import { ReplyBar } from './ReplyBar';
import { BtnSendIcon, BtnAttachIcon } from '@/components/icons';

/** فاصله بین typing:start ها تا سرور اسپم نشود */
const TYPING_THROTTLE_MS = 2500;

/**
 * UI-COMP-09 — Message Input Area (کلاس‌ها عیناً از handoff) + UI-COMP-13 Reply Bar
 * ارسال خوش‌بین: addPending(tempId) → emit → ack → resolvePending/failPending (قرارداد Task 2.2)
 * typing:start (throttled) هنگام تایپ + typing:stop هنگام ارسال/خالی شدن (قرارداد Task 2.3)
 */
export function MessageInput() {
  const myId = useAuthStore((s) => s.userId);
  const tokens = useAuthStore((s) => s.tokens);
  const {
    activeConversationId, draftRecipient, replyTo, setReplyTo,
    addPending, resolvePending, failPending, setActiveConversation,
  } = useChatStore();
  const [text, setText] = useState('');
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const lastTypingRef = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Task 4.1: یا گفتگوی موجود یا گیرنده‌ی پیش‌نویس از مخاطبین
  if (!activeConversationId && !draftRecipient) return null;
  const convId = activeConversationId ?? `draft-${draftRecipient?.userId}`;

  /** ارسال پیام (متن یا رسانه) با جریان خوش‌بین واحد — Task 2.2/3.3/4.1 */
  const emitMessage = (content: string, type: MessageType) => {
    const socket = getSocket();
    if (!socket || !myId) return;
    const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    addPending(convId, {
      _id: tempId,
      tempId,
      conversationId: convId,
      senderId: myId,
      content,
      type,
      status: 'sent',
      timestamp: new Date().toISOString(),
      replyToId: replyTo?._id ?? null,
      pending: true,
    });
    // پیام اول از مخاطب: با recipientId — سرور گفتگو را خودکار می‌سازد (قرارداد Task 2.2)
    const target = activeConversationId
      ? { conversationId: activeConversationId }
      : { recipientId: draftRecipient?.userId };
    // ISS-001: ارسال replyToId واقعی به سرور (پیش از این فقط در UI خوش‌بین بود)
    socket.emit(
      SOCKET_EVENTS.MESSAGE_SEND,
      { ...target, content, type, tempId, replyToId: replyTo?._id ?? null },
      (ack: MessageSendAck) => {
        if (ack.ok) {
          resolvePending(convId, ack.tempId, ack.message);
          // پس از ساخت گفتگوی واقعی، از حالت پیش‌نویس خارج شو
          if (!activeConversationId) setActiveConversation(ack.message.conversationId);
        } else {
          failPending(convId, ack.tempId);
        }
      },
    );
    setReplyTo(null);
  };

  /** Task 3.3: انتخاب فایل → presign → آپلود مستقیم به Storage → پیام رسانه‌ای */
  const handleFile = async (file: File) => {
    if (!tokens || uploadPercent !== null) return;
    setUploadPercent(0);
    const kind = kindOfFile(file);
    const pres = await presignUpload(tokens.accessToken, {
      kind,
      mime: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      fileName: file.name,
    });
    if (!pres.ok) {
      setUploadPercent(null);
      alert(pres.error.message);
      return;
    }
    const uploaded = await uploadToStorage(pres.data.uploadUrl, file, setUploadPercent);
    setUploadPercent(null);
    if (!uploaded) {
      alert('آپلود ناموفق بود؛ دوباره تلاش کنید');
      return;
    }
    emitMessage(pres.data.objectKey, kind);
  };

  const emitTyping = () => {
    if (!activeConversationId) return; // در حالت پیش‌نویس هنوز گفتگویی نیست (Task 4.1)
    const now = Date.now();
    if (now - lastTypingRef.current < TYPING_THROTTLE_MS) return;
    lastTypingRef.current = now;
    getSocket()?.emit(SOCKET_EVENTS.TYPING_START, { conversationId: activeConversationId });
  };

  const send = () => {
    const content = text.trim();
    const socket = getSocket();
    if (!content || !socket || !myId) return;
    emitMessage(content, 'text');
    if (activeConversationId) socket.emit(SOCKET_EVENTS.TYPING_STOP, { conversationId: activeConversationId });
    lastTypingRef.current = 0;
    setText('');
    textareaRef.current?.focus();
  };

  return (
    <div className="shrink-0">
      {replyTo ? <ReplyBar message={replyTo} onClose={() => setReplyTo(null)} /> : null}
      {uploadPercent !== null ? (
        <div className="mx-3 mb-2 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 dark:bg-blue-900/20">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-blue-100 dark:bg-slate-700">
            <div className="h-full bg-blue-600 transition-all" style={{ width: `${uploadPercent}%` }} />
          </div>
          <span className="text-xs font-bold text-blue-600">{uploadPercent}٪</span>
        </div>
      ) : null}
      <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-3 flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept="image/*,video/*,audio/*,*/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadPercent !== null}
          className="text-slate-400 hover:text-blue-600 cursor-pointer p-1 disabled:opacity-50"
          aria-label="پیوست فایل"
        >
          <BtnAttachIcon className="h-5 w-5" />
        </button>
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          placeholder="پیام خود را بنویسید..."
          onChange={(e) => {
            setText(e.target.value);
            if (e.target.value.trim()) emitTyping();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          className="flex-1 max-h-32 bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-2.5 text-base focus:outline-none resize-none placeholder-slate-400 dark:text-slate-100"
        />
        <button
          type="button"
          onClick={send}
          disabled={!text.trim()}
          className="text-white bg-blue-600 rounded-full p-1.5 hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50"
          aria-label="ارسال"
        >
          <BtnSendIcon className="h-5 w-5 -rotate-90 rtl:rotate-90" />
        </button>
      </div>
    </div>
  );
}
