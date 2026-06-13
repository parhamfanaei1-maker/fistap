import { apiFetch } from './api';
import type { ApiResponse } from '@fistap/shared';

export interface MatchedContact {
  phone: string;
  userId: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
}

export interface MatchData {
  matched: MatchedContact[];
  notRegistered: string[];
  invalid: number;
}

/** قرارداد Task 4.1 — POST /contacts/match */
export const matchContacts = (token: string, phones: string[]): Promise<ApiResponse<MatchData>> =>
  apiFetch('/contacts/match', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ phones }),
  });

/** Contact Picker API — فقط Chrome/Edge اندروید (HTTPS) · سایرین → fallback دستی */
interface ContactPickerResult { tel?: string[]; name?: string[]; }
interface NavigatorWithContacts extends Navigator {
  contacts?: { select: (props: string[], opts?: { multiple?: boolean }) => Promise<ContactPickerResult[]> };
}

export function isContactPickerSupported(): boolean {
  return typeof navigator !== 'undefined' && 'contacts' in navigator && 'select' in ((navigator as NavigatorWithContacts).contacts ?? {});
}

/** فراخوانی Contact Picker سیستم‌عامل — خروجی: لیست شماره‌های خام */
export async function pickContacts(): Promise<string[]> {
  const nav = navigator as NavigatorWithContacts;
  if (!nav.contacts) return [];
  try {
    const picked = await nav.contacts.select(['tel'], { multiple: true });
    return picked.flatMap((c) => c.tel ?? []);
  } catch {
    return []; // کاربر انصراف داد
  }
}

/** لینک دعوت — page_capabilities.md §2: Invite */
export function buildInviteText(): string {
  const url = typeof window !== 'undefined' ? window.location.origin : 'https://fistap.example';
  return `سلام! من در فیستپ هستم — پیام‌رسان سریع و امن. شما هم بیایید: ${url}`;
}
