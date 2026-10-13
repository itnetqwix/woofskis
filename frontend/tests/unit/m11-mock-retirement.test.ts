import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));

function source(relativePath: string): string {
  return readFileSync(join(root, relativePath), 'utf8');
}

describe('M11 mock retirement', () => {
  it('keeps the auth token key and does not revive demo persona login', () => {
    const keys = source('src/constants/storage-keys.ts');
    const session = source('src/features/auth/hooks/use-auth-session.ts');
    const axios = source('src/lib/axios.ts');
    assert.match(keys, /AUTH_TOKEN:\s*'cos_auth_token'/);
    assert.match(session, /STORAGE_KEYS\.AUTH_TOKEN/);
    assert.match(session, /fetchMe\(/);
    assert.equal(session.includes('loginAsDemoPersona'), false);
    assert.equal(session.includes('DEMO_PERSONAS'), false);
    assert.match(axios, /COS_UNAUTHORIZED_EVENT/);
    assert.match(source('src/store/slices/auth-slice.ts'), /cos_auth_updated/);
  });

  it('does not use mock catalogs as contest, submission, moderation, or leaderboard rows', () => {
    const leaderboard = source('src/features/leaderboard/hooks/use-leaderboard.ts');
    const header = source('src/components/layout/app-header.tsx');
    const upload = source('src/features/submissions/components/upload-modal.tsx');
    const creator = source('src/features/submissions/hooks/use-creator-submissions.ts');
    const contests = source('src/lib/theme-utils.ts');
    const superAdmin = source('src/app/(dashboard)/super-admin/page.tsx');
    const overlay = source('src/features/admin/components/tenant-suspension-overlay.tsx');

    assert.equal(leaderboard.includes('INITIAL_LEADERBOARD_ITEMS'), false);
    assert.equal(leaderboard.includes('contest_rip_01'), false);
    assert.equal(header.includes('cos_creator_submissions_v1'), false);
    assert.equal(header.includes('cos_submissions_updated'), false);
    assert.match(header, /moderationQueueQueryKey/);
    assert.match(header, /listModerationQueue/);
    assert.equal(upload.includes('MOCK_'), false);
    assert.equal(upload.includes('handleUseSampleVideo'), false);
    assert.equal(creator.includes('MOCK_ACTIVE_CONTEST'), false);
    assert.equal(contests.includes('DEFAULT_CONTESTS_LIST'), false);
    assert.equal(contests.includes('cos_contests_updated'), false);
    assert.equal(superAdmin.includes('MOCK_AUTH_USERS'), false);
    assert.equal(superAdmin.includes('password123'), false);
    assert.equal(overlay.includes('password123'), false);
    assert.equal(overlay.includes('superadmin@contestos.com'), false);
    const loginForm = source('src/features/auth/components/login-form.tsx');
    assert.equal(loginForm.includes('STATIC_PRESETS'), false);
    assert.equal(loginForm.includes('password123'), false);
    assert.equal(loginForm.includes('creator@ripskis.com'), false);
  });

  it('invalidates the moderation queue query after approve and reject', () => {
    const moderation = source('src/features/admin/hooks/use-moderation-queue.ts');
    assert.match(moderation, /invalidateQueries/);
    assert.match(moderation, /moderationQueueQueryKey/);
    assert.match(
      source('src/features/judging/hooks/use-contest-queue.ts'),
      /VIEWER_MUTE_STORAGE_KEY/
    );
    assert.match(source('src/lib/axios.ts'), /STORAGE_KEYS\.AUTH_TOKEN/);
  });
});
