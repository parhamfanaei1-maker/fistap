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
    { phone: '+989120000001' },
    { phone: '+989120000002' },
    { phone: '+989120000003' },
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

describe('MessageService — Task 2.2 (FEAT-02, database_schema.md §2/§3)', () => {
  it('first private message auto-creates conversation and stores message', async () => {
    const res = await service.send({ senderId: alice, recipientId: bob, content: 'سلام بابک!', type: 'text' });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.message.content).toBe('سلام بابک!');
    expect(res.message.status).toBe('sent');
    expect(res.recipientIds).toEqual([bob]);

    const convs = await ConversationModel.find({});
    expect(convs).toHaveLength(1);
    expect(String(convs[0]!.lastMessageId)).toBe(res.message._id);
  });

  it('second message reuses the same conversation (no duplicates)', async () => {
    const r1 = await service.send({ senderId: alice, recipientId: bob, content: 'اول', type: 'text' });
    const r2 = await service.send({ senderId: bob, recipientId: alice, content: 'دوم', type: 'text' });
    expect(r1.ok && r2.ok).toBe(true);
    if (!r1.ok || !r2.ok) return;
    expect(r2.message.conversationId).toBe(r1.message.conversationId);
    expect(await ConversationModel.countDocuments()).toBe(1);
  });

  it('sending into existing conversation by id works', async () => {
    const r1 = await service.send({ senderId: alice, recipientId: bob, content: 'x', type: 'text' });
    if (!r1.ok) throw new Error('setup');
    const r2 = await service.send({ senderId: bob, conversationId: r1.message.conversationId, content: 'پاسخ', type: 'text' });
    expect(r2.ok).toBe(true);
    if (r2.ok) expect(r2.recipientIds).toEqual([alice]);
  });

  it('non-member cannot send into a conversation (security)', async () => {
    const r1 = await service.send({ senderId: alice, recipientId: bob, content: 'x', type: 'text' });
    if (!r1.ok) throw new Error('setup');
    const intruder = await service.send({ senderId: carol, conversationId: r1.message.conversationId, content: 'نفوذ', type: 'text' });
    expect(intruder.ok).toBe(false);
    if (!intruder.ok) expect(intruder.code).toBe('NOT_A_MEMBER');
  });

  it('rejects empty content, self-message and bad ids', async () => {
    expect((await service.send({ senderId: alice, recipientId: bob, content: '   ', type: 'text' })).ok).toBe(false);
    expect((await service.send({ senderId: alice, recipientId: alice, content: 'x', type: 'text' })).ok).toBe(false);
    expect((await service.send({ senderId: alice, conversationId: 'bad-id', content: 'x', type: 'text' })).ok).toBe(false);
    expect((await service.send({ senderId: alice, content: 'x', type: 'text' })).ok).toBe(false);
  });

  it('history returns messages in chronological order with cursor pagination', async () => {
    const r1 = await service.send({ senderId: alice, recipientId: bob, content: 'm1', type: 'text' });
    if (!r1.ok) throw new Error('setup');
    const convId = r1.message.conversationId;
    await service.send({ senderId: bob, conversationId: convId, content: 'm2', type: 'text' });
    await service.send({ senderId: alice, conversationId: convId, content: 'm3', type: 'text' });

    const all = await service.history({ userId: alice, conversationId: convId });
    expect(all.ok).toBe(true);
    if (!all.ok) return;
    expect(all.messages.map((m) => m.content)).toEqual(['m1', 'm2', 'm3']);

    // صفحه‌بندی: قبل از آخرین پیام → فقط دو پیام اول
    const lastTs = all.messages[2]!.timestamp;
    const page = await service.history({ userId: alice, conversationId: convId, before: lastTs });
    if (page.ok) expect(page.messages.map((m) => m.content)).toEqual(['m1', 'm2']);
  });

  it('history denies non-members (security)', async () => {
    const r1 = await service.send({ senderId: alice, recipientId: bob, content: 'x', type: 'text' });
    if (!r1.ok) throw new Error('setup');
    const res = await service.history({ userId: carol, conversationId: r1.message.conversationId });
    expect(res.ok).toBe(false);
  });

  it('listConversations returns sidebar data sorted with lastMessage', async () => {
    await service.send({ senderId: alice, recipientId: bob, content: 'با باب', type: 'text' });
    await new Promise((r) => setTimeout(r, 5));
    await service.send({ senderId: alice, recipientId: carol, content: 'با کارول', type: 'text' });

    const list = await service.listConversations(alice);
    expect(list).toHaveLength(2);
    expect(list[0]!.lastMessage?.content).toBe('با کارول'); // جدیدترین اول
    expect(list[1]!.lastMessage?.content).toBe('با باب');
    expect(await service.listConversations(carol)).toHaveLength(1);
  });
});
