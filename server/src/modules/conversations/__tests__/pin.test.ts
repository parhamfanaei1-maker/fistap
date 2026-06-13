import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ConversationService } from '../conversation.service.js';
import { MessageService } from '../../messages/message.service.js';
import { ConversationModel } from '../../../models/Conversation.js';
import { MessageModel } from '../../../models/Message.js';
import { UserModel } from '../../../models/User.js';

let mongod: MongoMemoryServer;
const svc = new ConversationService();
const msgSvc = new MessageService();
let owner: string, admin: string, member: string, alice: string, bob: string;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  const [o, a, m, x, y] = await UserModel.create([
    { phone: '+989120008001' }, { phone: '+989120008002' }, { phone: '+989120008003' },
    { phone: '+989120008004' }, { phone: '+989120008005' },
  ]);
  owner = o!.id; admin = a!.id; member = m!.id; alice = x!.id; bob = y!.id;
}, 60_000);

afterAll(async () => { await mongoose.disconnect(); await mongod.stop(); });
beforeEach(async () => { await ConversationModel.deleteMany({}); await MessageModel.deleteMany({}); });

async function seedGroupWithMessage() {
  const created = await svc.create({ creatorId: owner, type: 'group', title: 'گروه', memberIds: [admin, member] });
  if (!created.ok) throw new Error('seed');
  const convId = created.conversation._id;
  await svc.setAdmin({ actorId: owner, conversationId: convId, memberId: admin, isAdmin: true });
  const msg = await msgSvc.send({ senderId: member, conversationId: convId, content: 'پیام مهم', type: 'text' });
  if (!msg.ok) throw new Error('seed-msg');
  return { convId, messageId: msg.message._id };
}

describe('setPinned — Task 3.4 (FEAT-02 / UI-PIN)', () => {
  it('admin pins a message in group', async () => {
    const { convId, messageId } = await seedGroupWithMessage();
    const res = await svc.setPinned({ actorId: admin, conversationId: convId, messageId });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.conversation.pinnedMessageId).toBe(messageId);
      expect(res.participants).toHaveLength(3);
    }
  });

  it('member cannot pin in group (FORBIDDEN) — user_roles.md §2', async () => {
    const { convId, messageId } = await seedGroupWithMessage();
    const res = await svc.setPinned({ actorId: member, conversationId: convId, messageId });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('FORBIDDEN');
  });

  it('both sides can pin in private conversation', async () => {
    const sent = await msgSvc.send({ senderId: alice, recipientId: bob, content: 'قرار فردا', type: 'text' });
    if (!sent.ok) throw new Error('setup');
    const byBob = await svc.setPinned({ actorId: bob, conversationId: sent.message.conversationId, messageId: sent.message._id });
    expect(byBob.ok).toBe(true);
    const byAlice = await svc.setPinned({ actorId: alice, conversationId: sent.message.conversationId, messageId: null });
    expect(byAlice.ok).toBe(true);
    if (byAlice.ok) expect(byAlice.conversation.pinnedMessageId).toBeNull();
  });

  it('unpin with messageId=null', async () => {
    const { convId, messageId } = await seedGroupWithMessage();
    await svc.setPinned({ actorId: owner, conversationId: convId, messageId });
    const res = await svc.setPinned({ actorId: owner, conversationId: convId, messageId: null });
    if (res.ok) expect(res.conversation.pinnedMessageId).toBeNull();
  });

  it('cannot pin a message from another conversation (security)', async () => {
    const { convId } = await seedGroupWithMessage();
    const other = await msgSvc.send({ senderId: alice, recipientId: bob, content: 'جای دیگر', type: 'text' });
    if (!other.ok) throw new Error('setup');
    const res = await svc.setPinned({ actorId: owner, conversationId: convId, messageId: other.message._id });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('MESSAGE_NOT_FOUND');
  });

  it('non-member cannot pin', async () => {
    const { convId, messageId } = await seedGroupWithMessage();
    const res = await svc.setPinned({ actorId: alice, conversationId: convId, messageId });
    expect(res.ok).toBe(false);
  });

  it('pinnedMessageId surfaces in listConversations (sidebar reload)', async () => {
    const { convId, messageId } = await seedGroupWithMessage();
    await svc.setPinned({ actorId: owner, conversationId: convId, messageId });
    const list = await msgSvc.listConversations(owner);
    const conv = list.find((c) => c._id === convId);
    expect(conv?.pinnedMessageId).toBe(messageId);
  });
});
