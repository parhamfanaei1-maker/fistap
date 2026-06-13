import { describe, expect, it } from 'vitest';
import { MemoryPresenceService } from '../presence.service.js';

const USER = 'user-1';

describe('PresenceService — Task 2.1 (شمارنده اتصال چند-دستگاهی)', () => {
  it('first connection brings user online', async () => {
    const p = new MemoryPresenceService();
    expect(await p.connected(USER)).toBe(true);
    expect(await p.isOnline(USER)).toBe(true);
  });

  it('second device does NOT re-announce online', async () => {
    const p = new MemoryPresenceService();
    await p.connected(USER);
    expect(await p.connected(USER)).toBe(false); // قبلاً آنلاین بوده
  });

  it('closing one of two connections keeps user online', async () => {
    const p = new MemoryPresenceService();
    await p.connected(USER);
    await p.connected(USER);
    expect(await p.disconnected(USER)).toBe(false);
    expect(await p.isOnline(USER)).toBe(true);
  });

  it('closing last connection takes user offline', async () => {
    const p = new MemoryPresenceService();
    await p.connected(USER);
    expect(await p.disconnected(USER)).toBe(true);
    expect(await p.isOnline(USER)).toBe(false);
  });

  it('users are independent', async () => {
    const p = new MemoryPresenceService();
    await p.connected('a');
    expect(await p.isOnline('b')).toBe(false);
  });
});
