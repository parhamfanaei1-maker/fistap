'use client';

import { useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { Toast } from '@/components/ui/Toast';
import {
  addMembers, removeMember, setAdmin, updateGroupInfo, type GroupConversation,
} from '@/services/groups';
import { useAuthStore } from '@/store/authStore';
import { UiDeleteIcon, UiAddIcon } from '@/components/icons';

type Role = 'owner' | 'admin' | 'member';

const roleOf = (c: GroupConversation, userId: string): Role | null => {
  if (c.ownerId === userId) return 'owner';
  if (c.admins.includes(userId)) return 'admin';
  if (c.participants.includes(userId)) return 'member';
  return null;
};

const ROLE_LABEL: Record<Role, string> = { owner: 'مالک', admin: 'ادمین', member: 'عضو' };
const ROLE_BADGE: Record<Role, string> = {
  owner: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  member: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

/**
 * پنل مدیریت گروه/کانال — Task 3.2 (page_map.md §3: /app/group-settings/:id)
 * ماتریس مجوزها عیناً از قرارداد Task 3.1 در project_state.md
 */
export function GroupSettingsPanel({
  conversation,
  onUpdated,
}: {
  conversation: GroupConversation;
  onUpdated: (c: GroupConversation) => void;
}) {
  const tokens = useAuthStore((s) => s.tokens);
  const myId = useAuthStore((s) => s.userId);
  const [title, setTitle] = useState(conversation.title ?? '');
  const [addOpen, setAddOpen] = useState(false);
  const [newMembers, setNewMembers] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const myRole = useMemo(() => (myId ? roleOf(conversation, myId) : null), [conversation, myId]);
  const canManage = myRole === 'owner' || myRole === 'admin';

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const run = async (
    fn: () => Promise<
      { ok: true; data: { conversation: GroupConversation } } | { ok: false; error: { code: string; message: string } }
    >,
  ) => {
    if (busy) return;
    setBusy(true);
    const res = await fn();
    setBusy(false);
    if (!res.ok) {
      notify(res.error.message);
      return;
    }
    onUpdated(res.data.conversation);
  };

  if (!tokens || !myId) return null;
  const token = tokens.accessToken;

  return (
    <div className="mx-auto w-full max-w-2xl p-4">
      <Toast message={toast} />

      {/* تغییر نام — admin/owner */}
      <section className="mb-6 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
        <h3 className="mb-3 text-sm font-bold text-slate-800 dark:text-slate-100">
          نام {conversation.type === 'channel' ? 'کانال' : 'گروه'}
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!canManage}
            maxLength={64}
            className="flex-1 rounded-lg border-2 border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          {canManage ? (
            <PrimaryButton
              onClick={() => void run(() => updateGroupInfo(token, conversation._id, title.trim()))}
              disabled={!title.trim() || title.trim() === conversation.title}
            >
              ذخیره
            </PrimaryButton>
          ) : null}
        </div>
      </section>

      {/* اعضا */}
      <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            اعضا ({conversation.participants.length})
          </h3>
          {canManage ? (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20"
            >
              <UiAddIcon className="h-4 w-4" /> افزودن عضو
            </button>
          ) : null}
        </div>

        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
          {conversation.participants.map((pid) => {
            const role = roleOf(conversation, pid) ?? 'member';
            const isSelf = pid === myId;
            /** ماتریس Task 3.1: حذف member توسط admin/owner؛ حذف admin فقط owner؛ owner حذف‌نشدنی */
            const canRemove =
              role !== 'owner' &&
              (isSelf || (canManage && (role !== 'admin' || myRole === 'owner')));
            const canToggleAdmin = myRole === 'owner' && role !== 'owner';

            return (
              <li key={pid} className="flex items-center gap-3 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-teal-400 font-bold text-white">
                  {pid.slice(-2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {isSelf ? 'شما' : `کاربر ${pid.slice(-4)}`}
                  </p>
                  <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${ROLE_BADGE[role]}`}>
                    {ROLE_LABEL[role]}
                  </span>
                </div>

                {canToggleAdmin ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400">ادمین</span>
                    <ToggleSwitch
                      checked={role === 'admin'}
                      disabled={busy}
                      label={`ادمین کردن ${pid.slice(-4)}`}
                      onChange={(next) => void run(() => setAdmin(token, conversation._id, pid, next))}
                    />
                  </div>
                ) : null}

                {canRemove ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void run(() => removeMember(token, conversation._id, pid))}
                    className="p-1.5 text-slate-400 hover:text-red-500"
                    aria-label={isSelf ? 'خروج از گروه' : 'حذف عضو'}
                  >
                    <UiDeleteIcon className="h-4 w-4" />
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      {/* مودال افزودن عضو */}
      <Modal open={addOpen} title="افزودن عضو" onClose={() => setAddOpen(false)}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const ids = newMembers.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
            if (ids.length === 0) return;
            void run(() => addMembers(token, conversation._id, ids)).then(() => {
              setNewMembers('');
              setAddOpen(false);
            });
          }}
          className="flex flex-col gap-3"
        >
          <input
            type="text"
            dir="ltr"
            value={newMembers}
            onChange={(e) => setNewMembers(e.target.value)}
            placeholder="شناسه کاربران (با کاما جدا کنید)"
            className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <PrimaryButton type="submit" loading={busy} className="w-full">افزودن</PrimaryButton>
        </form>
      </Modal>
    </div>
  );
}
