export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REFRESH: '/auth/refresh',
  },
  CONTESTS: {
    LIST: '/contests',
    DETAIL: (id: string) => `/contests/${id}`,
    CREATE: '/contests',
    UPDATE: (id: string) => `/contests/${id}`,
    DELETE: (id: string) => `/contests/${id}`,
    LEADERBOARD: (id: string) => `/contests/${id}/leaderboard`,
  },
  SUBMISSIONS: {
    LIST: '/submissions',
    DETAIL: (id: string) => `/submissions/${id}`,
    CREATE: '/submissions',
    SCORE: (id: string) => `/submissions/${id}/score`,
  },
  TEAMS: {
    LIST: '/teams',
    DETAIL: (id: string) => `/teams/${id}`,
    MEMBERS: (id: string) => `/teams/${id}/members`,
  },
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
  },
} as const;
