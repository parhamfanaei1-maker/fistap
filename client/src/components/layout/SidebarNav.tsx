'use client';

import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  NavChatsIcon, NavContactsIcon, NavSearchIcon, NavSettingsIcon, NavProfileIcon,
} from '@/components/icons';

const ITEM =
  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-800 cursor-pointer transition-all duration-150 w-full text-right';
const ACTIVE = 'bg-blue-50 text-blue-600 font-semibold dark:bg-blue-900/20';

const NAV_ITEMS = [
  { href: '/app/dashboard', label: 'گفتگوها', Icon: NavChatsIcon },
  { href: '/app/contacts', label: 'مخاطبین', Icon: NavContactsIcon },
  { href: '/app/search', label: 'جستجو', Icon: NavSearchIcon },
  { href: '/app/settings', label: 'تنظیمات', Icon: NavSettingsIcon },
] as const;

/** UI-COMP-02 — Sidebar Navigation دسکتاپ (کلاس‌ها + active_state عیناً از handoff) */
export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="w-[280px] h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex-col z-20 hidden md:flex p-4 gap-1">
      <div className="mb-4 flex items-center gap-2 px-2">
        <Image src="/icons/icon-192.png" alt="Fistap" width={36} height={36} />
        <span className="text-lg font-bold text-brand-blue-700 dark:text-brand-blue-300">فیستپ</span>
      </div>
      {NAV_ITEMS.map(({ href, label, Icon }) => (
        <button
          key={href}
          type="button"
          onClick={() => router.push(href)}
          className={`${ITEM} ${pathname === href ? ACTIVE : ''}`}
        >
          <Icon className="h-5 w-5 shrink-0" />
          <span className="text-sm">{label}</span>
        </button>
      ))}
      <div className="mt-auto">
        <button type="button" onClick={() => router.push('/app/profile/me')} className={ITEM}>
          <NavProfileIcon className="h-5 w-5 shrink-0" />
          <span className="text-sm">پروفایل من</span>
        </button>
      </div>
    </nav>
  );
}
