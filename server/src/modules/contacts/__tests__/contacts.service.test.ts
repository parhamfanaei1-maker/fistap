import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ContactsService } from '../contacts.service.js';
import { UserModel } from '../../../models/User.js';

let mongod: MongoMemoryServer;
const svc = new ContactsService();
let me: string;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  const [m] = await UserModel.create([
    { phone: '+989120007001', username: 'me_user', displayName: 'خودم' },
    { phone: '+989120007002', username: 'sara', displayName: 'سارا' },
    { phone: '+989120007003', displayName: '' }, // بدون username و نام
  ]);
  me = m!.id;
}, 60_000);

afterAll(async () => { await mongoose.disconnect(); await mongod.stop(); });

describe('ContactsService.match — Task 4.1 (page_capabilities §2)', () => {
  it('matches registered phones in any Iranian format (reuses Task 1.2 normalizer)', async () => {
    const res = await svc.match({
      requesterId: me,
      phones: ['09120007002', '+989120007003', '۰۹۱۲۰۰۰۷۰۰۲', '0912 000-7002'],
    });
    expect(res.matched).toHaveLength(2); // تکراری‌ها یکی شدند
    const sara = res.matched.find((c) => c.username === 'sara');
    expect(sara?.displayName).toBe('سارا');
    expect(res.invalid).toBe(0);
  });

  it('separates not-registered phones for invite list', async () => {
    const res = await svc.match({ requesterId: me, phones: ['09129999999', '09120007002'] });
    expect(res.matched).toHaveLength(1);
    expect(res.notRegistered).toEqual(['+989129999999']);
  });

  it('excludes requester own phone (privacy)', async () => {
    const res = await svc.match({ requesterId: me, phones: ['09120007001'] });
    expect(res.matched).toHaveLength(0);
    expect(res.notRegistered).toHaveLength(0);
  });

  it('counts invalid phones without failing', async () => {
    const res = await svc.match({ requesterId: me, phones: ['abc', '123', '09120007002'] });
    expect(res.invalid).toBe(2);
    expect(res.matched).toHaveLength(1);
  });

  it('caps batch at MATCH_BATCH_LIMIT (500)', async () => {
    const phones = Array.from({ length: 600 }, (_, i) => `0912${String(1000000 + i)}`);
    const res = await svc.match({ requesterId: me, phones });
    expect(res.notRegistered.length).toBeLessThanOrEqual(500);
  });

  it('fallback displayName for user without profile', async () => {
    const res = await svc.match({ requesterId: me, phones: ['09120007003'] });
    expect(res.matched[0]?.displayName).toBe('کاربر فیستپ');
  });
});
