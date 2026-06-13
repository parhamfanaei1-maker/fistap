import { apiFetch } from './api';
import type { ApiResponse } from '@fistap/shared';

/** قراردادها از docs/project_state.md (Task 3.1 Groups & Channels Contract) */
export interface GroupConversation {
  _id: string;
  type: string;
  title?: string;
  participants: string[];
  ownerId: string | null;
  admins: string[];
  avatarUrl: string | null;
  createdAt: string;
}

type ConvResponse = Promise<ApiResponse<{ conversation: GroupConversation }>>;

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

export const createConversation = (
  token: string,
  payload: { type: 'group' | 'channel'; title: string; memberIds: string[] },
): ConvResponse =>
  apiFetch('/conversations', { method: 'POST', headers: auth(token), body: JSON.stringify(payload) });

export const addMembers = (token: string, conversationId: string, memberIds: string[]): ConvResponse =>
  apiFetch(`/conversations/${conversationId}/members`, {
    method: 'POST', headers: auth(token), body: JSON.stringify({ memberIds }),
  });

export const removeMember = (token: string, conversationId: string, memberId: string): ConvResponse =>
  apiFetch(`/conversations/${conversationId}/members/${memberId}`, { method: 'DELETE', headers: auth(token) });

export const setAdmin = (token: string, conversationId: string, memberId: string, isAdmin: boolean): ConvResponse =>
  apiFetch(`/conversations/${conversationId}/admins/${memberId}`, {
    method: 'PATCH', headers: auth(token), body: JSON.stringify({ isAdmin }),
  });

export const updateGroupInfo = (token: string, conversationId: string, title: string): ConvResponse =>
  apiFetch(`/conversations/${conversationId}`, {
    method: 'PATCH', headers: auth(token), body: JSON.stringify({ title }),
  });

export const fetchConversation = (token: string, conversationId: string): ConvResponse =>
  apiFetch(`/conversations/${conversationId}`, { headers: auth(token) });

/** Task 3.4 — پین/آن‌پین پیام (messageId=null → برداشتن پین) */
export const setPinnedMessage = (
  token: string,
  conversationId: string,
  messageId: string | null,
): Promise<ApiResponse<{ conversation: GroupConversation; pinnedMessage: unknown }>> =>
  apiFetch(`/conversations/${conversationId}/pin`, {
    method: 'PATCH', headers: auth(token), body: JSON.stringify({ messageId }),
  });
