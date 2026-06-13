import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthTokens } from '@fistap/shared';

export type AuthPhase = 'idle' | 'otp-sent' | 'verified' | 'authenticated';

interface AuthState {
  /** شماره در جریان ورود (برای /auth/verify) */
  pendingPhone: string | null;
  tokens: AuthTokens | null;
  userId: string | null;
  username: string | null;
  displayName: string | null;
  phase: AuthPhase;
  setOtpSent: (phone: string) => void;
  /** پس از تأیید OTP — Task 1.4 توکن واقعی می‌دهد */
  setVerified: (userId: string, tokens: AuthTokens, isNewUser: boolean) => void;
  setProfile: (username: string, displayName: string) => void;
  setTokens: (tokens: AuthTokens) => void;
  clearSession: () => void;
}

/**
 * وضعیت احراز هویت — Task 1.3 (code_standard.md §1: /src/store با Zustand)
 * persist در localStorage تا رفرش صفحه سشن را از بین نبرد (PWA-friendly)
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      pendingPhone: null,
      tokens: null,
      userId: null,
      username: null,
      displayName: null,
      phase: 'idle',
      setOtpSent: (phone) => set({ pendingPhone: phone, phase: 'otp-sent' }),
      setVerified: (userId, tokens, isNewUser) =>
        set({ userId, tokens, phase: isNewUser ? 'verified' : 'authenticated' }),
      setProfile: (username, displayName) =>
        set({ username, displayName, phase: 'authenticated' }),
      setTokens: (tokens) => set({ tokens }),
      clearSession: () =>
        set({
          pendingPhone: null,
          tokens: null,
          userId: null,
          username: null,
          displayName: null,
          phase: 'idle',
        }),
    }),
    {
      name: 'fistap-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        tokens: s.tokens,
        userId: s.userId,
        username: s.username,
        displayName: s.displayName,
        phase: s.phase,
        pendingPhone: s.pendingPhone,
      }),
    },
  ),
);
