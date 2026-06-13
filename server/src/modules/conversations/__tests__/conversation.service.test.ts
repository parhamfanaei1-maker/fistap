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
let owner: string, admin: string, member: string, outsider: string;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  const [o, a, m, x] = await UserModel.create([
    { phone: '+989120009001' }, { phone: '+989120009002' },
    { phone: '+989120009003' }, { phone: '+989120009004' },
  ]);
  owner = o!.id; admin = a!.id; member = m!.id; outsider = x!.id;
}, 60_000);

afterAll(async () => { await mongoose.disconnect(); await mongod.stop(); });
beforeEach(async () => { await ConversationModel.deleteMany({}); await MessageModel.deleteMany({}); });

/** گروه آماده: owner سازنده، admin منصوب، member عادی */
async function seedGroup(type: 'group' | 'channel' = 'group') {
  const created = await svc.create({ creatorId: owner, type, title: 'تیم فیستپ', memberIds: [admin, member] });
  if (!created.ok) throw new Error('seed failed');
  const id = created.conversation._id;
  await svc.setAdmin({ actorId: owner, conversationId: id, memberId: admin, isAdmin: true });
  return id;
}

describe('ConversationService.create — Task 3.1', () => {
  it('creates group: creator becomes owner and admin', async () => {
    const res = await svc.create({ creatorId: owner, type: 'group', title: 'گروه تست', memberIds: [member] });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.conversation.ownerId).toBe(owner);
    expect(res.conversation.admins).toContain(owner);
    expect(res.conversation.participants).toHaveLength(2);
  });

  it('dedupes members and ignores creator in memberIds', async () => {
    const res = await svc.create({ creatorId: owner, type: 'group', title: 'x', memberIds: [member, member, owner] });
    if (res.ok) expect(res.conversation.participants).toHaveLength(2);
  });

  it('rejects empty/long title and bad member id', async () => {
    expect((await svc.create({ creatorId: owner, type: 'group', title: '   ', memberIds: [] })).ok).toBe(false);
    expect((await svc.create({ creatorId: owner, type: 'group', title: 'x'.repeat(65), memberIds: [] })).ok).toBe(false);
    expect((await svc.create({ creatorId: owner, type: 'group', title: 'x', memberIds: ['bad'] })).ok).toBe(false);
  });
});

describe('membership management — user_roles.md §2', () => {
  it('admin can add members; member cannot', async () => {
    const id = await seedGroup();
    const byAdmin = await svc.addMembers({ actorId: admin, conversationId: id, memberIds: [outsider] });
    expect(byAdmin.ok).toBe(true);
    const id2 = await seedGroup();
    const byMember = await svc.addMembers({ actorId: member, conversationId: id2, memberIds: [outsider] });
    expect(byMember.ok).toBe(false);
  });

  it('admin can remove member but NOT another admin; owner can remove admin', async () => {
    const id = await seedGroup();
    expect((await svc.removeMember({ actorId: admin, conversationId: id, memberId: member })).ok).toBe(true);
    expect((await svc.removeMember({ actorId: admin, conversationId: id, memberId: owner })).ok).toBe(false);
    const id2 = await seedGroup();
    expect((await svc.removeMember({ actorId: admin, conversationId: id2, memberId: admin })).ok).toBe(true); // خروج خود
    const id3 = await seedGroup();
    expect((await svc.removeMember({ actorId: owner, conversationId: id3, memberId: admin })).ok).toBe(true);
  });

  it('owner cannot be removed, even by self', async () => {
    const id = await seedGroup();
    expect((await svc.removeMember({ actorId: owner, conversationId: id, memberId: owner })).ok).toBe(false);
  });

  it('member can leave by self (selfLeave)', async () => {
    const id = await seedGroup();
    const res = await svc.removeMember({ actorId: member, conversationId: id, memberId: member });
    expect(res.ok).toBe(true);
  });

  it('only owner can promote/demote admins (use case 2)', async () => {
    const id = await seedGroup();
    expect((await svc.setAdmin({ actorId: admin, conversationId: id, memberId: member, isAdmin: true })).ok).toBe(false);
    const promote = await svc.setAdmin({ actorId: owner, conversationId: id, memberId: member, isAdmin: true });
    expect(promote.ok).toBe(true);
    if (promote.ok) expect(promote.conversation.admins).toContain(member);
    const demote = await svc.setAdmin({ actorId: owner, conversationId: id, memberId: member, isAdmin: false });
    if (demote.ok) expect(demote.conversation.admins).not.toContain(member);
  });

  it('updateInfo: admin allowed, member forbidden', async () => {
    const id = await seedGroup();
    expect((await svc.updateInfo({ actorId: admin, conversationId: id, title: 'نام جدید' })).ok).toBe(true);
    expect((await svc.updateInfo({ actorId: member, conversationId: id, title: 'هک' })).ok).toBe(false);
  });
});

describe('group messaging + channel rule — FEAT-02', () => {
  it('any member can send in group; messages reach all other members', async () => {
    const id = await seedGroup('group');
    const res = await msgSvc.send({ senderId: member, conversationId: id, content: 'سلام گروه', type: 'text' });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.recipientIds.sort()).toEqual([owner, admin].sort());
  });

  it('channel: member cannot post (CHANNEL_READONLY), admin/owner can', async () => {
    const id = await seedGroup('channel');
    const byMember = await msgSvc.send({ senderId: member, conversationId: id, content: 'x', type: 'text' });
    expect(byMember.ok).toBe(false);
    if (!byMember.ok) expect(byMember.code).toBe('CHANNEL_READONLY');
    expect((await msgSvc.send({ senderId: admin, conversationId: id, content: 'خبر', type: 'text' })).ok).toBe(true);
    expect((await msgSvc.send({ senderId: owner, conversationId: id, content: 'اطلاعیه', type: 'text' })).ok).toBe(true);
  });

  it('canSendMessage helper mirrors the same rules', async () => {
    const ch = await seedGroup('channel');
    expect(await svc.canSendMessage(member, ch)).toBe(false);
    expect(await svc.canSendMessage(admin, ch)).toBe(true);
    expect(await svc.canSendMessage(outsider, ch)).toBe(false);
    const gr = await seedGroup('group');
    expect(await svc.canSendMessage(member, gr)).toBe(true);
  });

  it('outsider cannot act at all', async () => {
    const id = await seedGroup();
    expect((await svc.addMembers({ actorId: outsider, conversationId: id, memberIds: [outsider] })).ok).toBe(false);
    expect((await msgSvc.send({ senderId: outsider, conversationId: id, content: 'x', type: 'text' })).ok).toBe(false);
  });
});
