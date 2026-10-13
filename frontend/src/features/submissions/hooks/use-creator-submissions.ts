'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  ActiveContestInfo,
  CreatorSubmissionItem,
  CreatorMetrics,
  SubmissionFilterStatus,
} from '@/types/creator';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { AppApiError } from '@/lib/axios';
import { listCreatorContests, type ApiContest } from '@/services/contests-api';
import { deleteMySubmission, listMySubmissions } from '@/services/submissions-api';
import { rulesToText } from '@/features/admin/lib/contest-api';
import { mapApiSubmission } from '@/features/submissions/lib/map-submission';
import {
  ALLOWED_VIDEO_CONTENT_TYPES,
  MAX_VIDEO_DURATION_SECONDS,
  MAX_VIDEO_FILE_SIZE_BYTES,
} from '@/features/submissions/lib/video-constraints';

export type SortOption = 'newest' | 'score' | 'votes';

export interface UseCreatorSubmissionsReturn {
  submissions: CreatorSubmissionItem[];
  filteredSubmissions: CreatorSubmissionItem[];
  filterStatus: SubmissionFilterStatus;
  searchQuery: string;
  categoryFilter: string;
  sortBy: SortOption;
  metrics: CreatorMetrics;
  statusCounts: Record<SubmissionFilterStatus, number>;
  contests: ActiveContestInfo[];
  selectedContestId: string | null;
  activeContest: ActiveContestInfo | null;
  loadError: string | null;
  isLoaded: boolean;
  setFilterStatus: (status: SubmissionFilterStatus) => void;
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: string) => void;
  setSortBy: (sort: SortOption) => void;
  setSelectedContestId: (contestId: string) => void;
  addSubmission: (item: CreatorSubmissionItem) => void;
  deleteSubmission: (id: string) => Promise<void>;
  reloadSubmissions: () => void;
  resetToMockData: () => void;
}

