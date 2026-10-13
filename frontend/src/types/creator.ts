export type SubmissionStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'FLAGGED';

export type SubmissionCategory =
  | 'Standup Comedy'
  | 'VFX Skit'
  | 'Parody'
  | 'Street Comedy'
  | 'Motion Graphics'
  | 'Action Sports'
  | 'Sci-Fi Short'
  | '3D Animation';

export interface CreatorSubmissionItem {
  id: string;
  title: string;
  contestId: string;
  contestName: string;
  category: string;
  videoUrl: string;
  thumbnailUrl: string;
  durationSeconds: number;
  status: SubmissionStatus;
  rejectionReason?: string;
  communityScore?: number;
  totalVotes?: number;
  rank?: number;
  submittedAt: string; // ISO date string
  description?: string;
  tags?: string[];
  fileSizeMb?: number;
  aspectRatio?: string; // e.g. '9:16' | '16:9'
  creatorName?: string;
  creatorHandle?: string;
  creatorAvatarUrl?: string;
  isFlagged?: boolean;
  flagReason?: string;
  flagScore?: number;
  reviewedAt?: string;
  reviewedBy?: string;
  resolution?: string;
  fps?: number;
  audioBitrate?: string;
  complianceChecks?: {
    resolutionPass?: boolean;
    aspectRatioPass?: boolean;
    audioCleared?: boolean;
    policyCompliant?: boolean;
    durationCompliant?: boolean;
  };
}

export interface SubmissionFormValues {
  title: string;
  contestId: string;
  category: string;
  tags: string[];
  description: string;
  videoFile: File | null;
  videoPreviewUrl: string | null;
  durationSeconds: number;
  agreeTerms: boolean;
}

export interface ActiveContestInfo {
  id: string;
  title: string;
  status: string;
  season: string;
  tagline: string;
  description: string;
  bannerUrl?: string;
  thumbnailUrl?: string;
  timezone?: string;
  votingClosesAt?: string | null;
  prizePool: string;
  prizeSummary: string | null;
  prizePoolAmount: number;
  currency: string;
  deadline: string; // ISO date string
  startDate: string;
  categories: string[];
  entryCount: number;
  rulesSummary: string;
  aspectRatioRequirement: string;
  maxDurationSeconds: number;
  allowedFormats: string[];
  maxFileSizeMb: number;
}

export interface CreatorMetrics {
  totalSubmissions: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  approvalRate: number; // percentage 0-100
  averageScore: number;
  bestRank: number | null;
  totalVotesReceived: number;
}

export type SubmissionFilterStatus = 'ALL' | 'APPROVED' | 'PENDING_REVIEW' | 'REJECTED' | 'FLAGGED';
