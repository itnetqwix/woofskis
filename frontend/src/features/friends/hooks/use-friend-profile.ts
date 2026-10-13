'use client';

import { useQuery } from '@tanstack/react-query';
import { getFriendProfile, type FriendProfileData } from '@/services/friends-api';

export function useFriendProfile(friendIdOrFriendshipId: string | null) {
  return useQuery({
    queryKey: ['creator-friend-profile', friendIdOrFriendshipId],
    enabled: Boolean(friendIdOrFriendshipId),
    queryFn: async () => {
      if (!friendIdOrFriendshipId) return null;
      const envelope = await getFriendProfile(friendIdOrFriendshipId);
      if (!envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Failed to load friend profile');
      }
      return envelope.data;
    },
  });
}
