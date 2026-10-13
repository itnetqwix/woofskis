import { AppApiError } from '../../../lib/axios';

/**
 * Map backend auth errors onto the existing form error dictionaries
 * (Formik-compatible `Record<field, message>` / `submit`).
 *
 * The login / register screens currently use local `useState` error maps,
 * not Formik instances. Keys match the visible form fields so they can be
 * passed to Formik `setErrors` later without a redesign.
 *
 * Frozen messages (M02-P01):
 * - 401 login: `Invalid email or password`
 * - 409 creator/brand email: `User with this email already exists`
 * - 409 brand slug: `Organization with this slug already exists`
 *
 * 400 Zod `{ field, message }[]` is mapped when present. Detailed `errors`
 * item schema remains NOT SPECIFIED beyond that existing backend shape.
 */

export type AuthFormKind = 'login' | 'creator' | 'brand';

const API_FIELD_TO_FORM: Record<AuthFormKind, Record<string, string>> = {
  login: {
    email: 'email',
    password: 'password',
  },
  creator: {
    email: 'email',
    password: 'password',
    name: 'fullName',
  },
  brand: {
    email: 'businessEmail',
    password: 'password',
    name: 'adminName',
    organizationName: 'organizationName',
    slug: 'subdomain',
  },
};

export function mapAuthApiErrorToFormErrors(
  error: unknown,
  form: AuthFormKind
): Record<string, string> {
  if (!(error instanceof AppApiError)) {
    return { submit: 'Unable to complete the request. Please try again.' };
  }

  if (error.statusCode === 401) {
    return { submit: error.message || 'Invalid email or password' };
  }

  if (error.statusCode === 409) {
    return mapConflict(error.message, form);
  }

  const fieldErrors = mapValidationFields(error.errors, form);
  if (Object.keys(fieldErrors).length > 0) {
    return fieldErrors;
  }

  return { submit: error.message || 'Request failed. Please try again.' };
}

function mapConflict(message: string, form: AuthFormKind): Record<string, string> {
  const lower = message.toLowerCase();
  if (lower.includes('email')) {
    const emailField = form === 'brand' ? 'businessEmail' : 'email';
    return { [emailField]: message, submit: message };
  }
  if (lower.includes('slug') || lower.includes('organization')) {
    const slugField = form === 'brand' ? 'subdomain' : 'submit';
    return { [slugField]: message, submit: message };
  }
  return { submit: message };
}

function mapValidationFields(errors: unknown, form: AuthFormKind): Record<string, string> {
  const mapped: Record<string, string> = {};
  const fieldMap = API_FIELD_TO_FORM[form];

  if (!Array.isArray(errors)) {
    return mapped;
  }

  for (const item of errors) {
    if (!item || typeof item !== 'object') continue;
    const field = 'field' in item ? String((item as { field: unknown }).field) : '';
    const message = 'message' in item ? String((item as { message: unknown }).message) : '';
    if (!field || !message) continue;
    const formField = fieldMap[field] ?? field;
    mapped[formField] = message;
  }

  return mapped;
}
