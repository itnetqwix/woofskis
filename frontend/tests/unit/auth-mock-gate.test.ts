import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AUTH_API_PATHS } from '../../src/services/auth-api';
import { toRegisterCreatorRequest } from '../../src/features/auth/lib/auth-payloads';

describe('M02-P02 mock auth path gate', () => {
  it('production auth helpers target live M02-P01 paths only', () => {
    assert.equal(AUTH_API_PATHS.LOGIN, '/auth/login');
    assert.equal(AUTH_API_PATHS.REGISTER_CREATOR, '/auth/register/creator');
    assert.equal(AUTH_API_PATHS.ME, '/auth/me');
    assert.equal('REGISTER_BRAND' in AUTH_API_PATHS, false);
  });

  it('creator API body cannot include DEMO/MOCK identity fields', () => {
    const body = toRegisterCreatorRequest({
      fullName: 'Alex Rivera',
      username: '@alex_woofskis',
      email: 'creator@woofskis.com',
      password: 'password123',
      category: 'Action Sports & VFX',
      agreeToTerms: true,
    });
    assert.equal('username' in body, false);
    assert.notEqual(body.name, '@alex_woofskis');
  });
});
