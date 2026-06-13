'use client';

import { useEffect, useState } from 'react';

/** شمارش معکوس ثانیه‌ای — تایمر ۱۲۰ ثانیه‌ای OTP در /auth/verify */
export function useCountdown(initialSeconds: number) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [seconds > 0]);

  const reset = (value: number = initialSeconds) => setSeconds(value);
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return { seconds, expired: seconds <= 0, label: `${mm}:${ss}`, reset };
}
