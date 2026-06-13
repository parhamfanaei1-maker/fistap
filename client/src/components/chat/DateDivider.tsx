/** UI-COMP-11 — Date Divider (کلاس‌ها عیناً از handoff) */
export function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center my-4">
      <span className="bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-xs font-medium px-3 py-1 rounded-full">
        {label}
      </span>
    </div>
  );
}

/** برچسب فارسی تاریخ: امروز / دیروز / تاریخ کامل */
export function dateLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (same(d, today)) return 'امروز';
  if (same(d, yesterday)) return 'دیروز';
  return d.toLocaleDateString('fa-IR', { day: 'numeric', month: 'long' });
}
