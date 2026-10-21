'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ContestConfigItem, ContestLifecycleStatus } from '@/types/tenant';
import { AppApiError } from '@/lib/axios';
import {
  createContest as createContestRequest,
  deleteContest as deleteContestRequest,
  listContests,
  scheduleContestJudging,
  updateContest as updateContestRequest,
  type ApiContest,
  type ApiContestStatus,
} from '@/services/contests-api';
import {
  apiContestToConfigItem,
  toCreateContestRequest,
  toUpdateContestRequest,
  type ContestFormSource,
} from '@/features/admin/lib/contest-api';

export type ContestSortOption =
  'newest' | 'prize_high' | 'prize_low' | 'entries' | 'votes' | 'deadline';

export type ContestActionResult =
  { ok: true; contest: ContestConfigItem } | { ok: false; message: string };

const UNSUPPORTED_DUPLICATE =
  'Contest duplication is not available. No duplicate API is defined for M05.';
const ACTIVE_DELETE_BLOCKED = 'Active contests cannot be deleted';

function failureMessage(error: unknown): string {
  if (error instanceof AppApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return 'Contest request failed';
}

export function useContestsManagement() {
  const [allContests, setAllContests] = useState<ContestConfigItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [brandFilter, setBrandFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<ContestSortOption>('newest');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reloadContests = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    listContests()
      .then((envelope) => {
        if (cancelled) return;
        if (!envelope.success || !Array.isArray(envelope.data)) {
          setLoadError(envelope.message || 'Contests could not be loaded');
          setAllContests([]);
          return;
        }
        setLoadError(null);
        setAllContests(envelope.data.map(apiContestToConfigItem));
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(failureMessage(error));
        setAllContests([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const tenantScopedContests = allContests;

  const filteredContests = useMemo(() => {
    return tenantScopedContests
      .filter((contest) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = contest.title.toLowerCase().includes(q);
          const matchTagline = contest.tagline?.toLowerCase().includes(q) || false;
          const matchTenant = contest.tenantId.toLowerCase().includes(q);
          const matchCategory = contest.categories.some((c) => c.toLowerCase().includes(q));
          if (!matchTitle && !matchTagline && !matchTenant && !matchCategory) return false;
        }

        if (brandFilter !== 'ALL' && contest.tenantId !== brandFilter) {
          return false;
        }

        if (statusFilter !== 'ALL' && contest.status !== statusFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'prize_high') {
          return (b.prizePool.total || 0) - (a.prizePool.total || 0);
        }
        if (sortBy === 'prize_low') {
          return (a.prizePool.total || 0) - (b.prizePool.total || 0);
        }
        if (sortBy === 'entries') {
          return (b.entriesCount || 0) - (a.entriesCount || 0);
        }
        if (sortBy === 'votes') {
          return (b.votesCount || 0) - (a.votesCount || 0);
        }
        if (sortBy === 'deadline') {
          return new Date(a.deadlineDate).getTime() - new Date(b.deadlineDate).getTime();
        }
        return 0;
      });
  }, [tenantScopedContests, searchQuery, brandFilter, statusFilter, sortBy]);

  const metrics = useMemo(() => {
    const totalContests = tenantScopedContests.length;
    const count = (status: ContestLifecycleStatus) =>
      tenantScopedContests.filter((contest) => contest.status === status).length;

    return {
      totalContests,
      activeCount: count('ACTIVE'),
      scheduledCount: count('SCHEDULED'),
      draftCount: count('DRAFT'),
      judgingCount: count('JUDGING'),
      completedCount: count('COMPLETED'),
      archivedCount: count('ARCHIVED'),
      totalPrizePool: tenantScopedContests.reduce((sum, c) => sum + (c.prizePool.total || 0), 0),
      totalEntries: tenantScopedContests.reduce((sum, c) => sum + (c.entriesCount || 0), 0),
      totalVotes: tenantScopedContests.reduce((sum, c) => sum + (c.votesCount || 0), 0),
    };
  }, [tenantScopedContests]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: tenantScopedContests.length,
      DRAFT: 0,
      SCHEDULED: 0,
      ACTIVE: 0,
      JUDGING: 0,
      COMPLETED: 0,
      ARCHIVED: 0,
    };
    tenantScopedContests.forEach((contest) => {
      if (counts[contest.status] !== undefined) {
        counts[contest.status] += 1;
      }
    });
    return counts;
  }, [tenantScopedContests]);

  const remember = useCallback((contest: ApiContest) => {
    const item = apiContestToConfigItem(contest);
    setAllContests((prev) => {
      const index = prev.findIndex((row) => row.id === item.id);
      if (index === -1) return [item, ...prev];
      const next = prev.slice();
      next[index] = item;
      return next;
    });
    return item;
  }, []);

  const createContest = useCallback(
    async (newContestData: ContestFormSource): Promise<ContestActionResult> => {
      try {
        const envelope = await createContestRequest(toCreateContestRequest(newContestData));
        if (!envelope.success || !envelope.data) {
          return { ok: false, message: envelope.message || 'Contest could not be created' };
        }
        return { ok: true, contest: remember(envelope.data) };
      } catch (error) {
        return { ok: false, message: failureMessage(error) };
      }
    },
    [remember]
  );

  const updateContest = useCallback(
    async (contestId: string, updates: ContestFormSource): Promise<ContestActionResult> => {
      try {
        const envelope = await updateContestRequest(contestId, toUpdateContestRequest(updates));
        if (!envelope.success || !envelope.data) {
          return { ok: false, message: envelope.message || 'Contest could not be updated' };
        }
        return { ok: true, contest: remember(envelope.data) };
      } catch (error) {
        return { ok: false, message: failureMessage(error) };
      }
    },
    [remember]
  );

  const transitionStatus = useCallback(
    async (contestId: string, newStatus: ContestLifecycleStatus): Promise<ContestActionResult> => {
      if (
        newStatus !== 'DRAFT' &&
        newStatus !== 'SCHEDULED' &&
        newStatus !== 'ACTIVE' &&
        newStatus !== 'JUDGING' &&
        newStatus !== 'COMPLETED' &&
        newStatus !== 'ARCHIVED'
      ) {
        return { ok: false, message: `Status ${newStatus} is not a contest lifecycle status` };
      }

      try {
        const envelope = await updateContestRequest(contestId, {
          status: newStatus as ApiContestStatus,
        });
        if (!envelope.success || !envelope.data) {
          return { ok: false, message: envelope.message || 'Contest status could not be updated' };
        }
        return { ok: true, contest: remember(envelope.data) };
      } catch (error) {
        return { ok: false, message: failureMessage(error) };
      }
    },
    [remember]
  );

  const scheduleJudging = useCallback(
    async (contestId: string, taglineConfirmation: string): Promise<ContestActionResult> => {
      try {
        const envelope = await scheduleContestJudging(contestId, taglineConfirmation);
        if (!envelope.success || !envelope.data) {
          return { ok: false, message: envelope.message || 'Could not schedule judging transition' };
        }
        return { ok: true, contest: remember(envelope.data) };
      } catch (error) {
        return { ok: false, message: failureMessage(error) };
      }
    },
    [remember]
  );

  const duplicateContest = useCallback(async (_contestId: string): Promise<ContestActionResult> => {
    return { ok: false, message: UNSUPPORTED_DUPLICATE };
  }, []);

  const deleteContest = useCallback(
    async (contestId: string): Promise<ContestActionResult> => {
      const current = allContests.find((contest) => contest.id === contestId);
      if (current?.status === 'ACTIVE' || current?.status === 'JUDGING') {
        return {
          ok: false,
          message:
            current.status === 'ACTIVE'
              ? ACTIVE_DELETE_BLOCKED
              : 'Contests in judging cannot be deleted while voting is open',
        };
      }
      try {
        const envelope = await deleteContestRequest(contestId);
        if (!envelope.success) {
          return { ok: false, message: envelope.message || 'Contest could not be deleted' };
        }
        setAllContests((prev) => prev.filter((contest) => contest.id !== contestId));
        return {
          ok: true,
          contest: current ?? {
            id: contestId,
            tenantId: 'woofskis',
            title: 'Contest',
            description: '',
            categories: [],
            rules: '',
            startDate: '',
            deadlineDate: '',
            votingCloseDate: '',
            mediaConstraints: {
              maxDurationSeconds: 60,
              minDurationSeconds: 1,
              aspectRatio: '9:16',
              maxFileSizeMb: 100,
              allowedFormats: ['mp4', 'webm'],
            },
            prizePool: { total: 0, currency: 'USD', distribution: [] },
            status: 'DRAFT',
            entriesCount: 0,
            votesCount: 0,
            createdAt: '',
            updatedAt: '',
          },
        };
      } catch (error) {
        return { ok: false, message: failureMessage(error) };
      }
    },
    [allContests]
  );

  return {
    contests: tenantScopedContests,
    allContests,
    filteredContests,
    searchQuery,
    brandFilter,
    statusFilter,
    sortBy,
    metrics,
    statusCounts,
    isLoaded,
    loadError,
    isPlatformAdmin: false,
    userTenantId: 'woofskis',
    setSearchQuery,
    setBrandFilter,
    setStatusFilter,
    setSortBy,
    createContest,
    updateContest,
    transitionStatus,
    scheduleJudging,
    duplicateContest,
    deleteContest,
    reloadContests,
  };
}
