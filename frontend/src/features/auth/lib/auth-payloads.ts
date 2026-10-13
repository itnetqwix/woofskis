import type { CreatorRegisterPayload, LoginCredentials } from '../../../types/auth';
import type { LoginRequest, RegisterCreatorRequest } from '../../../services/auth-api';

export function toRegisterCreatorRequest(payload: CreatorRegisterPayload): RegisterCreatorRequest {
  return {
    email: payload.email.trim(),
    password: payload.password,
    name: payload.fullName.trim(),
  };
}

export function toLoginRequest(credentials: LoginCredentials): LoginRequest {
  return {
    email: credentials.email.trim(),
    password: credentials.password,
  };
}
