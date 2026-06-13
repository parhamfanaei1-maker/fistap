'use client';

import { useEffect } from 'react';
import { SOCKET_EVENTS } from '@fistap/shared';
import { connectSocket, disconnectSocket } from '@/services/socket';
import { useAuthStore } from '@/store/authStore';
import { usePresenceStore } from '@/store/presenceStore';

/**
 * اتصال خودکار سوکت پس از ورود — Task 2.1
 * در AppShell (داشبورد) فراخوانی می‌شود؛ خروج/انقضای سشن → قطع اتصال
 */
export function useSocket(): void {
  const tokens = useAuthStore((s) => s.tokens);
  const phase = useAuthStore((s) => s.phase);
  const setConnected = usePresenceStore((s) => s.setConnected);
  const setPresence = usePresenceStore((s) => s.setPresence);

  useEffect(() => {
    if (phase !== 'authenticated' || !tokens) return;

    const socket = connectSocket(tokens.accessToken);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onPresence = (p: { userId: string; online: boolean; lastSeen: string }) =>
      setPresence(p.userId, { online: p.online, lastSeen: p.lastSeen });

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on(SOCKET_EVENTS.PRESENCE_UPDATE, onPresence);
    if (socket.connected) setConnected(true);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off(SOCKET_EVENTS.PRESENCE_UPDATE, onPresence);
      disconnectSocket();
      setConnected(false);
    };
  }, [phase, tokens, setConnected, setPresence]);
}
