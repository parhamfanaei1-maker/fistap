'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { createConversation } from '@/services/groups';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';

/**
 * مودال ساخت گروه/کانال — Task 3.2 (UI-COMP-20/21 + UI-COMP-18)
 * memberIds: در این تسک با شناسه دستی؛ انتخاب از مخاطبین در Task 4.1 (Contact Picker)
 */
export function CreateGroupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const tokens = useAuthStore((s) => s.tokens);
  const { setConversations, conversations, setActiveConversation } = useChatStore();
  const [title, setTitle] = useState('');
  const [isChannel, setIsChannel] = useState(false);
  const [memberInput, setMemberInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokens) return;
    setError(null);
    setLoading(true);
    const memberIds = memberInput.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
    const res = await createConversation(tokens.accessToken, {
      type: isChannel ? 'channel' : 'group',
      title: title.trim(),
      memberIds,
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    const c = res.data.conversation;
    setConversations([
      {
        _id: c._id,
        type: c.type as 'group' | 'channel',
        participants: c.participants,
        createdAt: c.createdAt,
        lastMessage: null,
        pinnedMessageId: null,
        title: c.title,
        avatarUrl: c.avatarUrl,
      },
      ...conversations,
    ]);
    setActiveConversation(c._id);
    setTitle('');
    setMemberInput('');
    onClose();
  };

  return (
    <Modal open={open} title={isChannel ? 'کانال جدید' : 'گروه جدید'} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p> : null}

        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600 dark:text-slate-300">کانال (فقط ادمین‌ها پیام می‌فرستند)</span>
          <ToggleSwitch checked={isChannel} onChange={setIsChannel} label="نوع گفتگو" />
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={isChannel ? 'نام کانال' : 'نام گروه'}
          maxLength={64}
          required
          className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />

        <div>
          <input
            type="text"
            dir="ltr"
            value={memberInput}
            onChange={(e) => setMemberInput(e.target.value)}
            placeholder="شناسه اعضا (با کاما جدا کنید)"
            className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <p className="mt-1 text-[11px] text-slate-400">انتخاب از مخاطبین در فاز ۴ (Contact Picker) فعال می‌شود</p>
        </div>

        <PrimaryButton type="submit" loading={loading} className="w-full">
          {isChannel ? 'ساخت کانال' : 'ساخت گروه'}
        </PrimaryButton>
      </form>
    </Modal>
  );
}
