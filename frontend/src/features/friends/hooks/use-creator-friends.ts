'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  acceptFriendRequest,
  cancelFriendRequest,
  listFriends,
  rejectFriendRequest,
  removeFriend,
  searchCreators,
  sendFriendRequest,
  type FriendList,
  type FriendSearchHit,
} from '@/services/friends-api';

export const FRIENDS_LIST_KEY = ['creator-friends'] as const;

async function unwrap<T>(promise: Promise<{ success: boolean; message: string; data: T | null }>) {
  const envelope = await promise;
  if (!envelope.success) {
    throw new Error(envelope.message || 'Request failed');
  }
  return envelope.data as T;
}

export function useCreatorFriends(searchQuery: string) {
  const queryClient = useQueryClient();
  const query = searchQuery.trim();

  const listQuery = useQuery({
    queryKey: FRIENDS_LIST_KEY,
    queryFn: () => unwrap<FriendList>(listFriends()),
  });

  const searchResults = useQuery({
    queryKey: ['creator-friend-search', query],
    enabled: query.length > 0,
    queryFn: () => unwrap<FriendSearchHit[]>(searchCreators(query)),
  });

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: FRIENDS_LIST_KEY }),
      queryClient.invalidateQueries({ queryKey: ['creator-friend-search'] }),
    ]);
  }

  const send = useMutation({ mutationFn: sendFriendRequest, onSuccess: refresh });
  const accept = useMutation({ mutationFn: acceptFriendRequest, onSuccess: refresh });
  const reject = useMutation({ mutationFn: rejectFriendRequest, onSuccess: refresh });
  const cancel = useMutation({ mutationFn: cancelFriendRequest, onSuccess: refresh });
  const remove = useMutation({ mutationFn: removeFriend, onSuccess: refresh });

  return { listQuery, searchResults, send, accept, reject, cancel, remove };
}
