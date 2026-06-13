'use client';

import type { ButtonHTMLAttributes } from 'react';

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

/**
 * UI-COMP-14 — Primary Button (دکمه اصلی فراخوان: ادامه، ورود، ارسال)
 * کلاس‌ها عیناً از docs/ui_handoff_prompts.json
 */
export function PrimaryButton({ loading = false, disabled, children, className = '', ...rest }: PrimaryButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          لطفاً صبر کنید…
        </span>
      ) : (
        children
      )}
    </button>
  );
}
