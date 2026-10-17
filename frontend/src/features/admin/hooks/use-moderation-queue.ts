'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AdminSubmissionItem,
  AdminQueueMetrics,
  ContestLifecycleState,
  ModerationAuditLogItem,
  ModerationFilterStatus,
  ModerationSortOption,
  ModerationViewMode,
  RejectionReasonCode,
  ValidationChecklistState,
} from '@/types/admin';
import { REJECTION_REASON_PRESETS } from '@/constants/mock-admin-data';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { AppApiError } from '@/lib/axios';
import { mapAuditLog, mapQueueSubmission } from '@/features/admin/lib/map-moderation';
import {
  approveModerationSubmission,
  listModerationAuditLogs,
  listModerationQueue,
  rejectModerationSubmission,
} from '@/services/moderation-api';
import { getQueryClient } from '@/lib/query-client';
import { moderationQueueQueryKey } from '@/lib/query-keys';

const CONTEST_STATE_STORAGE_KEY = 'cos_contest_lifecycle_v1';

/**
 * Flag, unflag, and bulk actions stay on the prototype controls.
 * M07 does not define HTTP routes for them, so they are not persisted.
 */
export const UNSUPPORTED_MODERATION_ACTION =
  'That moderation action is not available on the moderation API.';

export interface UseModerationQueueReturn {
  submissions: AdminSubmissionItem[];
  allSubmissions: AdminSubmissionItem[];
  filteredSubmissions: AdminSubmissionItem[];
  selectedSubmission: AdminSubmissionItem | null;
  selectedSubmissionId: string | null;
  selectedIndex: number;
  filterStatus: ModerationFilterStatus;
  searchQuery: string;
  categoryFilter: string;
  sortBy: ModerationSortOption;
  viewMode: ModerationViewMode;
  metrics: AdminQueueMetrics;
  statusCounts: Record<ModerationFilterStatus, number>;
  contestLifecycle: ContestLifecycleState;
  isContestPaused: boolean;
  auditLogs: ModerationAuditLogItem[];
  selectedBatchIds: string[];
  isHydrated: boolean;
  loadError: string | null;
  actionError: string | null;
  isActing: boolean;
  isPlatformAdmin: boolean;
  userTenantId: string | undefined;
  setFilterStatus: (status: ModerationFilterStatus) => void;
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: string) => void;
  setSortBy: (sort: ModerationSortOption) => void;
  setViewMode: (mode: ModerationViewMode) => void;
  setSelectedSubmissionId: (id: string | null) => void;
  toggleBatchSelect: (id: string) => void;
  selectAllBatch: (ids: string[]) => void;
  clearBatchSelection: () => void;
  approveSubmission: (id: string, note?: string) => Promise<void>;
  rejectSubmission: (
    id: string,
    reasonCode: RejectionReasonCode,
    reasonNote: string
  ) => Promise<void>;
  flagSubmission: (id: string, flagReason: string) => void;
  unflagSubmission: (id: string) => void;
  batchApprove: (ids: string[]) => void;
  batchReject: (ids: string[], reasonCode: RejectionReasonCode, reasonNote: string) => void;
  toggleComplianceCheck: (id: string, checkKey: keyof ValidationChecklistState) => void;
  setContestLifecycle: (state: ContestLifecycleState) => void;
  toggleContestPause: () => void;
  goToNextSubmission: () => void;
  goToPrevSubmission: () => void;
  goToNextPending: () => void;
  goToPrevPending: () => void;
  resetQueue: () => void;
  reloadAuditLogs: () => void;
}

function invalidateModerationQueue(): void {
  void getQueryClient().invalidateQueries({ queryKey: moderationQueueQueryKey });
}

