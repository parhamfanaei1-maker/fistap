import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import webpush from 'web-push';
import { PushService, PushSubscriptionModel } from '../push.service.js';
import { UserModel } from '../../../models/User.js';

let mongod: MongoMemoryServer;
let userA: string;
let userB: string;

const SUB_1 = { endpoint: 'https://push.example/sub-1', keys: { p256dh: 'k'.repeat(20), auth: 'a'.repeat(16) } };
const SUB_2 = { endpoint: 'https://push.example/sub-2', keys: { p256dh: 'k'.repeat(20), auth: 'a'.repeat(16) } };

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  const [a, b] = await UserModel.create([{ phone: '+989120006001' }, { phone: '+989120006002' }]);
  userA = a!.id; userB = b!.id;
}, 60_000);

afterAll(async () => { await mongoose.disconnect(); await mongod.stop(); });
beforeEach(async () => {
  await PushSubscriptionModel.deleteMany({});
  vi.restoreAllMocks();
});

describe('PushService — Task 4.3 (Web Push)', () => {
  it('generates VAPID keys in dev when env is empty', () => {
    const logs: string[] = [];
    const svc = new PushService({ info: (m) => logs.push(m), warn: () => undefined });
    expect(svc.publicKey.length).toBeGreaterThan(20);
    expect(logs.some((l) => l.includes('VAPID'))).toBe(true);
  });

  it('subscribe upserts by endpoint (re-subscribe same device = no duplicate)', async () => {
    const svc = new PushService();
    await svc.subscribe(userA, SUB_1);
    await svc.subscribe(userA, SUB_1);
    expect(await PushSubscriptionModel.countDocuments()).toBe(1);
    expect(await svc.hasSubscription(userA)).toBe(true);
    expect(await svc.hasSubscription(userB)).toBe(false);
  });

  it('sendToUser pushes to all devices of that user only', async () => {
    const svc = new PushService();
    await svc.subscribe(userA, SUB_1);
    await svc.subscribe(userA, SUB_2);
    await svc.subscribe(userB, { ...SUB_1, endpoint: 'https://push.example/sub-b' });

    const sent: string[] = [];
    vi.spyOn(webpush, 'sendNotification').mockImplementation(async (sub) => {
      sent.push((sub as { endpoint: string }).endpoint);
      return { statusCode: 201, body: '', headers: {} };
    });

    const count = await svc.sendToUser(userA, { title: 't', body: 'b', url: '/app/dashboard' });
    expect(count).toBe(2);
    expect(sent.sort()).toEqual([SUB_1.endpoint, SUB_2.endpoint].sort());
  });

  it('removes dead subscriptions on 410 Gone', async () => {
    const svc = new PushService();
    await svc.subscribe(userA, SUB_1);
    vi.spyOn(webpush, 'sendNotification').mockRejectedValue(
      Object.assign(new Error('gone'), { statusCode: 410 }),
    );
    const count = await svc.sendToUser(userA, { title: 't', body: 'b', url: '/' });
    expect(count).toBe(0);
    expect(await PushSubscriptionModel.countDocuments()).toBe(0); // پاکسازی خودکار
  });

  it('unsubscribe removes only own endpoint', async () => {
    const svc = new PushService();
    await svc.subscribe(userA, SUB_1);
    await svc.unsubscribe(userB, SUB_1.endpoint); // کاربر دیگر — نباید حذف شود
    expect(await PushSubscriptionModel.countDocuments()).toBe(1);
    await svc.unsubscribe(userA, SUB_1.endpoint);
    expect(await PushSubscriptionModel.countDocuments()).toBe(0);
  });
});
