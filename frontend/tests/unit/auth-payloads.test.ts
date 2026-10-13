import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  toLoginRequest,
  toRegisterCreatorRequest,
} from '../../src/features/auth/lib/auth-payloads';
import type { CreatorRegisterPayload, LoginCredentials } from '../../src/types/auth';

describe('M02-P02 auth form → API payload mapping', () => {
  it('maps creator fullName to name and omits username/handle/avatar/category/bio', () => {
    const form: CreatorRegisterPayload = {
      fullName: 'Jane Doe',
      username: '@jane_handle',
      email: 'jane@example.com',
      password: 'SecurePassword123!',
      category: 'Comedy & Skits',
      bio: 'hello',
      avatarUrl: 'https://example.com/a.png',
      agreeToTerms: true,
    };

    const body = toRegisterCreatorRequest(form);
    assert.deepEqual(body, {
      email: 'jane@example.com',
      password: 'SecurePassword123!',
      name: 'Jane Doe',
    });
    assert.deepEqual(Object.keys(body).sort(), ['email', 'name', 'password']);
    assert.equal('username' in body, false);
    assert.equal('handle' in body, false);
    assert.equal('avatarUrl' in body, false);
    assert.equal('category' in body, false);
    assert.equal('bio' in body, false);
    assert.equal('agreeToTerms' in body, false);
  });

  it('login omits rememberMe', () => {
    const credentials: LoginCredentials = {
      email: 'creator@example.com',
      password: 'pw',
      rememberMe: true,
    };
    const body = toLoginRequest(credentials);
    assert.deepEqual(body, { email: 'creator@example.com', password: 'pw' });
    assert.equal('rememberMe' in body, false);
  });
});
