import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { nativeShareCandidates } from '../../src/features/judging/lib/share-target';

const PAGE = 'https://www.woofskis.com/?v=22222222-2222-4222-8222-222222222221';

describe('native share payloads', () => {
  it('keeps the video message and does not offer a bare url', () => {
    const text = 'Watch "Park zoomies" by Ada on Woofskis\nA very good dog.';
    const candidates = nativeShareCandidates({
      title: 'Park zoomies',
      text,
      url: PAGE,
    });
    assert.equal(candidates.length > 0, true);
    for (const candidate of candidates) {
      const body = `${candidate.text ?? ''}\n${candidate.url ?? ''}`;
      assert.match(body, /Park zoomies/);
      assert.match(body, /Ada/);
      assert.match(body, /A very good dog/);
      assert.match(body, new RegExp(PAGE.replace(/[?]/g, '\\?')));
      assert.notDeepEqual(candidate, { url: PAGE });
    }
    assert.equal(candidates[0]?.url, PAGE);
    assert.equal(candidates[0]?.text, text);
  });
});
