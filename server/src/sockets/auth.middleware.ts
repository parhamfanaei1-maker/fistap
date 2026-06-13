import type { Socket } from 'socket.io';

export interface JwtVerifier {
  /** تأیید JWT — توسط @fastify/jwt تزریق می‌شود (همان سکرت REST) */
  verify(token: string): { sub: string };
}

/**
 * میدل‌ور احراز هویت Socket.io — Task 2.1
 * توکن از socket.handshake.auth.token (مطابق client/services/socket.ts از Task 1.1)
 * احراز ناموفق = اتصال رد می‌شود (هیچ سوکت ناشناسی وارد نمی‌شود)
 */
export function createSocketAuthMiddleware(verifier: JwtVerifier) {
  return (socket: Socket, next: (err?: Error) => void): void => {
    const token = (socket.handshake.auth as { token?: unknown }).token;
    if (typeof token !== 'string' || token.length === 0) {
      next(new Error('UNAUTHORIZED'));
      return;
    }
    try {
      const payload = verifier.verify(token);
      socket.data.userId = payload.sub;
      next();
    } catch {
      next(new Error('UNAUTHORIZED'));
    }
  };
}
