import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(
  new URL('../../src/features/submissions/components/upload-modal.tsx', import.meta.url),
  'utf8'
);

describe('creator upload experience', () => {
  it('does not fill the video title from the filename', () => {
    assert.equal(source.includes('file.name.replace'), false);
    assert.match(source, /Video Title/);
    assert.match(source, /Title must be at least 3 characters/);
  });

  it('does not show storage infrastructure copy to the creator', () => {
    const visible = source.replace(/from ['"][^'"]+['"]/g, '');
    assert.equal(/S3|presigned|object key/i.test(visible), false);
    assert.match(source, /Uploading video/);
    assert.match(source, /Video uploaded successfully/);
  });
});
