import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertNoPasswordHash,
  mapApiRoleToSessionRole,
  mapApiUserToAuthUser,
} from '../../src/features/auth/lib/map-auth-user';
import type { ApiAuthUser } from '../../src/services/auth-api';

describe('map API user to AuthUser', () => {
  const creator: ApiAuthUser = {
    id: 'u1',
    email: 'jane@example.com',
    name: 'Jane Doe',
    role: 'CREATOR',
    createdAt: '2026-09-22T12:00:00.000Z',
  };

  it('maps name to displayName', () => {
    const user = mapApiUserToAuthUser(creator);
    assert.equal(user.displayName, 'Jane Doe');
    assert.equal(user.email, 'jane@example.com');
    assert.equal(user.role, 'CREATOR');
    assert.equal(user.username, 'jane');
    assert.equal('passwordHash' in user, false);
  });

  it('maps ADMIN', () => {
    assert.equal(mapApiRoleToSessionRole('ADMIN'), 'ADMIN');
  });

  it('strips passwordHash if a backend payload ever includes it', () => {
    const leaked = {
      ...creator,
      passwordHash: 'should-never-leak',
    } as ApiAuthUser & { passwordHash: string };
    const user = mapApiUserToAuthUser(leaked);
    assert.equal('passwordHash' in user, false);
  });

  it('assertNoPasswordHash throws when hash is present', () => {
    assert.throws(() => assertNoPasswordHash({ passwordHash: 'x' }));
    assert.doesNotThrow(() => assertNoPasswordHash({ id: 'u1' }));
  });
});
