import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import type { ClientToServerEvents, ServerToClientEvents } from '@fistap/shared';
import { SOCKET_EVENTS } from '@fistap/shared';
import { env } from '../config/env.js';
import { UserModel } from '../models/User.js';
import { createSocketAuthMiddleware, type JwtVerifier } from './auth.middleware.js';
import type { PresenceService } from './presence.service.js';

interface SocketData {
  userId: string;
}

export type FistapIo = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

interface SocketServerDeps {
  verifier: JwtVerifier;
  presence: PresenceService;
  log: { info: (msg: string) => void; warn: (msg: string) => void };
}

/** اتاق شخصی هر کاربر — هر رویداد خطاب به کاربر به این اتاق emit می‌شود */
export const userRoom = (userId: string): string => `user:${userId}`;

/**
 * سرور Socket.io — Task 2.1 (system_architecture.md §1: تمام ارتباطات لحظه‌ای)
 * - احراز هویت JWT در handshake (هیچ اتصال ناشناسی پذیرفته نمی‌شود)
 * - Presence در Redis + رویداد presence:update طبق packages/shared/events.ts
 * - last_seen در MongoDB هنگام آفلاین شدن کامل (database_schema.md §1)
 */
export function createSocketServer(httpServer: HttpServer, deps: SocketServerDeps): FistapIo {
  const io: FistapIo = new Server(httpServer, {
    cors: { origin: env.CORS_ORIGIN, credentials: true },
    // مقاومت در شبکه‌های ناپایدار (FEAT-04): ابتدا polling سپس ارتقا به WS
    transports: ['polling', 'websocket'],
    // ISS-008: سقف صریح payload — پیام متنی ≤4096 char؛ 64KB کافی و ضد DoS
    maxHttpBufferSize: 64 * 1024,
  });

  io.use(createSocketAuthMiddleware(deps.verifier));

  io.on('connection', async (socket) => {
    const userId = socket.data.userId;
    await socket.join(userRoom(userId));

    // --- Presence: اولین اتصالِ کاربر → اعلان آنلاین شدن ---
    const cameOnline = await deps.presence.connected(userId);
    if (cameOnline) {
      deps.log.info(`🟢 presence: ${userId} online`);
      socket.broadcast.emit(SOCKET_EVENTS.PRESENCE_UPDATE, {
        userId,
        online: true,
        lastSeen: new Date().toISOString(),
      });
    }

    // هندلرهای پیام (message:send/read، typing) در Task 2.2 و 2.3 اضافه می‌شوند (قانون گیت)

    socket.on('disconnect', async () => {
      const wentOffline = await deps.presence.disconnected(userId);
      if (!wentOffline) return;

      const lastSeen = new Date();
      deps.log.info(`⚪ presence: ${userId} offline (last_seen=${lastSeen.toISOString()})`);

      // ذخیره last_seen — database_schema.md §1 (فقط وقتی Mongo وصل است)
      if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(userId)) {
        await UserModel.findByIdAndUpdate(userId, { lastSeen }).catch(() => {
          deps.log.warn(`⚠️ failed to persist last_seen for ${userId}`);
        });
      }

      socket.broadcast.emit(SOCKET_EVENTS.PRESENCE_UPDATE, {
        userId,
        online: false,
        lastSeen: lastSeen.toISOString(),
      });
    });
  });

  return io;
}