function failureMessage(error: unknown, fallback: string): string {
  if (error instanceof AppApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function useModerationQueue(): UseModerationQueueReturn {
  const { role, isAuthenticated } = useAuthSession();
  const isAdmin = role === 'ADMIN';
  const userTenantId = 'woofskis';

  const [submissions, setSubmissions] = useState<AdminSubmissionItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<ModerationAuditLogItem[]>([]);
  const [checklistOverrides, setChecklistOverrides] = useState<
    Record<string, ValidationChecklistState>
  >({});
  const [contestLifecycle, setContestLifecycleState] = useState<ContestLifecycleState>('ACTIVE');
  const [isHydrated, setIsHydrated] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const [filterStatus, setFilterStatus] = useState<ModerationFilterStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<ModerationSortOption>('urgency');
  const [viewMode, setViewMode] = useState<ModerationViewMode>('split');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);

  const reloadQueue = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    try {
      const storedContest = localStorage.getItem(CONTEST_STATE_STORAGE_KEY);
      if (
        storedContest &&
        ['ACTIVE', 'PENDING_RESULTS', 'PAUSED', 'CLOSED', 'ARCHIVED'].includes(storedContest)
      ) {
        setContestLifecycleState(storedContest as ContestLifecycleState);
      }
    } catch {
      // Contest lifecycle on this card is local prototype state, not M07.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!isAuthenticated) {
      setSubmissions([]);
      setAuditLogs([]);
      setLoadError(null);
      setIsHydrated(true);
      return;
    }

    setIsHydrated(false);
    Promise.all([listModerationQueue(), listModerationAuditLogs()])
      .then(([queueEnvelope, auditEnvelope]) => {
        if (cancelled) return;
        if (!queueEnvelope.success || !Array.isArray(queueEnvelope.data)) {
          setLoadError(queueEnvelope.message || 'Moderation queue could not be loaded');
          setSubmissions([]);
        } else {
          setLoadError(null);
          setSubmissions(queueEnvelope.data.map(mapQueueSubmission));
        }
        if (auditEnvelope.success && Array.isArray(auditEnvelope.data)) {
          setAuditLogs(auditEnvelope.data.map(mapAuditLog));
        } else if (queueEnvelope.success) {
          setLoadError(auditEnvelope.message || 'Audit logs could not be loaded');
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(failureMessage(error, 'Moderation queue could not be loaded'));
        setSubmissions([]);
        setAuditLogs([]);
      })
      .finally(() => {
        if (!cancelled) setIsHydrated(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, reloadToken]);

  const visibleSubmissions = useMemo(() => {
    return submissions.map((item) => {
      const override = checklistOverrides[item.id];
      return override ? { ...item, complianceChecks: override } : item;
    });
  }, [submissions, checklistOverrides]);

  const statusCounts = useMemo(() => {
    const counts: Record<ModerationFilterStatus, number> = {
      ALL: visibleSubmissions.length,
      PENDING_REVIEW: 0,
      APPROVED: 0,
      REJECTED: 0,
      FLAGGED: 0,
    };
    visibleSubmissions.forEach((item) => {
      if (item.status === 'FLAGGED' || item.isFlagged) counts.FLAGGED++;
      if (item.status in counts) counts[item.status]++;
    });
    return counts;
  }, [visibleSubmissions]);

  const metrics = useMemo<AdminQueueMetrics>(() => {
    const pending = visibleSubmissions.filter((item) => item.status === 'PENDING_REVIEW');
    const now = new Date();
    const isToday = (dateStr?: string) => {
      if (!dateStr) return false;
      const value = new Date(dateStr);
      return (
        value.getDate() === now.getDate() &&
        value.getMonth() === now.getMonth() &&
        value.getFullYear() === now.getFullYear()
      );
    };
    const approvedToday = auditLogs.filter(
      (entry) => entry.action === 'APPROVED' && isToday(entry.timestamp)
    ).length;
    const rejectedToday = auditLogs.filter(
      (entry) => entry.action === 'REJECTED' && isToday(entry.timestamp)
    ).length;
    const flaggedCount = auditLogs.filter((entry) => entry.action === 'FLAGGED').length;
    return {
      pendingCount: pending.length,
      approvedToday,
      rejectedToday,
      flaggedCount,
      avgReviewTimeSec: 0,
      totalSubmissions: visibleSubmissions.length,
      approvalVelocityPerHour: 0,
      compliancePassRate: 0,
    };
  }, [visibleSubmissions, auditLogs]);

  const filteredSubmissions = useMemo(() => {
    return visibleSubmissions
      .filter((item) => {
        if (filterStatus === 'FLAGGED') {
          if (!item.isFlagged && item.status !== 'FLAGGED') return false;
        } else if (filterStatus !== 'ALL' && item.status !== filterStatus) {
          return false;
        }
        if (categoryFilter === '__other__') {
          if (!item.category.startsWith('Other:')) return false;
        } else if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
          return false;
        }
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          const matches = [
            item.title,
            item.creatorName,
            item.creatorHandle,
            item.category,
            item.id,
            ...(item.tags ?? []),
          ].some((value) => value.toLowerCase().includes(query));
          if (!matches) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'oldest') {
          return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
        }
        if (sortBy === 'creator') return a.creatorName.localeCompare(b.creatorName);
        if (sortBy === 'urgency') {
          return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
        }
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      });
  }, [visibleSubmissions, filterStatus, categoryFilter, searchQuery, sortBy]);

  useEffect(() => {
    if (filteredSubmissions.length === 0) {
      setSelectedSubmissionId(null);
      return;
    }
    if (
      !selectedSubmissionId ||
      !filteredSubmissions.some((item) => item.id === selectedSubmissionId)
    ) {
      const firstPending = filteredSubmissions.find(
        (item) => item.status === 'PENDING_REVIEW' || item.status === 'FLAGGED'
      );
      setSelectedSubmissionId(firstPending ? firstPending.id : filteredSubmissions[0].id);
    }
  }, [filteredSubmissions, selectedSubmissionId]);

  const selectedSubmission = useMemo(() => {
    if (!selectedSubmissionId) return filteredSubmissions[0] || null;
    return (
      visibleSubmissions.find((item) => item.id === selectedSubmissionId) ||
      filteredSubmissions[0] ||
      null
    );
  }, [visibleSubmissions, filteredSubmissions, selectedSubmissionId]);

  const selectedIndex = useMemo(() => {
    if (!selectedSubmission) return 0;
    const index = filteredSubmissions.findIndex((item) => item.id === selectedSubmission.id);
    return index >= 0 ? index : 0;
  }, [filteredSubmissions, selectedSubmission]);

  const toggleBatchSelect = useCallback((id: string) => {
    setSelectedBatchIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const selectAllBatch = useCallback((ids: string[]) => {
    setSelectedBatchIds(ids);
  }, []);

  const clearBatchSelection = useCallback(() => {
    setSelectedBatchIds([]);
  }, []);

  const goToNextSubmission = useCallback(() => {
    if (filteredSubmissions.length <= 1) return;
    const nextIdx = (selectedIndex + 1) % filteredSubmissions.length;
    setSelectedSubmissionId(filteredSubmissions[nextIdx].id);
  }, [filteredSubmissions, selectedIndex]);

  const goToPrevSubmission = useCallback(() => {
    if (filteredSubmissions.length <= 1) return;
    const prevIdx = (selectedIndex - 1 + filteredSubmissions.length) % filteredSubmissions.length;
    setSelectedSubmissionId(filteredSubmissions[prevIdx].id);
  }, [filteredSubmissions, selectedIndex]);

  const goToNextPending = useCallback(() => {
    const pendingList = filteredSubmissions.filter(
      (item) => item.status === 'PENDING_REVIEW' || item.status === 'FLAGGED'
    );
    if (pendingList.length === 0) {
      goToNextSubmission();
      return;
    }
    const currentPendingIndex = pendingList.findIndex((item) => item.id === selectedSubmissionId);
    if (currentPendingIndex >= 0 && currentPendingIndex < pendingList.length - 1) {
      setSelectedSubmissionId(pendingList[currentPendingIndex + 1].id);
    } else {
      setSelectedSubmissionId(pendingList[0].id);
    }
  }, [filteredSubmissions, selectedSubmissionId, goToNextSubmission]);

  const goToPrevPending = useCallback(() => {
    const pendingList = filteredSubmissions.filter(
      (item) => item.status === 'PENDING_REVIEW' || item.status === 'FLAGGED'
    );
    if (pendingList.length === 0) {
      goToPrevSubmission();
      return;
    }
    const currentPendingIndex = pendingList.findIndex((item) => item.id === selectedSubmissionId);
    if (currentPendingIndex > 0) {
      setSelectedSubmissionId(pendingList[currentPendingIndex - 1].id);
    } else {
      setSelectedSubmissionId(pendingList[pendingList.length - 1].id);
    }
  }, [filteredSubmissions, selectedSubmissionId, goToPrevSubmission]);

  const approveSubmission = useCallback(
    async (id: string, note?: string) => {
      setIsActing(true);
      setActionError(null);
      try {
        const envelope = await approveModerationSubmission(id, note);
        if (!envelope.success) {
          throw new Error(envelope.message || 'Submission could not be approved');
        }
        reloadQueue();
        invalidateModerationQueue();
      } catch (error: unknown) {
        const message = failureMessage(error, 'Submission could not be approved');
        setActionError(message);
        throw new Error(message);
      } finally {
        setIsActing(false);
      }
    },
    [reloadQueue]
  );

  const rejectSubmission = useCallback(
    async (id: string, reasonCode: RejectionReasonCode, reasonNote: string) => {
      const preset = REJECTION_REASON_PRESETS.find((item) => item.code === reasonCode);
      const reason = reasonNote.trim()
        ? `${preset ? `${preset.title}: ` : ''}${reasonNote.trim()}`
        : '';
      if (!reason) {
        const message = 'Rejection reason is required';
        setActionError(message);
        throw new Error(message);
      }
      setIsActing(true);
      setActionError(null);
      try {
        const envelope = await rejectModerationSubmission(id, {
          reason,
          reasonCode,
        });
        if (!envelope.success) {
          throw new Error(envelope.message || 'Submission could not be rejected');
        }
        reloadQueue();
        invalidateModerationQueue();
      } catch (error: unknown) {
        const message = failureMessage(error, 'Submission could not be rejected');
        setActionError(message);
        throw new Error(message);
      } finally {
        setIsActing(false);
      }
    },
    [reloadQueue]
  );

  const rejectUnsupported = useCallback(() => {
    setActionError(UNSUPPORTED_MODERATION_ACTION);
  }, []);

  const flagSubmission = useCallback(
    (_id: string, _flagReason: string) => {
      rejectUnsupported();
    },
    [rejectUnsupported]
  );

  const unflagSubmission = useCallback(
    (_id: string) => {
      rejectUnsupported();
    },
    [rejectUnsupported]
  );

  const batchApprove = useCallback(
    (_ids: string[]) => {
      rejectUnsupported();
    },
    [rejectUnsupported]
  );

  const batchReject = useCallback(
    (_ids: string[], _reasonCode: RejectionReasonCode, _reasonNote: string) => {
      rejectUnsupported();
    },
    [rejectUnsupported]
  );

  const toggleComplianceCheck = useCallback(
    (id: string, checkKey: keyof ValidationChecklistState) => {
      setChecklistOverrides((prev) => {
        const current = prev[id] ||
          submissions.find((item) => item.id === id)?.complianceChecks || {
            resolutionPass: true,
            aspectRatioPass: true,
            audioCleared: true,
            policyCompliant: true,
            durationCompliant: true,
          };
        return {
          ...prev,
          [id]: { ...current, [checkKey]: !current[checkKey] },
        };
      });
    },
    [submissions]
  );

  const setContestLifecycle = useCallback((state: ContestLifecycleState) => {
    setContestLifecycleState(state);
    try {
      localStorage.setItem(CONTEST_STATE_STORAGE_KEY, state);
    } catch {
      // Ignore quota.
    }
  }, []);

  const toggleContestPause = useCallback(() => {
    setContestLifecycleState((prev) => {
      const nextState = prev === 'PAUSED' ? 'ACTIVE' : 'PAUSED';
      try {
        localStorage.setItem(CONTEST_STATE_STORAGE_KEY, nextState);
      } catch {
        // Ignore quota.
      }
      return nextState;
    });
  }, []);

  const resetQueue = useCallback(() => {
    setSelectedBatchIds([]);
    setActionError(null);
    reloadQueue();
  }, [reloadQueue]);

  const reloadAuditLogs = useCallback(() => {
    if (!isAuthenticated) return;
    listModerationAuditLogs()
      .then((envelope) => {
        if (envelope.success && Array.isArray(envelope.data)) {
          setAuditLogs(envelope.data.map(mapAuditLog));
        }
      })
      .catch(() => {
        // The queue load already surfaces a load error. A modal refresh failure
        // keeps the last successful list.
      });
  }, [isAuthenticated]);

  return {
    submissions: visibleSubmissions,
    allSubmissions: visibleSubmissions,
    filteredSubmissions,
    selectedSubmission,
    selectedSubmissionId,
    selectedIndex,
    filterStatus,
    searchQuery,
    categoryFilter,
    sortBy,
    viewMode,
    metrics,
    statusCounts,
    contestLifecycle,
    isContestPaused: contestLifecycle === 'PAUSED',
    auditLogs,
    selectedBatchIds,
    isHydrated,
    loadError,
    actionError,
    isActing,
    isPlatformAdmin: isAdmin,
    userTenantId,
    setFilterStatus,
    setSearchQuery,
    setCategoryFilter,
    setSortBy,
    setViewMode,
    setSelectedSubmissionId,
    toggleBatchSelect,
    selectAllBatch,
    clearBatchSelection,
    approveSubmission,
    rejectSubmission,
    flagSubmission,
    unflagSubmission,
    batchApprove,
    batchReject,
    toggleComplianceCheck,
    setContestLifecycle,
    toggleContestPause,
    goToNextSubmission,
    goToPrevSubmission,
    goToNextPending,
    goToPrevPending,
    resetQueue,
    reloadAuditLogs,
  };
}
