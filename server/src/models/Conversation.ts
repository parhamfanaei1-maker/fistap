import { Schema, model } from 'mongoose';
import { CONVERSATION_TYPES } from '@fistap/shared';

/** Conversations Collection — docs/database_schema.md §2
 *  LL-004: در اسکیما باید Schema.Types.ObjectId باشد نه Types.ObjectId (کلاس BSON) */
const conversationSchema = new Schema(
  {
    type: { type: String, enum: CONVERSATION_TYPES, required: true },
    /** کلید یکتای گفتگوی خصوصی: "idA:idB" (مرتب‌شده) — upsert اتمیک بدون race (Task 2.2) */
    privateKey: { type: String, unique: true, sparse: true },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
    /** Task 3.1 — نقش‌ها طبق user_roles.md (فقط group/channel) */
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    admins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    lastMessageId: { type: Schema.Types.ObjectId, ref: 'Message', default: null },
    pinnedMessageId: { type: Schema.Types.ObjectId, ref: 'Message', default: null },
    title: { type: String },
    avatarUrl: { type: String, default: null },
  },
  // Task 2.2: updatedAt برای مرتب‌سازی Sidebar بر اساس آخرین فعالیت لازم شد
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } },
);

export const ConversationModel = model('Conversation', conversationSchema);
