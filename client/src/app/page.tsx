import { redirect } from 'next/navigation';

/** ریشه → جریان ورود (page_map.md §1) */
export default function RootPage() {
  redirect('/auth/welcome');
}
