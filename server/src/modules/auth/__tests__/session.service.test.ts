import { describe, expect, it, vi } from 'vitest';
import { SessionService } from '../session.service.js';
import { MemorySessionStore } from '../session.store.js';

const USER_ID = 'user-123';

function makeService(refreshTtl = 3600) {
  const signer = { sign: vi.fn((p: { sub: string }) => `jwt-for-${p.sub}`) };
  const service = new SessionService(new MemorySessionStore(), signer, {
    refreshTtlSeconds: refreshTtl,
  });
  return { service, signer };
}

describe('SessionService — Task 1.4 (JWT + Refresh Rotation)', () => {
  it('issues access + refresh tokens', async () => {
    const { service, signer } = makeService();
    const tokens = await service.issueTokens(USER_ID);
    expect(tokens.accessToken).toBe(`jwt-for-${USER_ID}`);
    expect(tokens.refreshToken).toMatch(/^[0-9a-f]{96}$/);
    expect(signer.sign).toHaveBeenCalledWith({ sub: USER_ID });
  });

  it('refresh rotates: old token becomes invalid, new one works', async () => {
    const { service } = makeService();
    const first = await service.issueTokens(USER_ID);

    const rotated = await service.refresh(first.refreshToken);
    expect(rotated.status).toBe('rotated');
    if (rotated.status !== 'rotated') return;
    expect(rotated.userId).toBe(USER_ID);
    expect(rotated.tokens.refreshToken).not.toBe(first.refreshToken);

    // توکن قدیمی پس از چرخش باید باطل باشد (یک‌بارمصرف)
    const replay = await service.refresh(first.refreshToken);
    expect(replay.status).toBe('invalid');

    // توکن جدید همچنان معتبر است
    const second = await service.refresh(rotated.tokens.refreshToken);
    expect(second.status).toBe('rotated');
  });

  it('rejects unknown refresh token', async () => {
    const { service } = makeService();
    expect((await service.refresh('f'.repeat(96))).status).toBe('invalid');
  });

  it('revoke invalidates the session (logout)', async () => {
    const { service } = makeService();
    const tokens = await service.issueTokens(USER_ID);
    await service.revoke(tokens.refreshToken);
    expect((await service.refresh(tokens.refreshToken)).status).toBe('invalid');
  });

  it('expired refresh token is invalid', async () => {
    vi.useFakeTimers();
    const { service } = makeService(2); // TTL = 2s
    const tokens = await service.issueTokens(USER_ID);
    vi.advanceTimersByTime(3000);
    expect((await service.refresh(tokens.refreshToken)).status).toBe('invalid');
    vi.useRealTimers();
  });
});
