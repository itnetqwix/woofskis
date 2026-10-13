'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ContestLeaderboardMetadata,
  LeaderboardItem,
  LeaderboardViewMode,
  TimeframeFilter,
} from '@/types/leaderboard';
import { PRIZE_TIER_CONFIG } from '@/constants/mock-leaderboard-data';
import { loadDeploymentActiveContests } from '@/features/deployment/load-deployment-contests';
import { getLeaderboard, ApiLeaderboardData } from '@/services/leaderboard-api';
import {
  apiItemToLeaderboardItem,
  buildContestMetadata,
  isUuid,
  selectLeaderboardContestId,
} from '../lib/leaderboard-flow';

function contestIdFromLocation(): string {
  if (typeof window === 'undefined') return '';
  const id = new URLSearchParams(window.location.search).get('contest') ?? '';
  return isUuid(id) ? id : '';
}

export interface UseLeaderboardReturn {
  timeframe: TimeframeFilter;
  category: string;
  searchQuery: string;
  selectedContestId: string;
  viewMode: LeaderboardViewMode;
  metadata: ContestLeaderboardMetadata | null;
  rankedItems: LeaderboardItem[];
  podiumItems: LeaderboardItem[];
  tableItems: LeaderboardItem[];
  previewItem: LeaderboardItem | null;
  isPreviewOpen: boolean;
  totalCount: number;
  avgScore: number;
  totalVotes: number;
  isLoading: boolean;
  error: string | null;
  setTimeframe: (tf: TimeframeFilter) => void;
  setCategory: (cat: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedContestId: (id: string) => void;
  setViewMode: (mode: LeaderboardViewMode) => void;
  openPreview: (item: LeaderboardItem) => void;
  closePreview: () => void;
  contestOptions: Array<{ id: string; title: string }>;
}

import { getStoredContests } from '@/lib/theme-utils';

export function useLeaderboard(): UseLeaderboardReturn {
  const [deploymentContests, setDeploymentContests] = useState<
    Array<{
      id: string;
      title: string;
      status: string;
      updatedAt: string;
      organizationSlug: string;
    }>
  >([]);
  const [catalogReady, setCatalogReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadDeploymentActiveContests()
      .then((contests) => {
        if (cancelled) return;
        const stored = getStoredContests();
        const map = new Map<
          string,
          { id: string; title: string; status: string; updatedAt: string; organizationSlug: string }
        >();
        for (const contest of contests) {
          if (isUuid(contest.id)) {
            map.set(contest.id, {
              id: contest.id,
              title: contest.title,
              status: contest.status,
              updatedAt: contest.updatedAt,
              organizationSlug: 'woofskis',
            });
          }
        }
        for (const s of stored) {
          if (isUuid(s.id) && !map.has(s.id)) {
            map.set(s.id, {
              id: s.id,
              title: s.title,
              status: s.status,
              updatedAt: s.updatedAt || new Date().toISOString(),
              organizationSlug: s.tenantId || 'woofskis',
            });
          }
        }
        setDeploymentContests(Array.from(map.values()));
      })
      .catch(() => {
        if (cancelled) return;
        const stored = getStoredContests();
        const map = new Map<
          string,
          { id: string; title: string; status: string; updatedAt: string; organizationSlug: string }
        >();
        for (const s of stored) {
          if (isUuid(s.id) && !map.has(s.id)) {
            map.set(s.id, {
              id: s.id,
              title: s.title,
              status: s.status,
              updatedAt: s.updatedAt || new Date().toISOString(),
              organizationSlug: s.tenantId || 'woofskis',
            });
          }
        }
        setDeploymentContests(Array.from(map.values()));
      })
      .finally(() => {
        if (!cancelled) setCatalogReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const defaultContestId = useMemo(() => {
    const list =
      deploymentContests.length > 0
        ? deploymentContests
        : getStoredContests()
            .filter((c) => isUuid(c.id))
            .map((c) => ({
              id: c.id,
              tenantId: c.tenantId || 'woofskis',
              organizationSlug: c.tenantId || 'woofskis',
              status: c.status,
              updatedAt: c.updatedAt || '',
            }));

    const selectedId = selectLeaderboardContestId({
      contests: list.map((contest) => ({
        id: contest.id,
        tenantId: (contest as any).organizationSlug || (contest as any).tenantId || 'woofskis',
        status: contest.status,
        updatedAt: contest.updatedAt,
      })),
      tenantKeys: ['woofskis'],
      preferredContestId: list[0]?.id ?? null,
    });
    return selectedId || '';
  }, [deploymentContests]);

  const contestOptions = useMemo(() => {
    if (deploymentContests.length > 0) {
      return deploymentContests.map((contest) => ({ id: contest.id, title: contest.title }));
    }
    return getStoredContests()
      .filter((c) => isUuid(c.id))
      .map((c) => ({ id: c.id, title: c.title }));
  }, [deploymentContests]);

  const [timeframe, setTimeframe] = useState<TimeframeFilter>('ALL_TIME');
  const [category, setCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedContestId, setSelectedContestIdState] = useState<string>('');
  const [viewMode, setViewMode] = useState<LeaderboardViewMode>('full_table');
  const [previewItem, setPreviewItem] = useState<LeaderboardItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  const [apiData, setApiData] = useState<ApiLeaderboardData | null>(null);
  const [rawItems, setRawItems] = useState<LeaderboardItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const setSelectedContestId = useCallback((id: string) => {
    setSelectedContestIdState(id);
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (isUuid(id)) url.searchParams.set('contest', id);
    else url.searchParams.delete('contest');
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }, []);

  useEffect(() => {
    const fromUrl = contestIdFromLocation();
    if (fromUrl) {
      setSelectedContestIdState(fromUrl);
      return;
    }
    if (defaultContestId) setSelectedContestId(defaultContestId);
  }, [defaultContestId, setSelectedContestId]);

  // Fetch leaderboard data from API
  const fetchLeaderboard = useCallback(async () => {
    if (!isUuid(selectedContestId)) {
      const waiting = !catalogReady || Boolean(defaultContestId);
      setIsLoading(waiting);
      if (waiting) return;
      setError(null);
      setApiData(null);
      setRawItems([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const envelope = await getLeaderboard(selectedContestId, {
        category: category !== 'ALL' ? category : undefined,
        timeframe: timeframe !== 'ALL_TIME' ? timeframe : undefined,
      });

      if (envelope.success && envelope.data) {
        setApiData(envelope.data);
        const mapped = envelope.data.items.map((item, idx) =>
          apiItemToLeaderboardItem(item, idx + 1)
        );
        setRawItems(mapped);
      } else {
        setError(envelope.message || 'Failed to load leaderboard');
        setRawItems([]);
      }
    } catch (err: any) {
      setError(err?.message || 'Error loading leaderboard data');
      setRawItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedContestId, category, timeframe, catalogReady, defaultContestId]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Contest Metadata
  const metadata = useMemo<ContestLeaderboardMetadata | null>(() => {
    if (apiData?.contest) {
      return buildContestMetadata(apiData.contest, {
        totalEntries: apiData.totalEntries,
        totalVotes: apiData.totalVotes,
        averageScore: apiData.averageScore,
      });
    }

    return null;
  }, [apiData]);

  // Filter and compute ranking
  const rankedItems = useMemo(() => {
    const filtered = rawItems.filter((item) => {
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchCreator = item.creatorName.toLowerCase().includes(q);
        const matchHandle = item.creatorHandle.toLowerCase().includes(q);
        const matchCategory = item.category.toLowerCase().includes(q);
        const matchTags = item.tags?.some((t) => t.toLowerCase().includes(q)) ?? false;

        if (!matchTitle && !matchCreator && !matchHandle && !matchCategory && !matchTags) {
          return false;
        }
      }

      return true;
    });

    // Re-rank based on communityScore DESC, then totalVotes DESC
    const sorted = [...filtered].sort((a, b) => {
      if (b.communityScore !== a.communityScore) {
        return b.communityScore - a.communityScore;
      }
      return b.totalVotes - a.totalVotes;
    });

    return sorted.map((item, index) => {
      const dynamicRank = index + 1;
      const prizeTier = PRIZE_TIER_CONFIG[dynamicRank];

      return {
        ...item,
        rank: dynamicRank,
        prizeTier,
      };
    });
  }, [rawItems, searchQuery]);

  // Podium items: top 3
  const podiumItems = useMemo(() => {
    return rankedItems.slice(0, 3);
  }, [rankedItems]);

  // Table items: ranks #4+ if podium_table mode, or all items if full_table mode
  const tableItems = useMemo(() => {
    if (viewMode === 'full_table') {
      return rankedItems;
    }
    return rankedItems.slice(3);
  }, [rankedItems, viewMode]);

  // Aggregate statistics
  const totalCount = rankedItems.length;
  const totalVotes = useMemo(
    () => rankedItems.reduce((acc, curr) => acc + curr.totalVotes, 0),
    [rankedItems]
  );
  const avgScore = useMemo(() => {
    if (totalCount === 0) return 0;
    const sum = rankedItems.reduce((acc, curr) => acc + curr.communityScore, 0);
    return Math.round((sum / totalCount) * 100) / 100;
  }, [rankedItems, totalCount]);

  // Preview Modal handlers
  const openPreview = useCallback((item: LeaderboardItem) => {
    setPreviewItem(item);
    setIsPreviewOpen(true);
  }, []);

  const closePreview = useCallback(() => {
    setIsPreviewOpen(false);
  }, []);

  return {
    timeframe,
    category,
    searchQuery,
    selectedContestId,
    viewMode,
    metadata,
    rankedItems,
    podiumItems,
    tableItems,
    previewItem,
    isPreviewOpen,
    totalCount,
    avgScore,
    totalVotes,
    isLoading,
    error,
    setTimeframe,
    setCategory,
    setSearchQuery,
    setSelectedContestId,
    setViewMode,
    openPreview,
    closePreview,
    contestOptions,
  };
}
