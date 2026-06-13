import { Schema, model } from 'mongoose';
import { MESSAGE_STATUS } from '@fistap/shared';

/** Messages Collection — docs/database_schema.md §3
 *  LL-004: در اسکیما باید Schema.Types.ObjectId باشد نه Types.ObjectId (کلاس BSON) */
const messageSchema = new Schema({
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['text', 'image', 'video', 'audio', 'file'], default: 'text' },
  status: { type: String, enum: MESSAGE_STATUS, default: 'sent' },
  timestamp: { type: Date, default: Date.now, index: true },
  replyToId: { type: Schema.Types.ObjectId, ref: 'Message', default: null },
  forwardedFromId: { type: Schema.Types.ObjectId, ref: 'Message', default: null },
});

/** ایندکس ترکیبی برای صفحه‌بندی سریع تاریخچه چت */
messageSchema.index({ conversationId: 1, timestamp: -1 });

export const MessageModel = model('Message', messageSchema);
