'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  ContestLeaderboardMetadata,
  LeaderboardItem,
  LeaderboardViewMode,
  TimeframeFilter,
} from '@/types/leaderboard';
import { getLeaderboard, ApiLeaderboardData } from '@/services/leaderboard-api';
import { listDeploymentActiveContests, type ApiContest } from '@/services/contests-api';
import { AppApiError } from '@/lib/axios';
import {
  apiItemToLeaderboardItem,
  buildContestMetadata,
  isUuid,
} from '../lib/leaderboard-flow';

function contestIdFromLocation(): string {
  if (typeof window === 'undefined') return '';
  const id = new URLSearchParams(window.location.search).get('contest') ?? '';
  return isUuid(id) ? id : '';
}

export interface LeaderboardContestOption {
  id: string;
  title: string;
  status: string;
  prizeSummary: string | null;
  endDate: string;
  updatedAt: string;
}

export interface LeaderboardSummary {
  totalEntries: number;
  totalParticipants: number;
  totalVotes: number;
  leading: { title: string; communityScore: number; totalVotes: number } | null;
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
  summary: LeaderboardSummary | null;
  isLoading: boolean;
  catalogReady: boolean;
  error: string | null;
  catalogError: string | null;
  setTimeframe: (tf: TimeframeFilter) => void;
  setCategory: (cat: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedContestId: (id: string) => void;
  setViewMode: (mode: LeaderboardViewMode) => void;
  openPreview: (item: LeaderboardItem) => void;
  closePreview: () => void;
  contestOptions: LeaderboardContestOption[];
}

function activeContests(contests: ApiContest[]): LeaderboardContestOption[] {
  return contests
    .filter((contest) => contest.status === 'ACTIVE' && isUuid(contest.id))
    .map((contest) => ({
      id: contest.id,
      title: contest.title,
      status: contest.status,
      prizeSummary: contest.prizeSummary,
      endDate: contest.endDate,
      updatedAt: contest.updatedAt,
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function defaultActiveContestId(options: LeaderboardContestOption[], fromUrl: string): string {
  if (fromUrl && options.some((contest) => contest.id === fromUrl)) return fromUrl;
  return options[0]?.id ?? '';
}

export function useLeaderboard(): UseLeaderboardReturn {
  const [contestOptions, setContestOptions] = useState<LeaderboardContestOption[]>([]);
  const [catalogReady, setCatalogReady] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void listDeploymentActiveContests()
      .then((envelope) => {
        if (cancelled) return;
        if (!envelope.success || !Array.isArray(envelope.data)) {
          setCatalogError(envelope.message || 'Could not load active contests');
          setContestOptions([]);
          return;
        }
        setCatalogError(null);
        setContestOptions(activeContests(envelope.data));
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message =
          error instanceof AppApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Could not load active contests';
        setCatalogError(message);
        setContestOptions([]);
      })
      .finally(() => {
        if (!cancelled) setCatalogReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
  const requestSeq = useRef(0);

  const setSelectedContestId = useCallback((id: string) => {
    setSelectedContestIdState(id);
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (isUuid(id)) url.searchParams.set('contest', id);
    else url.searchParams.delete('contest');
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }, []);

  useEffect(() => {
    if (!catalogReady) return;
    const fromUrl = contestIdFromLocation();
    setSelectedContestIdState((current) => {
      if (current && contestOptions.some((contest) => contest.id === current)) return current;
      return defaultActiveContestId(contestOptions, fromUrl);
    });
  }, [catalogReady, contestOptions]);

  useEffect(() => {
    if (!catalogReady) return;
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (isUuid(selectedContestId)) url.searchParams.set('contest', selectedContestId);
    else url.searchParams.delete('contest');
    const next = `${url.pathname}${url.search}${url.hash}`;
    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== next) {
      window.history.replaceState(null, '', next);
    }
  }, [catalogReady, selectedContestId]);

  const fetchLeaderboard = useCallback(async () => {
    const seq = ++requestSeq.current;
    const selectedIsActive = contestOptions.some((contest) => contest.id === selectedContestId);

    if (!catalogReady) {
      setIsLoading(true);
      return;
    }

    if (!isUuid(selectedContestId) || !selectedIsActive) {
      setIsLoading(false);
      setError(null);
      setApiData(null);
      setRawItems([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    setApiData(null);
    setRawItems([]);

    try {
      const envelope = await getLeaderboard(selectedContestId);
      if (seq !== requestSeq.current) return;

      if (envelope.success && envelope.data && envelope.data.contest?.id === selectedContestId) {
        setApiData(envelope.data);
        setRawItems(envelope.data.items.map((item) => apiItemToLeaderboardItem(item)));
      } else {
        setError(envelope.message || 'Failed to load leaderboard');
        setApiData(null);
        setRawItems([]);
      }
    } catch (err: unknown) {
      if (seq !== requestSeq.current) return;
      const message =
        err instanceof AppApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Error loading leaderboard data';
      setError(message);
      setApiData(null);
      setRawItems([]);
    } finally {
      if (seq === requestSeq.current) setIsLoading(false);
    }
  }, [selectedContestId, catalogReady, contestOptions]);

  useEffect(() => {
    void fetchLeaderboard();
  }, [fetchLeaderboard]);

  const metadata = useMemo<ContestLeaderboardMetadata | null>(() => {
    if (!apiData?.contest || apiData.contest.id !== selectedContestId) return null;
    return buildContestMetadata(apiData.contest, {
      totalEntries: apiData.totalEntries,
      totalVotes: apiData.totalVotes,
      averageScore: apiData.averageScore,
    });
  }, [apiData, selectedContestId]);

  const rankedItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return rawItems;
    return rawItems.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(query);
      const matchCreator = item.creatorName.toLowerCase().includes(query);
      const matchTags = item.tags?.some((tag) => tag.toLowerCase().includes(query)) ?? false;
      return matchTitle || matchCreator || matchTags;
    });
  }, [rawItems, searchQuery]);

  const podiumItems = useMemo(() => {
    if (!apiData || apiData.contest.id !== selectedContestId) return [];
    return apiData.podium.map((item) => apiItemToLeaderboardItem(item));
  }, [apiData, selectedContestId]);

  const tableItems = useMemo(() => {
    if (viewMode === 'full_table') return rankedItems;
    return rankedItems.slice(3);
  }, [rankedItems, viewMode]);

  const summary = useMemo<LeaderboardSummary | null>(() => {
    if (!apiData || apiData.contest.id !== selectedContestId) return null;
    const leading = apiData.podium[0] ?? apiData.items[0] ?? null;
    const totalParticipants =
      apiData.totalParticipants ??
      new Set(apiData.items.map((item) => item.creator.id)).size;
    return {
      totalEntries: apiData.totalEntries,
      totalParticipants,
      totalVotes: apiData.totalVotes,
      leading: leading
        ? {
            title: leading.title,
            communityScore: leading.communityScore,
            totalVotes: leading.totalVotes,
          }
        : null,
    };
  }, [apiData, selectedContestId]);

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
    totalCount: rankedItems.length,
    avgScore: apiData?.contest.id === selectedContestId ? apiData.averageScore : 0,
    totalVotes: summary?.totalVotes ?? 0,
    summary,
    isLoading,
    catalogReady,
    error,
    catalogError,
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
