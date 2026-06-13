/** UI-COMP-12 — Typing Indicator (کلاس‌ها و سه نقطه با تاخیرهای 0/150/300ms عیناً از handoff) */
export function TypingIndicator() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3 self-start mr-4 shadow-sm flex items-center gap-1" aria-label="در حال نوشتن">
      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}
