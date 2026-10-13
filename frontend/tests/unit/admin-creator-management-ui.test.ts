import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));

function source(relativePath: string): string {
  return readFileSync(join(root, relativePath), 'utf8');
}

describe('admin creator management UI', () => {
  const directory = source('src/features/admin/components/creator-directory.tsx');
  const profile = source('src/features/admin/components/creator-profile.tsx');
  const participants = source('src/features/admin/components/contest-participants.tsx');
  const contests = source('src/features/admin/components/contests-management-table.tsx');
  const listPage = source('src/app/(dashboard)/admin/creators/page.tsx');
  const profilePage = source('src/app/(dashboard)/admin/creators/[id]/page.tsx');
  const contestCreatorsPage = source(
    'src/app/(dashboard)/admin/contests/[id]/creators/page.tsx'
  );

  it('renders the creator dashboard with summary, search, filters, and pagination', () => {
    assert.match(listPage, /CreatorDirectory/);
    assert.match(directory, /Total creators/);
    assert.match(directory, /Active creators/);
    assert.match(directory, /Blocked creators/);
    assert.match(directory, /Total videos/);
    assert.match(directory, /Approved videos/);
    assert.match(directory, /Pending \/ under moderation/);
    assert.match(directory, /Rejected videos/);
    assert.match(directory, /Search name or email/);
    assert.match(directory, /Status filter/);
    assert.match(directory, /Contest filter/);
    assert.match(directory, /listAdminCreators/);
    assert.match(directory, /page/);
    assert.match(directory, /Previous/);
    assert.match(directory, /Next/);
    assert.match(directory, /lg:hidden/);
    assert.match(directory, /View profile/);
    assert.match(directory, /Issue warning/);
    assert.match(directory, /Confirm block/);
  });

  it('renders creator profile, contests, videos, warnings, and activity', () => {
    assert.match(profilePage, /CreatorProfile/);
    assert.match(profile, /listAdminCreatorContests/);
    assert.match(profile, /listAdminCreatorSubmissions/);
    assert.match(profile, /listAdminCreatorActivity/);
    assert.match(profile, />Contests</);
    assert.match(profile, />Videos</);
    assert.match(profile, /Warnings/);
    assert.match(profile, /No activity recorded yet/);
    assert.match(profile, /Ratings received/);
    assert.match(profile, /Comments/);
    assert.match(profile, /Watch/);
  });

  it('confirms block, warning, and video delete with the video title', () => {
    assert.match(profile, /Confirm block/);
    assert.match(profile, /Confirm unblock/);
    assert.match(profile, /Issue warning/);
    assert.match(profile, /Warning reason/);
    assert.match(profile, /Delete “\{deleteTarget\.title\}”/);
    assert.match(profile, /Confirm delete/);
    assert.match(profile, /stored media file is not deleted/);
  });

  it('links a contest to its participating creators', () => {
    assert.match(contests, /\/admin\/contests\/\$\{contest\.id\}\/creators/);
    assert.match(contests, />Creators</);
    assert.match(contestCreatorsPage, /ContestParticipants/);
    assert.match(contestCreatorsPage, /route="\/admin\/contests"/);
    assert.match(participants, /listContestParticipants/);
    assert.match(participants, /participatingCreatorCount/);
  });

  it('safely handles missing, null, or undefined creator profile data with fallbacks', () => {
    assert.match(profile, /creator\?\.name \?\? '—'/);
    assert.match(profile, /creator\?\.email \?\? '—'/);
    assert.match(profile, /stats\?\.totalVideos \?\? 0/);
    assert.match(profile, /stats\?\.approvedVideos \?\? 0/);
    assert.match(profile, /submissions = contest\?\.submissions \?\? \[\]/);
    assert.match(profile, /videos \?\? \[\]/);
    assert.match(profile, /activity \?\? \[\]/);
    assert.match(profile, /warnings \?\? \[\]/);
    assert.match(profile, /warning\?\.issuedBy\?\.name/);
    assert.match(profile, /actionLabel\(action\?: string \| null\)/);
  });
});
