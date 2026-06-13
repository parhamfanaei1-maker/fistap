import { apiFetch } from './api';
import type { ApiResponse, AuthTokens } from '@fistap/shared';

export interface OtpRequestData { phone: string; ttlSeconds: number; }
export interface OtpVerifyData {
  verified: boolean;
  userId: string;
  isNewUser: boolean;
  tokens: AuthTokens;
}
export interface MeData {
  userId: string;
  phone: string | null;
  username: string | null;
  displayName: string;
}
export interface ProfileData { userId: string; username: string; displayName: string; }

/** قراردادها مطابق docs/project_state.md (Task 1.2/1.4 API Contract) */
export const requestOtp = (phone: string): Promise<ApiResponse<OtpRequestData>> =>
  apiFetch('/auth/otp/request', { method: 'POST', body: JSON.stringify({ phone }) });

export const verifyOtp = (phone: string, code: string): Promise<ApiResponse<OtpVerifyData>> =>
  apiFetch('/auth/otp/verify', { method: 'POST', body: JSON.stringify({ phone, code }) });

export const refreshSession = (refreshToken: string): Promise<ApiResponse<{ tokens: AuthTokens }>> =>
  apiFetch('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) });

export const logout = (refreshToken: string): Promise<ApiResponse<{ loggedOut: boolean }>> =>
  apiFetch('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) });

export const fetchMe = (accessToken: string): Promise<ApiResponse<MeData>> =>
  apiFetch('/auth/me', { headers: { Authorization: `Bearer ${accessToken}` } });

export const updateProfile = (
  accessToken: string,
  payload: { username: string; displayName: string },
): Promise<ApiResponse<ProfileData>> =>
  apiFetch('/users/profile', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload),
  });
