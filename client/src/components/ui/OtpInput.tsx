'use client';

import { useRef } from 'react';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
}

const BASE_CLASSES =
  'w-12 h-12 text-center text-xl font-bold bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all';
const FILLED_CLASSES = 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600';

/** تبدیل ارقام فارسی/عربی به لاتین — هماهنگ با نرمال‌سازی سمت سرور (Task 1.2) */
const toLatinDigits = (s: string): string =>
  s
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/\D/g, '');

/**
 * UI-COMP-15 — OTP Input Field (خانه‌های ورودی کد تایید)
 * کلاس‌ها و filled_state عیناً از docs/ui_handoff_prompts.json
 * UX: تایپ → پرش به بعدی · Backspace → برگشت · Paste کل کد پشتیبانی می‌شود
 */
export function OtpInput({ length = 5, value, onChange, onComplete, disabled = false }: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  const commit = (next: string) => {
    onChange(next);
    if (next.length === length) onComplete?.(next);
  };

  const handleChange = (index: number, raw: string) => {
    const clean = toLatinDigits(raw);
    if (!clean) return;
    // پشتیبانی paste چند رقمی از هر خانه‌ای
    const next = (value.slice(0, index) + clean).slice(0, length);
    commit(next);
    refs.current[Math.min(next.length, length - 1)]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = value.slice(0, Math.max(0, index === value.length ? index - 1 : index));
      onChange(next);
      refs.current[Math.max(0, (index === value.length ? index : index + 1) - 1)]?.focus();
    }
  };

  return (
    <div dir="ltr" className="flex items-center justify-center gap-2">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={length}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          aria-label={`رقم ${i + 1} کد تایید`}
          className={`${BASE_CLASSES} ${digit ? FILLED_CLASSES : ''}`}
        />
      ))}
    </div>
  );
}
