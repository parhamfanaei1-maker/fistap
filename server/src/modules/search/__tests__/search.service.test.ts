import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SearchService } from '../search.service.js';
import { ConversationService } from '../../conversations/conversation.service.js';
import { MessageService } from '../../messages/message.service.js';
import { UserModel } from '../../../models/User.js';

let mongod: MongoMemoryServer;
const svc = new SearchService();
let me: string, sara: string, reza: string;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  const [m, s, r] = await UserModel.create([
    { phone: '+989120005001', username: 'me_search', displayName: 'خود من' },
    { phone: '+989120005002', username: 'sara_dev', displayName: 'سارا توسعه‌دهنده' },
    { phone: '+989120005003', displayName: 'رضا محمدی' },
  ]);
  me = m!.id; sara = s!.id; reza = r!.id;

  // گروه من + گروه دیگران (نباید در نتایج من بیاید)
  const convSvc = new ConversationService();
  const g1 = await convSvc.create({ creatorId: me, type: 'group', title: 'تیم فیستپ', memberIds: [sara] });
  await convSvc.create({ creatorId: sara, type: 'group', title: 'تیم مخفی فیستپ', memberIds: [reza] });
  if (g1.ok) {
    const msgSvc = new MessageService();
    await msgSvc.send({ senderId: me, conversationId: g1.conversation._id, content: 'جلسه فردا', type: 'text' });
  }
}, 60_000);

afterAll(async () => { await mongoose.disconnect(); await mongod.stop(); });

describe('SearchService — Task 4.4', () => {
  it('finds users by username (with or without @)', async () => {
    const r1 = await svc.search({ userId: me, query: 'sara_dev' });
    expect(r1.users).toHaveLength(1);
    const r2 = await svc.search({ userId: me, query: '@sara_dev' });
    expect(r2.users).toHaveLength(1);
  });

  it('finds users by Persian displayName (partial)', async () => {
    const res = await svc.search({ userId: me, query: 'رضا' });
    expect(res.users.some((u) => u.userId === reza)).toBe(true);
  });

  it('excludes self from user results', async () => {
    const res = await svc.search({ userId: me, query: 'me_search' });
    expect(res.users).toHaveLength(0);
  });

  it('never leaks phone numbers (privacy)', async () => {
    const res = await svc.search({ userId: me, query: 'sara' });
    expect(JSON.stringify(res)).not.toContain('+98912');
  });

  it('finds only MY conversations by title', async () => {
    const res = await svc.search({ userId: me, query: 'فیستپ' });
    expect(res.conversations).toHaveLength(1); // «تیم مخفی فیستپ» مال من نیست
    expect(res.conversations[0]?.title).toBe('تیم فیستپ');
    expect(res.conversations[0]?.lastMessageContent).toBe('جلسه فردا');
  });

  it('query under 2 chars returns empty (no full-table scan)', async () => {
    const res = await svc.search({ userId: me, query: 'a' });
    expect(res.users).toHaveLength(0);
    expect(res.conversations).toHaveLength(0);
  });

  it('regex special chars are escaped (no ReDoS/injection)', async () => {
    const res = await svc.search({ userId: me, query: '.*' });
    expect(res.users).toHaveLength(0); // literal ".*" نه wildcard
  });
});
