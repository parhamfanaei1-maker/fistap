import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { MessageService } from '../message.service.js';
import { ConversationModel } from '../../../models/Conversation.js';
import { MessageModel } from '../../../models/Message.js';
import { UserModel } from '../../../models/User.js';

let mongod: MongoMemoryServer;
const svc = new MessageService();
let alice: string, bob: string, carol: string;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  const [a, b, c] = await UserModel.create([
    { phone: '+989120004001' }, { phone: '+989120004002' }, { phone: '+989120004003' },
  ]);
  alice = a!.id; bob = b!.id; carol = c!.id;
}, 60_000);

afterAll(async () => { await mongoose.disconnect(); await mongod.stop(); });
beforeEach(async () => { await ConversationModel.deleteMany({}); await MessageModel.deleteMany({}); });

describe('Reply — ISS-001 regression (FEAT-02)', () => {
  it('stores replyToId when replying to a message in same conversation', async () => {
    const m1 = await svc.send({ senderId: alice, recipientId: bob, content: 'سوال؟', type: 'text' });
    if (!m1.ok) throw new Error('setup');
    const m2 = await svc.send({
      senderId: bob, conversationId: m1.message.conversationId,
      content: 'جواب!', type: 'text', replyToId: m1.message._id,
    });
    expect(m2.ok).toBe(true);
    if (!m2.ok) return;
    expect(m2.message.replyToId).toBe(m1.message._id);
    const doc = await MessageModel.findById(m2.message._id);
    expect(String(doc!.replyToId)).toBe(m1.message._id); // واقعاً در DB
  });

  it('rejects reply to a message from another conversation (security)', async () => {
    const m1 = await svc.send({ senderId: alice, recipientId: bob, content: 'a', type: 'text' });
    const other = await svc.send({ senderId: alice, recipientId: carol, content: 'b', type: 'text' });
    if (!m1.ok || !other.ok) throw new Error('setup');
    const res = await svc.send({
      senderId: bob, conversationId: m1.message.conversationId,
      content: 'x', type: 'text', replyToId: other.message._id,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('INVALID_REPLY');
  });

  it('rejects malformed replyToId', async () => {
    const m1 = await svc.send({ senderId: alice, recipientId: bob, content: 'a', type: 'text' });
    if (!m1.ok) throw new Error('setup');
    const res = await svc.send({
      senderId: bob, conversationId: m1.message.conversationId,
      content: 'x', type: 'text', replyToId: 'bad-id',
    });
    expect(res.ok).toBe(false);
  });
});

describe('Forward — ISS-002 (FEAT-02)', () => {
  it('stores forwardedFromId when forwarding own-accessible message', async () => {
    const src = await svc.send({ senderId: alice, recipientId: bob, content: 'خبر مهم', type: 'text' });
    if (!src.ok) throw new Error('setup');
    // باب پیام را به گفتگوی خودش با کارول فوروارد می‌کند
    const fwd = await svc.send({
      senderId: bob, recipientId: carol,
      content: src.message.content, type: 'text', forwardedFromId: src.message._id,
    });
    expect(fwd.ok).toBe(true);
    if (fwd.ok) expect(fwd.message.forwardedFromId).toBe(src.message._id);
  });

  it('rejects forwarding a message the sender cannot access (security)', async () => {
    const secret = await svc.send({ senderId: alice, recipientId: bob, content: 'راز', type: 'text' });
    if (!secret.ok) throw new Error('setup');
    // کارول عضو آن گفتگو نیست — نباید بتواند به نام فوروارد، محتوا را معتبرسازی کند
    const res = await svc.send({
      senderId: carol, recipientId: alice,
      content: 'راز', type: 'text', forwardedFromId: secret.message._id,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('INVALID_FORWARD');
  });
});
