import { apiFetch } from './api';
import type { ApiResponse } from '@fistap/shared';

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

/** قراردادهای Task 4.3 — Push REST */
export const fetchVapidKey = (token: string): Promise<ApiResponse<{ publicKey: string; enabled: boolean }>> =>
  apiFetch('/push/vapid-public-key', { headers: auth(token) });

export const fetchPushStatus = (token: string): Promise<ApiResponse<{ subscribed: boolean }>> =>
  apiFetch('/push/status', { headers: auth(token) });

const sendSubscription = (token: string, sub: PushSubscriptionJSON): Promise<ApiResponse<{ subscribed: boolean }>> =>
  apiFetch('/push/subscribe', { method: 'POST', headers: auth(token), body: JSON.stringify(sub) });

const sendUnsubscribe = (token: string, endpoint: string): Promise<ApiResponse<{ subscribed: boolean }>> =>
  apiFetch('/push/unsubscribe', { method: 'POST', headers: auth(token), body: JSON.stringify({ endpoint }) });

/** base64url → ArrayBuffer (الزام PushManager.subscribe — TS5.7: Uint8Array دیگر BufferSource سازگار نیست) */
function urlBase64ToArrayBuffer(base64: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  const buffer = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i += 1) view[i] = raw.charCodeAt(i);
  return buffer;
}

export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * فعال‌سازی اعلان‌ها — Task 4.3:
 * مجوز Notification → registration آماده‌ی SW → subscribe با VAPID → ثبت در سرور
 */
export async function enablePush(token: string): Promise<{ ok: boolean; reason?: string }> {
  if (!isPushSupported()) return { ok: false, reason: 'مرورگر شما از اعلان پشتیبانی نمی‌کند' };

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, reason: 'مجوز اعلان داده نشد' };

  const keyRes = await fetchVapidKey(token);
  if (!keyRes.ok || !keyRes.data.enabled) return { ok: false, reason: 'سرویس اعلان فعال نیست' };

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToArrayBuffer(keyRes.data.publicKey),
  });

  const saved = await sendSubscription(token, subscription.toJSON());
  if (!saved.ok) {
    await subscription.unsubscribe();
    return { ok: false, reason: saved.error.message };
  }
  return { ok: true };
}

/** خاموش کردن اعلان‌ها (toggle تنظیمات) */
export async function disablePush(token: string): Promise<void> {
  if (!isPushSupported()) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;
  await sendUnsubscribe(token, subscription.endpoint);
  await subscription.unsubscribe();
}