function failureMessage(error: unknown): string {
  if (error instanceof AppApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return 'Submissions could not be loaded';
}

/**
 * Creator submissions (M06-P04-T05 / T06 / T07).
 * Primary source is GET /submissions/me.
 * `cos_creator_submissions_v1` is not a source of truth.
 * Contest discovery uses GET /creator/contests and includes every status.
 * Delete calls DELETE /submissions/:id and drops the row only after success.
 */

export function deletionErrorMessage(error: unknown): string {
  if (error instanceof AppApiError && error.message) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return 'This video could not be deleted. Try again.';
}

function toCreatorContest(contest: ApiContest): ActiveContestInfo {
  return {
    id: contest.id,
    title: contest.title,
    status: contest.status,
    season: '',
    tagline: contest.tagline || '',
    description: contest.description,
    bannerUrl: contest.bannerUrl || undefined,
    thumbnailUrl: contest.thumbnailUrl || undefined,
    timezone: contest.timezone || 'Asia/Kolkata',
    votingClosesAt: contest.votingClosesAt || null,
    prizePool: contest.prizeSummary || '',
    prizeSummary: contest.prizeSummary,
    prizePoolAmount: 0,
    currency: 'USD',
    deadline: contest.endDate,
    startDate: contest.startDate,
    categories: contest.category ? [contest.category.name] : [],
    entryCount: 0,
    rulesSummary: rulesToText(contest.rules),
    aspectRatioRequirement: 'Not stored per contest',
    maxDurationSeconds: MAX_VIDEO_DURATION_SECONDS,
    allowedFormats: [...ALLOWED_VIDEO_CONTENT_TYPES],
    maxFileSizeMb: MAX_VIDEO_FILE_SIZE_BYTES / (1024 * 1024),
  };
}
export function useCreatorSubmissions(): UseCreatorSubmissionsReturn {
  const { isAuthenticated } = useAuthSession();
  const [submissions, setSubmissions] = useState<CreatorSubmissionItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [filterStatus, setFilterStatus] = useState<SubmissionFilterStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const reloadSubmissions = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!isAuthenticated) {
      setSubmissions([]);
      setLoadError(null);
      setIsLoaded(true);
      return;
    }

    setIsLoaded(false);
    listMySubmissions()
      .then((envelope) => {
        if (cancelled) return;
        if (!envelope.success || !Array.isArray(envelope.data)) {
          setLoadError(envelope.message || 'Submissions could not be loaded');
          setSubmissions([]);
          return;
        }
        setLoadError(null);
        setSubmissions(envelope.data.map(mapApiSubmission));
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(failureMessage(error));
        setSubmissions([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, reloadToken]);

  const statusCounts = useMemo(() => {
    const counts: Record<SubmissionFilterStatus, number> = {
      ALL: submissions.length,
      APPROVED: 0,
      PENDING_REVIEW: 0,
      REJECTED: 0,
      FLAGGED: 0,
    };

    submissions.forEach((item) => {
      if (item.status in counts) {
        counts[item.status]++;
      }
    });

    return counts;
  }, [submissions]);

  const metrics = useMemo<CreatorMetrics>(() => {
    const total = submissions.length;
    const approved = submissions.filter((s) => s.status === 'APPROVED');
    const pending = submissions.filter((s) => s.status === 'PENDING_REVIEW');
    const rejected = submissions.filter((s) => s.status === 'REJECTED');

    const totalVotesReceived = approved.reduce((sum, s) => sum + (s.totalVotes || 0), 0);

    const scoredApproved = approved.filter((s) => typeof s.communityScore === 'number');
    const averageScore =
      scoredApproved.length > 0
        ? Math.round(
            (scoredApproved.reduce((sum, s) => sum + (s.communityScore || 0), 0) /
              scoredApproved.length) *
              10
          ) / 10
        : 0;

    const ranks = approved
      .map((s) => s.rank)
      .filter((r): r is number => typeof r === 'number' && r > 0);
    const bestRank = ranks.length > 0 ? Math.min(...ranks) : null;

    const approvalRate = total > 0 ? Math.round((approved.length / total) * 100) : 0;

    return {
      totalSubmissions: total,
      approvedCount: approved.length,
      pendingCount: pending.length,
      rejectedCount: rejected.length,
      approvalRate,
      averageScore,
      bestRank,
      totalVotesReceived,
    };
  }, [submissions]);

  const filteredSubmissions = useMemo(() => {
    return submissions
      .filter((item) => {
        if (filterStatus !== 'ALL' && item.status !== filterStatus) {
          return false;
        }
        if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
          return false;
        }
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          const matchTitle = item.title.toLowerCase().includes(query);
          const matchDesc = item.description?.toLowerCase().includes(query) ?? false;
          const matchCategory = item.category.toLowerCase().includes(query);
          const matchTags = item.tags?.some((t) => t.toLowerCase().includes(query)) ?? false;
          if (!matchTitle && !matchDesc && !matchCategory && !matchTags) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'score') {
          return (b.communityScore || 0) - (a.communityScore || 0);
        }
        if (sortBy === 'votes') {
          return (b.totalVotes || 0) - (a.totalVotes || 0);
        }
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      });
  }, [submissions, filterStatus, categoryFilter, searchQuery, sortBy]);

  const addSubmission = useCallback((item: CreatorSubmissionItem) => {
    setSubmissions((prev) => [item, ...prev.filter((row) => row.id !== item.id)]);
  }, []);

  const deletesInFlight = useRef(new Map<string, Promise<void>>());

  const deleteSubmission = useCallback((id: string) => {
    const pending = deletesInFlight.current.get(id);
    if (pending) return pending;
    const job = (async () => {
      const envelope = await deleteMySubmission(id);
      if (!envelope.success || !envelope.data?.deleted) {
        throw new Error(envelope.message || 'This video could not be deleted. Try again.');
      }
      setSubmissions((prev) => prev.filter((item) => item.id !== id));
    })().finally(() => {
      deletesInFlight.current.delete(id);
    });
    deletesInFlight.current.set(id, job);
    return job;
  }, []);

  const [contests, setContests] = useState<ActiveContestInfo[]>([]);
  const [selectedContestId, setSelectedContestId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setContests([]);
      setSelectedContestId(null);
      return;
    }
    let cancelled = false;
    const load = () => {
      void listCreatorContests()
        .then((envelope) => {
          if (cancelled) return;
          const rows =
            envelope.success && Array.isArray(envelope.data)
              ? envelope.data.map(toCreatorContest)
              : [];
          setContests(rows);
          setSelectedContestId((current) =>
            current && rows.some((contest) => contest.id === current)
              ? current
              : (rows[0]?.id ?? null)
          );
        })
        .catch(() => {
          if (!cancelled) setContests([]);
        });
    };
    load();
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
    };
  }, [isAuthenticated, reloadToken]);

  const activeContest =
    contests.find((contest) => contest.id === selectedContestId) ??
    contests.find((contest) => contest.status === 'ACTIVE') ??
    null;

  return {
    submissions,
    filteredSubmissions,
    filterStatus,
    searchQuery,
    categoryFilter,
    sortBy,
    metrics,
    statusCounts,
    contests,
    selectedContestId,
    activeContest,
    loadError,
    isLoaded,
    setFilterStatus,
    setSearchQuery,
    setCategoryFilter,
    setSortBy,
    setSelectedContestId,
    addSubmission,
    deleteSubmission,
    reloadSubmissions,
    resetToMockData: reloadSubmissions,
  };
}
