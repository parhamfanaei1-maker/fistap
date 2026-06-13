import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { MessageService } from '../message.service.js';
import { ConversationModel } from '../../../models/Conversation.js';
import { MessageModel } from '../../../models/Message.js';
import { UserModel } from '../../../models/User.js';

let mongod: MongoMemoryServer;
const service = new MessageService();
let alice: string;
let bob: string;
let carol: string;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  const [a, b, c] = await UserModel.create([
    { phone: '+989121110001' },
    { phone: '+989121110002' },
    { phone: '+989121110003' },
  ]);
  alice = a!.id; bob = b!.id; carol = c!.id;
}, 60_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await ConversationModel.deleteMany({});
  await MessageModel.deleteMany({});
});

/** کمکی: گفتگوی A→B با n پیام از A */
async function seed(n: number): Promise<{ convId: string; ids: string[] }> {
  const ids: string[] = [];
  let convId = '';
  for (let i = 0; i < n; i++) {
    const r = await service.send({ senderId: alice, recipientId: bob, content: `m${i + 1}`, type: 'text' });
    if (!r.ok) throw new Error('seed failed');
    convId = r.message.conversationId;
    ids.push(r.message._id);
  }
  return { convId, ids };
}

describe('MessageService.markDelivered — Task 2.3 (تیک دوم)', () => {
  it('upgrades sent→delivered only for messages from others', async () => {
    const { convId, ids } = await seed(2);
    const res = await service.markDelivered({ userId: bob, conversationId: convId });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.updated.map((u) => u.messageId).sort()).toEqual([...ids].sort());
    expect(res.updated.every((u) => u.senderId === alice)).toBe(true);

    const docs = await MessageModel.find({});
    expect(docs.every((d) => d.status === 'delivered')).toBe(true);
  });

  it('is idempotent (second call updates nothing)', async () => {
    const { convId } = await seed(1);
    await service.markDelivered({ userId: bob, conversationId: convId });
    const second = await service.markDelivered({ userId: bob, conversationId: convId });
    if (second.ok) expect(second.updated).toHaveLength(0);
  });

  it('sender own messages are NOT delivered to self', async () => {
    const { convId } = await seed(1);
    const res = await service.markDelivered({ userId: alice, conversationId: convId });
    if (res.ok) expect(res.updated).toHaveLength(0);
  });

  it('denies non-member (security)', async () => {
    const { convId } = await seed(1);
    const res = await service.markDelivered({ userId: carol, conversationId: convId });
    expect(res.ok).toBe(false);
  });
});

describe('MessageService.markRead — Task 2.3 (تیک خوانده شدن)', () => {
  it('marks all messages up to anchor as read (sent or delivered)', async () => {
    const { convId, ids } = await seed(3);
    await service.markDelivered({ userId: bob, conversationId: convId }); // همه delivered

    // خواندن تا پیام دوم
    const res = await service.markRead({ userId: bob, conversationId: convId, upToMessageId: ids[1]! });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.updated.map((u) => u.messageId).sort()).toEqual([ids[0]!, ids[1]!].sort());

    const m3 = await MessageModel.findById(ids[2]);
    expect(m3!.status).toBe('delivered'); // پیام سوم هنوز خوانده نشده
  });

  it('status never goes backwards (read stays read)', async () => {
    const { convId, ids } = await seed(1);
    await service.markRead({ userId: bob, conversationId: convId, upToMessageId: ids[0]! });
    // delivered پس از read نباید چیزی را تغییر دهد
    const res = await service.markDelivered({ userId: bob, conversationId: convId });
    if (res.ok) expect(res.updated).toHaveLength(0);
    const doc = await MessageModel.findById(ids[0]);
    expect(doc!.status).toBe('read');
  });

  it('rejects anchor from another conversation', async () => {
    const { convId } = await seed(1);
    const other = await service.send({ senderId: alice, recipientId: carol, content: 'x', type: 'text' });
    if (!other.ok) throw new Error('setup');
    const res = await service.markRead({ userId: bob, conversationId: convId, upToMessageId: other.message._id });
    expect(res.ok).toBe(false);
  });

  it('denies non-member (security)', async () => {
    const { convId, ids } = await seed(1);
    const res = await service.markRead({ userId: carol, conversationId: convId, upToMessageId: ids[0]! });
    expect(res.ok).toBe(false);
  });
});

describe('isMember / otherParticipants — Task 2.3 (پایه typing)', () => {
  it('isMember true for members, false otherwise', async () => {
    const { convId } = await seed(1);
    expect(await service.isMember(alice, convId)).toBe(true);
    expect(await service.isMember(bob, convId)).toBe(true);
    expect(await service.isMember(carol, convId)).toBe(false);
    expect(await service.isMember(alice, 'bad-id')).toBe(false);
  });

  it('otherParticipants excludes self', async () => {
    const { convId } = await seed(1);
    expect(await service.otherParticipants(alice, convId)).toEqual([bob]);
    expect(await service.otherParticipants(bob, convId)).toEqual([alice]);
  });
});
