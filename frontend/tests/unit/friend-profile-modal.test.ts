import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const friendsApiSource = readFileSync(
  new URL('../../src/services/friends-api.ts', import.meta.url),
  'utf8'
);

const friendsPanelSource = readFileSync(
  new URL('../../src/features/friends/components/friends-panel.tsx', import.meta.url),
  'utf8'
);

const friendProfileModalSource = readFileSync(
  new URL('../../src/features/friends/components/friend-profile-modal.tsx', import.meta.url),
  'utf8'
);

const useFriendProfileSource = readFileSync(
  new URL('../../src/features/friends/hooks/use-friend-profile.ts', import.meta.url),
  'utf8'
);

describe('Creator Friend Profile Modal & API integration', () => {
  it('1. friends-api exports getFriendProfile and typed data structures', () => {
    assert.match(friendsApiSource, /export function getFriendProfile\(/);
    assert.match(
      friendsApiSource,
      /\/friends\/\$\{encodeURIComponent\(friendIdOrFriendshipId\)\}\/profile/
    );
    assert.match(friendsApiSource, /export interface FriendProfileData/);
    assert.match(friendsApiSource, /export interface FriendProfileSubmission/);
    assert.doesNotMatch(friendsApiSource, /email:/);
  });

  it('2. useFriendProfile hook queries friend profile with query key', () => {
    assert.match(useFriendProfileSource, /useFriendProfile/);
    assert.match(useFriendProfileSource, /creator-friend-profile/);
    assert.match(useFriendProfileSource, /getFriendProfile/);
  });

  it('3. FriendsPanel opens FriendProfileModal on accepted friends only', () => {
    // Modal import and state
    assert.match(friendsPanelSource, /FriendProfileModal/);
    assert.match(friendsPanelSource, /profileFriend/);
    assert.match(friendsPanelSource, /setProfileFriend/);

    // Friends list maps with onSelectProfile
    assert.match(
      friendsPanelSource,
      /list\?\.friends\.map\(\(item\) => \(\s*<PersonRow[\s\S]*?onSelectProfile=/
    );

    // Search results only set onSelectProfile for accepted FRIENDS
    assert.match(friendsPanelSource, /onSelectProfile=\{\s*hit\.relationship === 'FRIENDS'/);

    // Incoming and outgoing requests do NOT have onSelectProfile
    const incomingMatch = friendsPanelSource.match(/list\?\.incoming\.map\([\s\S]*?<\/PersonRow>/);
    assert.ok(incomingMatch);
    assert.doesNotMatch(incomingMatch[0], /onSelectProfile/);

    const outgoingMatch = friendsPanelSource.match(/list\?\.outgoing\.map\([\s\S]*?<\/PersonRow>/);
    assert.ok(outgoingMatch);
    assert.doesNotMatch(outgoingMatch[0], /onSelectProfile/);

    // PersonRow has button wrapper with keyboard navigation for accessible trigger
    assert.match(friendsPanelSource, /role: 'button'/);
    assert.match(friendsPanelSource, /tabIndex: 0/);
    assert.match(friendsPanelSource, /onKeyDown:/);
  });

  it('4. FriendProfileModal shows avatar, display name, stats, and submissions', () => {
    assert.match(friendProfileModalSource, /ProfileAvatar/);
    assert.match(friendProfileModalSource, /displayName/);
    assert.match(friendProfileModalSource, /Submissions/);
    assert.match(friendProfileModalSource, /Total Votes/);
    assert.match(friendProfileModalSource, /Score/);
    assert.match(friendProfileModalSource, /FriendSubmissionCard/);
  });

  it('5. FriendProfileModal handles loading, error, and empty states gracefully', () => {
    assert.match(friendProfileModalSource, /isLoading \?/);
    assert.match(friendProfileModalSource, /Loader2/);
    assert.match(friendProfileModalSource, /isError \?/);
    assert.match(friendProfileModalSource, /submissions\.length === 0/);
    assert.match(friendProfileModalSource, /No public submissions yet/);
  });

  it('6. Enlarged video player includes standard playback controls and error handling', () => {
    // Play/Pause
    assert.match(friendProfileModalSource, /togglePlay/);
    assert.match(friendProfileModalSource, /isPlaying/);
    // Scrubber
    assert.match(friendProfileModalSource, /handleScrub/);
    assert.match(friendProfileModalSource, /progressBarRef/);
    // Mute/Volume
    assert.match(friendProfileModalSource, /toggleMute/);
    assert.match(friendProfileModalSource, /isMuted/);
    // Fullscreen
    assert.match(friendProfileModalSource, /toggleFullscreen/);
    // Error retry
    assert.match(friendProfileModalSource, /onError=\{.+setHasError/);
    assert.match(friendProfileModalSource, /Playback Unavailable/);
    assert.match(friendProfileModalSource, /Retry/);
    // Standard vertical aspect ratio
    assert.match(friendProfileModalSource, /aspect-\[9\/16\]/);
  });

  it('7. Submissions section renders a responsive Facebook-style 9:16 grid with inline preview & viewport awareness', () => {
    // 2 cols on mobile, 2-3 on tablet, 3-4 on desktop
    assert.match(
      friendProfileModalSource,
      /grid-cols-2\s+gap-2\.5\s+sm:grid-cols-2\s+sm:gap-3\s+md:grid-cols-3\s+lg:grid-cols-4/
    );

    // Each card is consistent 9:16 aspect ratio with rounded corners
    assert.match(friendProfileModalSource, /aspect-\[9\/16\]/);
    assert.match(friendProfileModalSource, /rounded-xl/);

    // Category badge, duration, and video title overlay
    assert.match(friendProfileModalSource, /submission\.category/);
    assert.match(friendProfileModalSource, /submission\.durationSeconds/);
    assert.match(friendProfileModalSource, /submission\.title/);

    // Inline video preview with muted playback and IntersectionObserver viewport handling
    assert.match(friendProfileModalSource, /IntersectionObserver/);
    assert.match(friendProfileModalSource, /muted/);
    assert.match(friendProfileModalSource, /playsInline/);
    assert.match(friendProfileModalSource, /activePreviewId/);
    assert.match(friendProfileModalSource, /setActivePreviewId/);
    assert.match(friendProfileModalSource, /onMouseEnter=\{/);
    assert.match(friendProfileModalSource, /onMouseLeave=\{/);
  });
});
