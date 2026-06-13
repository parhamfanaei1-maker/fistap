import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@fistap/shared';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:4000';

export type FistapSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: FistapSocket | null = null;

/**
 * سینگلتون اتصال Socket.io — Task 2.1: احراز هویت JWT در handshake
 * reconnection پلکانی برای شبکه‌های ناپایدار (FEAT-04)
 */
export function connectSocket(token: string): FistapSocket {
  if (socket) {
    // توکن تازه (پس از refresh سشن) → اتصال نو
    socket.auth = { token };
    if (!socket.connected) socket.connect();
    return socket;
  }
  socket = io(WS_URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    auth: { token },
  });
  return socket;
}

export function getSocket(): FistapSocket | null {
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
