import { describe, expect, it, vi } from 'vitest';
import type { Socket } from 'socket.io';
import { createSocketAuthMiddleware } from '../auth.middleware.js';

const makeSocket = (token: unknown): Socket =>
  ({ handshake: { auth: { token } }, data: {} }) as unknown as Socket;

describe('Socket auth middleware — Task 2.1', () => {
  const verifier = {
    verify: (token: string) => {
      if (token !== 'valid-jwt') throw new Error('bad token');
      return { sub: 'user-42' };
    },
  };

  it('accepts valid token and injects userId', () => {
    const mw = createSocketAuthMiddleware(verifier);
    const socket = makeSocket('valid-jwt');
    const next = vi.fn();
    mw(socket, next);
    expect(next).toHaveBeenCalledWith(); // بدون خطا
    expect(socket.data.userId).toBe('user-42');
  });

  it.each([
    ['invalid token', 'wrong'],
    ['missing token', undefined],
    ['empty token', ''],
    ['non-string token', 123],
  ])('rejects %s', (_name, token) => {
    const mw = createSocketAuthMiddleware(verifier);
    const next = vi.fn();
    mw(makeSocket(token), next);
    expect(next.mock.calls[0]?.[0]).toBeInstanceOf(Error);
  });
});
