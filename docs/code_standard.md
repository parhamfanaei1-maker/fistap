# 💻 استانداردهای کدنویسی پروژه Fistap

## ۱. ساختار پوشه‌بندی
- `/src/components/ui`: المان‌های کوچک (Atoms) مانند دکمه‌ها.
- `/src/pages`: صفحات اصلی.
- `/src/services`: توابع API و Socket.
- `/src/store`: مدیریت وضعیت با Zustand.

## ۲. قواعد نام‌گذاری
- Components: PascalCase (e.g., `ChatWindow.tsx`).
- Functions/Variables: camelCase (e.g., `sendMessage()`).
- Constants: SCREAMING_SNAKE_CASE.

## ۳. اصول توسعه
- استفاده از TypeScript برای تایپ‌های سخت‌گیرانه.
- استفاده از Tailwind CSS برای استایل‌ها بر اساس `design_tokens.json`.
- رعایت اصل Single Responsibility.
