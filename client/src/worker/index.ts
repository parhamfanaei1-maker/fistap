/**
 * هندلر سفارشی Service Worker — Task 4.3 (Push Notifications)
 * next-pwa این فایل را با Workbox ادغام می‌کند (قرارداد @ducanh2912/next-pwa: src/worker/index.ts)
 * acceptance_criteria §3: «اعلان‌ها باید در حالت پس‌زمینه دریافت شوند»
 *
 * نکته تایپی: tsconfig کلاینت lib=DOM دارد؛ به جای declare self از cast محلی
 * با تایپ‌های حداقلی استفاده می‌کنیم (LL: تداخل DOM/webworker).
 */

interface FistapPushPayload {
  title: string;
  body: string;
  url: string;
  tag?: string;
}

interface PushEventLike extends ExtendableEvent {
  data: { json: () => unknown } | null;
}

interface NotificationEventLike extends ExtendableEvent {
  notification: { close: () => void; data?: { url?: string } };
}

interface ExtendableEvent extends Event {
  waitUntil: (promise: Promise<unknown>) => void;
}

interface WindowClientLike {
  focus: () => Promise<unknown>;
  navigate?: (url: string) => Promise<unknown>;
}

interface SwSelf {
  addEventListener: (type: string, listener: (event: never) => void) => void;
  registration: {
    showNotification: (title: string, options?: Record<string, unknown>) => Promise<void>;
  };
  clients: {
    matchAll: (opts: { type: string; includeUncontrolled: boolean }) => Promise<WindowClientLike[]>;
    openWindow: (url: string) => Promise<unknown>;
  };
}

const sw = self as unknown as SwSelf;

sw.addEventListener('push', ((event: PushEventLike) => {
  let payload: FistapPushPayload = {
    title: 'فیستپ',
    body: 'پیام جدید دارید',
    url: '/app/dashboard',
  };
  try {
    if (event.data) payload = { ...payload, ...(event.data.json() as FistapPushPayload) };
  } catch {
    /* payload متنی/خراب → پیش‌فرض */
  }

  event.waitUntil(
    sw.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      dir: 'rtl',
      lang: 'fa',
      tag: payload.tag,
      data: { url: payload.url },
    }),
  );
}) as never);

sw.addEventListener('notificationclick', ((event: NotificationEventLike) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/app/dashboard';

  event.waitUntil(
    (async () => {
      const clientList = await sw.clients.matchAll({ type: 'window', includeUncontrolled: true });
      // اگر فیستپ باز است → فوکوس؛ وگرنه پنجره جدید
      const first = clientList[0];
      if (first) {
        await first.focus();
        if (first.navigate) await first.navigate(url);
        return;
      }
      await sw.clients.openWindow(url);
    })(),
  );
}) as never);

export {};
