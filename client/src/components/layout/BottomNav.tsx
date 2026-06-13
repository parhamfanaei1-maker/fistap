'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  NavChatsIcon, NavContactsIcon, NavSearchIcon, NavSettingsIcon, NavProfileIcon,
} from '@/components/icons';

const NAV_ITEMS = [
  { href: '/app/dashboard', label: 'گفتگوها', Icon: NavChatsIcon },
  { href: '/app/contacts', label: 'مخاطبین', Icon: NavContactsIcon },
  { href: '/app/search', label: 'جستجو', Icon: NavSearchIcon },
  { href: '/app/settings', label: 'تنظیمات', Icon: NavSettingsIcon },
  { href: '/app/profile/me', label: 'پروفایل', Icon: NavProfileIcon },
] as const;

/** UI-COMP-17 — Bottom Navigation موبایل، ۵ آیتم (کلاس‌ها عیناً از handoff + safe-area) */
export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="h-14 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around fixed bottom-0 w-full z-40 pb-[env(safe-area-inset-bottom)] md:hidden">
      {NAV_ITEMS.map(({ href, label, Icon }) => (
        <button
          key={href}
          type="button"
          onClick={() => router.push(href)}
          className={`flex flex-col items-center gap-0.5 p-2 transition-colors ${
            pathname === href ? 'text-blue-600' : 'text-slate-400 hover:text-blue-600 active:text-blue-700'
          }`}
        >
          <Icon className="h-5 w-5" />
          <span className="text-[10px]">{label}</span>
        </button>
      ))}
    </nav>
  );
}
