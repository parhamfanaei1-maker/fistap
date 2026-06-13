import type { ApiResponse } from '@fistap/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/** فراخوانی REST تایپ‌سیف با مکانیزم Retry (FEAT-04: اینترنت ناپایدار) */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
  retries = 2,
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_URL}/api/v1${path}`, {
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      credentials: 'include',
      ...init,
    });
    return (await res.json()) as ApiResponse<T>;
  } catch (err) {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, 1000));
      return apiFetch<T>(path, init, retries - 1);
    }
    return { ok: false, error: { code: 'NETWORK_ERROR', message: 'اتصال برقرار نشد' } };
  }
}
