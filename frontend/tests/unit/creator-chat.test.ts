import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));

function read(relative: string) {
  return readFileSync(new URL(relative, import.meta.url), 'utf8');
}

describe('creator chat UI', () => {
  const friends = read('../../src/features/friends/components/friends-panel.tsx');
  const chat = read('../../src/features/chat/components/creator-chat.tsx');
  const api = read('../../src/services/chat-api.ts');
  const stream = read('../../src/features/chat/chat-stream.ts');
  const page = read('../../src/app/(dashboard)/creator/friends/[friendshipId]/page.tsx');
  const friendsPage = read('../../src/app/(dashboard)/creator/friends/page.tsx');

  it('opens a conversation from an accepted friend and guards the page', () => {
    assert.match(friends, /href=\{`\/creator\/friends\/\$\{friendshipId\}`\}/);
    assert.match(friends, />\s*Message\s*</);
    const incoming = friends.match(
      /relationship === 'INCOMING'[\s\S]*?relationship === 'OUTGOING'/
    );
    assert.ok(incoming);
    assert.doesNotMatch(incoming[0], /Message/);
    assert.match(page, /<RoleGuard route="\/creator\/friends">/);
    assert.match(page, /focus/);
    assert.doesNotMatch(friendsPage, /ChatInbox/);
    assert.equal(root.length > 0, true);
  });

  it('shows history, unread, read state, emoji, and failure handling', () => {
    assert.match(chat, /unreadCount/);
    assert.match(chat, /No messages yet/);
    assert.match(chat, /Load earlier messages/);
    assert.match(chat, /Reconnecting/);
    assert.match(chat, /Upload progress/);
    assert.match(chat, /Failed/);
    assert.match(chat, /Retry/);
    assert.match(chat, /Insert emoji/);
    assert.match(chat, /message\.read \? ' · Read' : ' · Sent'/);
    assert.match(chat, /hidden md:block/);
    assert.match(chat, /md:hidden/);
  });

  it('uploads through a presigned private URL and does not embed AWS keys', () => {
    assert.match(api, /\/chat\/attachments\/presign/);
    assert.match(chat, /presignChatAttachment/);
    assert.match(chat, /putFileToPresignedUrl/);
    assert.doesNotMatch(api, /AWS_SECRET|AWS_ACCESS_KEY|public-read/);
    assert.doesNotMatch(chat, /AWS_SECRET|public-read/);
    assert.match(stream, /text\/event-stream/);
    assert.match(stream, /Authorization/);
    assert.doesNotMatch(stream, /socket\.io|new WebSocket/);
  });
});
