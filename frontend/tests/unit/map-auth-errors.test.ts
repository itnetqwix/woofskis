import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AppApiError } from '../../src/lib/axios';
import { mapAuthApiErrorToFormErrors } from '../../src/features/auth/lib/map-auth-errors';

describe('M02-P02-T07 map backend auth errors to form messages', () => {
  it('maps 401 to the frozen login message on submit', () => {
    const err = new AppApiError('Invalid email or password', 401);
    const mapped = mapAuthApiErrorToFormErrors(err, 'login');
    assert.equal(mapped.submit, 'Invalid email or password');
  });

  it('maps 409 duplicate email onto creator email field', () => {
    const err = new AppApiError('User with this email already exists', 409);
    const mapped = mapAuthApiErrorToFormErrors(err, 'creator');
    assert.equal(mapped.email, 'User with this email already exists');
    assert.equal(mapped.submit, 'User with this email already exists');
  });

  it('maps 409 duplicate email onto brand businessEmail field', () => {
    const err = new AppApiError('User with this email already exists', 409);
    const mapped = mapAuthApiErrorToFormErrors(err, 'brand');
    assert.equal(mapped.businessEmail, 'User with this email already exists');
  });

  it('maps 409 duplicate slug onto brand subdomain field', () => {
    const err = new AppApiError('Organization with this slug already exists', 409);
    const mapped = mapAuthApiErrorToFormErrors(err, 'brand');
    assert.equal(mapped.subdomain, 'Organization with this slug already exists');
    assert.equal(mapped.submit, 'Organization with this slug already exists');
  });

  it('maps 400 Zod field errors onto form keys (name → fullName)', () => {
    const err = new AppApiError('Validation error', 400, undefined, [
      { field: 'name', message: 'Name must be at least 2 characters long' },
    ] as unknown as Record<string, string[]>);
    const mapped = mapAuthApiErrorToFormErrors(err, 'creator');
    assert.equal(mapped.fullName, 'Name must be at least 2 characters long');
  });
});
