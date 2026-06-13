import { Schema, model } from 'mongoose';

/** Users Collection — docs/database_schema.md §1 */
const userSchema = new Schema(
  {
    phone: { type: String, required: true, unique: true, index: true },
    username: { type: String, unique: true, sparse: true },
    displayName: { type: String, default: '' },
    avatarUrl: { type: String, default: null },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } },
);

/** Task 4.4: ایندکس جستجوی نام نمایشی (username از قبل unique index دارد) */
userSchema.index({ displayName: 1 });

export const UserModel = model('User', userSchema);
