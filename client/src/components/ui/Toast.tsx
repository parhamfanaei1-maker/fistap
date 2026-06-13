'use client';

/**
 * UI-COMP-22 — Toast Notification (اعلان کوتاه‌مدت بالای صفحه)
 * کلاس‌ها عیناً از docs/ui_handoff_prompts.json
 */
export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="fixed top-4 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2 rounded-full shadow-lg text-sm font-medium z-[60]"
    >
      {message}
    </div>
  );
}
