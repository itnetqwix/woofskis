export const QUERY_KEYS = {
  AUTH: {
    ME: ['auth', 'me'] as const,
  },
  CONTESTS: {
    ALL: ['contests'] as const,
    LIST: (filters?: Record<string, any>) => ['contests', 'list', filters] as const,
    DETAIL: (id: string) => ['contests', 'detail', id] as const,
    LEADERBOARD: (id: string) => ['contests', 'leaderboard', id] as const,
  },
  SUBMISSIONS: {
    ALL: ['submissions'] as const,
    LIST: (filters?: Record<string, any>) => ['submissions', 'list', filters] as const,
    DETAIL: (id: string) => ['submissions', 'detail', id] as const,
  },
  TEAMS: {
    ALL: ['teams'] as const,
    LIST: (filters?: Record<string, any>) => ['teams', 'list', filters] as const,
    DETAIL: (id: string) => ['teams', 'detail', id] as const,
  },
  USERS: {
    PROFILE: (id: string) => ['users', 'profile', id] as const,
  },
} as const;
