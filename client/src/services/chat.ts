import { apiFetch } from './api';
import type { ApiResponse, Message } from '@fistap/shared';
import type { ConversationSummary } from '@/store/chatStore';

/** قراردادها از docs/project_state.md (Task 2.2 REST) */
export const fetchConversations = (
  accessToken: string,
): Promise<ApiResponse<{ conversations: ConversationSummary[] }>> =>
  apiFetch('/conversations', { headers: { Authorization: `Bearer ${accessToken}` } });

export const fetchMessages = (
  accessToken: string,
  conversationId: string,
  params?: { limit?: number; before?: string },
): Promise<ApiResponse<{ messages: Message[] }>> => {
  const q = new URLSearchParams();
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.before) q.set('before', params.before);
  const qs = q.toString();
  return apiFetch(`/conversations/${conversationId}/messages${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
};
