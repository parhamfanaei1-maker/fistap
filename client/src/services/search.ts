import { apiFetch } from './api';
import type { ApiResponse } from '@fistap/shared';

export interface UserSearchResult {
  userId: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
}

export interface ConversationSearchResult {
  _id: string;
  type: string;
  title?: string;
  participants: string[];
  lastMessageContent: string | null;
}

export interface SearchData {
  users: UserSearchResult[];
  conversations: ConversationSearchResult[];
}

/** قرارداد Task 4.4 — GET /search?q= */
export const globalSearch = (token: string, q: string): Promise<ApiResponse<SearchData>> =>
  apiFetch(`/search?q=${encodeURIComponent(q)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
