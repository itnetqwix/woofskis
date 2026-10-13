export type UserRole =
  | 'ADMIN'
  | 'CREATOR'
  | 'GUEST'
  | 'ORGANIZATION_ADMIN'
  | 'MODERATOR'
  | 'PLATFORM_ADMIN'
  // Backend JWT / Prisma roles (M02-P01). Session adapter maps
  // BRAND_ADMIN → ORGANIZATION_ADMIN and SUPER_ADMIN → PLATFORM_ADMIN.
  // M03-P02 RoleGuard still matches these frontend aliases (not Prisma names).
  | 'BRAND_ADMIN'
  | 'SUPER_ADMIN'
  | 'VIEWER'
  // Lowercase legacy compatibility
  | 'superadmin'
  | 'organizer'
  | 'judge'
  | 'participant'
  | 'spectator';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: UserRole;
  avatarUrl?: string;
  bio?: string;
  category?: string;
  tenantId?: string;
  /** Backend `User.organizationId` (UUID). Distinct from prototype `tenantId` slug. */
  organizationId?: string | null;
  organizationName?: string;
  subdomain?: string;
  customDomain?: string;
  isTermsAccepted?: boolean;
  createdAt?: string;
  stats?: {
    submissionsCount?: number;
    contestsOrganized?: number;
    moderationResolved?: number;
    earnings?: number;
    reputationScore?: number;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface CreatorRegisterPayload {
  fullName: string;
  username: string;
  email: string;
  password: string;
  category: string;
  bio?: string;
  avatarUrl?: string;
  agreeToTerms: boolean;
}

export interface BrandRegisterPayload {
  organizationName: string;
  businessEmail: string;
  category: string;
  subdomain: string;
  customDomain?: string;
  adminName: string;
  password: string;
  brandColor?: string;
  accentColor?: string;
  tagline?: string;
  agreeToTerms: boolean;
}

export interface AuthSessionState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole;
}
