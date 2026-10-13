import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AppApiError } from '../../src/lib/axios';
import { deletionErrorMessage } from '../../src/features/submissions/hooks/use-creator-submissions';
import { creatorDeletionNote } from '../../src/services/admin-creators-api';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

function source(path: string): string {
  return readFileSync(join(ROOT, path), 'utf8');
}

describe('creator submission delete UI', () => {
  it('confirms with the video title and deletes only after the API succeeds', () => {
    const dialog = source('src/features/submissions/components/delete-submission-dialog.tsx');
    const page = source('src/app/(dashboard)/creator/page.tsx');
    const hook = source('src/features/submissions/hooks/use-creator-submissions.ts');
    const table = source('src/features/submissions/components/submissions-table.tsx');

    assert.match(dialog, /Are you sure you want to delete this video\?/);
    assert.match(dialog, /Cancel/);
    assert.match(dialog, /Delete Video/);
    assert.match(dialog, /\{title/);
    assert.match(page, /title=\{deleteTarget\?\.title/);
    assert.match(page, /setDeleteTarget\(item\)/);
    assert.doesNotMatch(page, /onDelete=\{deleteSubmission\}/);
    assert.match(table, /onDelete\(item\)/);
    assert.match(dialog, /disabled=\{deleting\}/);

    const fn = hook.slice(hook.indexOf('const deleteSubmission'), hook.indexOf('const [contests'));
    const call = fn.indexOf('await deleteMySubmission');
    const filter = fn.indexOf('setSubmissions');
    assert.ok(call > 0);
    assert.ok(filter > call);
    assert.match(fn, /deletesInFlight/);
  });

  it('keeps the list when deletion fails and labels admin-visible deletes', () => {
    assert.equal(
      deletionErrorMessage(new AppApiError('Submission not found', 404)),
      'Submission not found'
    );
    assert.equal(deletionErrorMessage(new Error('database unavailable')), 'database unavailable');
    assert.match(deletionErrorMessage(null), /could not be deleted/);
    assert.equal(
      creatorDeletionNote({
        deletedAt: '2026-10-11T12:00:00.000Z',
        deletedBy: { name: 'Ada' },
      })?.startsWith('Deleted by Ada'),
      true
    );
    assert.equal(creatorDeletionNote({ deletedAt: null, deletedBy: null }), null);
  });
});
