export type ContestStatus =
  'draft' | 'upcoming' | 'registration_open' | 'in_progress' | 'judging' | 'completed' | 'archived';

export type ContestFormat = 'individual' | 'team' | 'hackathon' | 'bracket_tournament';

export interface ContestRule {
  id: string;
  title: string;
  description: string;
}

export interface ScoringCriterion {
  id: string;
  name: string;
  weight: number; // 0-100 or percentage
  maxPoints: number;
  description?: string;
}

export interface Contest {
  id: string;
  title: string;
  slug: string;
  tagline?: string;
  description: string;
  status: ContestStatus;
  format: ContestFormat;
  maxTeamSize?: number;
  prizePoolTotal?: number;
  currency?: string;
  bannerUrl?: string;
  thumbnailUrl?: string;
  rules?: ContestRule[];
  scoringCriteria?: ScoringCriterion[];
  registrationStartDate: string;
  registrationEndDate: string;
  startDate: string;
  endDate: string;
  organizerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  id: string;
  contestId: string;
  teamId?: string;
  userId: string;
  title: string;
  description: string;
  repoUrl?: string;
  demoUrl?: string;
  mediaUrls?: string[];
  submittedAt: string;
  score?: number;
  rank?: number;
  status: 'submitted' | 'under_review' | 'scored' | 'disqualified';
}

export interface LeaderboardEntry {
  rank: number;
  participantId: string;
  participantName: string;
  avatarUrl?: string;
  score: number;
  submissionsCount: number;
  badge?: string;
}

export interface ContestVideoItem {
  id: string;
  contestId?: string;
  contestStatus?: string;
  ratingOpen?: boolean;
  title: string;
  creatorName: string;
  creatorHandle?: string;
  creatorAvatarUrl?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  category: string;
  communityScore: number;
  totalVotes: number;
  viewerRating?: number | null;
  description?: string;
  tags?: string[];
  durationSeconds?: number;
}

export interface RatingSubmission {
  videoId: string;
  rating: number;
  timestamp: string;
  feedback?: string;
}

export interface AggregatedScoreResult {
  videoId: string;
  previousScore: number;
  previousVotes: number;
  userRating: number;
  newCommunityScore: number;
  newTotalVotes: number;
  delta: number;
}

export interface RatingScaleDefinition {
  value: number;
  label: string;
  description: string;
  colorClass: string;
}
