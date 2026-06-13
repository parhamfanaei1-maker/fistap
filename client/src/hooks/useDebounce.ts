'use client';

import { useEffect, useState } from 'react';

/** مقدار debounce شده — Task 4.4: جلوگیری از فراخوانی API با هر کلید */
export function useDebounce<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
