import { http, type ApiResponse } from './api-client';

export type FriendDirection = 'INCOMING' | 'OUTGOING';
export type FriendRelationship = 'NONE' | 'INCOMING' | 'OUTGOING' | 'FRIENDS';

export interface FriendPerson {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export interface FriendListItem {
  id: string;
  status: 'PENDING' | 'ACCEPTED';
  direction: FriendDirection;
  createdAt: string;
  user: FriendPerson;
}

export interface FriendList {
  friends: FriendListItem[];
  incoming: FriendListItem[];
  outgoing: FriendListItem[];
}

export interface FriendSearchHit extends FriendPerson {
  relationship: FriendRelationship;
  friendshipId: string | null;
}

export function listFriends(): Promise<ApiResponse<FriendList>> {
  return http.get<FriendList>('/friends');
}

export function searchCreators(q: string): Promise<ApiResponse<FriendSearchHit[]>> {
  return http.get<FriendSearchHit[]>('/friends/search', { params: { q } });
}

export function sendFriendRequest(addresseeId: string): Promise<ApiResponse<FriendListItem>> {
  return http.post<FriendListItem>('/friends/requests', { addresseeId });
}

export function acceptFriendRequest(friendshipId: string): Promise<ApiResponse<FriendListItem>> {
  return http.post<FriendListItem>(`/friends/requests/${encodeURIComponent(friendshipId)}/accept`);
}

export function rejectFriendRequest(friendshipId: string): Promise<ApiResponse<null>> {
  return http.post<null>(`/friends/requests/${encodeURIComponent(friendshipId)}/reject`);
}

export function cancelFriendRequest(friendshipId: string): Promise<ApiResponse<null>> {
  return http.delete<null>(`/friends/requests/${encodeURIComponent(friendshipId)}`);
}

export function removeFriend(friendshipId: string): Promise<ApiResponse<null>> {
  return http.delete<null>(`/friends/${encodeURIComponent(friendshipId)}`);
}

export interface FriendProfileSubmission {
  id: string;
  title: string;
  description: string | null;
  durationSeconds: number;
  communityScore: number;
  totalVotes: number;
  createdAt: string;
  contestId: string;
  contestTitle: string;
  category: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
}

export interface FriendProfileData {
  friend: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    createdAt: string;
  };
  stats: {
    totalSubmissions: number;
    totalVotes: number;
    communityScore: number;
  };
  submissions: FriendProfileSubmission[];
}

export function getFriendProfile(
  friendIdOrFriendshipId: string
): Promise<ApiResponse<FriendProfileData>> {
  return http.get<FriendProfileData>(
    `/friends/${encodeURIComponent(friendIdOrFriendshipId)}/profile`
  );
}
