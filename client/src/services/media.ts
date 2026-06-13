import { apiFetch } from './api';
import type { ApiResponse, MessageType } from '@fistap/shared';

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

export interface PresignUploadData {
  uploadUrl: string;
  objectKey: string;
  expiresInSeconds: number;
  maxSizeBytes: number;
}

/** تشخیص نوع پیام از MIME — هماهنگ با لیست سفید سرور (Task 3.3) */
export function kindOfFile(file: File): Exclude<MessageType, 'text'> {
  if (/^image\/(jpeg|png|webp|gif)$/.test(file.type)) return 'image';
  if (/^video\/(mp4|webm|quicktime)$/.test(file.type)) return 'video';
  if (/^audio\//.test(file.type)) return 'audio';
  return 'file';
}

export const presignUpload = (
  token: string,
  payload: { kind: string; mime: string; sizeBytes: number; fileName?: string },
): Promise<ApiResponse<PresignUploadData>> =>
  apiFetch('/media/presign-upload', { method: 'POST', headers: auth(token), body: JSON.stringify(payload) });

export const presignDownload = (
  token: string,
  objectKey: string,
): Promise<ApiResponse<{ downloadUrl: string; expiresInSeconds: number }>> =>
  apiFetch('/media/presign-download', { method: 'POST', headers: auth(token), body: JSON.stringify({ objectKey }) });

/**
 * آپلود مستقیم به Storage با presigned URL + گزارش پیشرفت
 * (acceptance_criteria §2: آپلود حجیم بدون توقف برنامه — XHR برای onprogress)
 */
export function uploadToStorage(
  uploadUrl: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<boolean> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
    xhr.onerror = () => resolve(false);
    xhr.send(file);
  });
}
