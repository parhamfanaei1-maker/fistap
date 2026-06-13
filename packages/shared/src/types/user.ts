/** Users Collection — per docs/database_schema.md §1 */
export interface User {
  _id: string;
  phone: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  lastSeen: string; // ISO DateTime
  createdAt: string; // ISO DateTime
}

/** Public projection (no phone leak to other users) */
export type PublicUser = Omit<User, 'phone'>;

/** user_roles.md */
export type SystemRole = 'user' | 'super_admin';
export type ConversationRole = 'member' | 'admin' | 'owner';
