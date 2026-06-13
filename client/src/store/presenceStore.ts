import { create } from 'zustand';

export interface PresenceEntry {
  online: boolean;
  lastSeen: string;
}

interface PresenceState {
  /** userId → آخرین وضعیت دریافتی از presence:update */
  byUser: Record<string, PresenceEntry>;
  connected: boolean;
  setConnected: (connected: boolean) => void;
  setPresence: (userId: string, entry: PresenceEntry) => void;
}

/** وضعیت حضور کاربران — تغذیه از رویداد presence:update (Task 2.1) */
export const usePresenceStore = create<PresenceState>((set) => ({
  byUser: {},
  connected: false,
  setConnected: (connected) => set({ connected }),
  setPresence: (userId, entry) =>
    set((s) => ({ byUser: { ...s.byUser, [userId]: entry } })),
}));
