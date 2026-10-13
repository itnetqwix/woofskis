export type UserRole = 'superadmin' | 'organizer' | 'judge' | 'participant' | 'spectator';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: UserRole;
  avatarUrl?: string;
  bio?: string;
  githubUrl?: string;
  websiteUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  contestsEnteredCount: number;
  contestsWonCount: number;
  totalPoints: number;
  ranking: number;
}
