export const APP_ROUTES = {
  HOME: '/',
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
  },
  DASHBOARD: {
    ROOT: '/dashboard',
    CONTESTS: '/dashboard/contests',
    CONTEST_DETAIL: (id: string) => `/dashboard/contests/${id}`,
    CONTEST_CREATE: '/dashboard/contests/create',
    SUBMISSIONS: '/dashboard/submissions',
    SUBMISSION_DETAIL: (id: string) => `/dashboard/submissions/${id}`,
    JUDGING: '/dashboard/judging',
    LEADERBOARD: (id: string) => `/dashboard/contests/${id}/leaderboard`,
    ANALYTICS: '/dashboard/analytics',
    SETTINGS: '/dashboard/settings',
  },
  CREATOR: '/creator',
  SUPER_ADMIN: '/super-admin',
  ADMIN: {
    MODERATION: '/admin/moderation',
    CONTESTS: '/admin/contests',
    BRANDS: '/admin/brands',
  },
  PUBLIC_CONTESTS: {
    LIST: '/contests',
    DETAIL: (id: string) => `/contests/${id}`,
    LEADERBOARD: (id: string) => `/contests/${id}/leaderboard`,
  },
} as const;
