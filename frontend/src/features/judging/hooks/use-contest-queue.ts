'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ContestVideoItem, RatingSubmission, AggregatedScoreResult } from '@/types/contest';
import { useTenantTheme } from '@/features/admin/hooks/use-tenant-theme';
import { AppApiError } from '@/lib/axios';
import { listViewableContests } from '@/services/contests-api';
import { getJudgingQueue, rateSubmission } from '@/services/judging-api';
import {
  DEFAULT_AUTO_ADVANCE_DELAY_MS,
  VIEWER_MUTE_STORAGE_KEY,
  emptyQueueFallback,
  isTypingTarget,
  queueItemToVideo,
  resolveAutoAdvanceDelayMs,
} from '@/features/judging/lib/judging-flow';
import { isAllowedRating } from '@/constants/rating-scale';
import { resultForActiveVideo, type LastRatedVideo } from '@/features/judging/lib/feed-state';
import { retainPlaybackUrl } from '@/features/judging/lib/playback-src';
import {
  dedupeById,
  nextShuffledCycle,
  orderByIds,
  shuffleIds,
} from '@/features/judging/lib/feed-sequence';

export interface UseContestQueueReturn {
  videos: ContestVideoItem[];
  currentIndex: number;
  currentVideo: ContestVideoItem | null;
  totalVideos: number;
  userRatings: Record<string, RatingSubmission>;
  isCompleted: boolean;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  isBuffering: boolean;
  isRevealingScore: boolean;
  lastSubmittedRating: number | null;
  aggregatedResult: AggregatedScoreResult | null;
  revealCountdownProgress: number; // 0 to 100
  loopMode: boolean;
  isLoadingQueue: boolean;
  queueError: string | null;
  ratingError: string | null;
  isSubmittingRating: boolean;
  isEmptyFallback: boolean;
  autoAdvanceDelayMs: number;
  replayGeneration: number;
  feedCycle: number;
  lastRatedVideo: LastRatedVideo | null;
  previousResult: LastRatedVideo | null;
  ratingModalOpen: boolean;
  commentsOpen: boolean;
  ratingPreset: number | null;
  openRatingModal: (preset?: number | null) => void;
  closeRatingModal: () => void;
  openComments: () => void;
  closeComments: () => void;
  submitRating: (rating: number) => void;
  returnToLastRated: () => void;
  starBurst: number;
  nextVideo: () => void;
  prevVideo: () => void;
  goToVideo: (index: number) => void;
  skipVideo: () => void;
  restartQueue: () => void;
  retryQueue: () => void;
  togglePlayPause: () => void;
  toggleMute: () => void;
  setMutedState: (muted: boolean) => void;
  setVolumeState: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setIsBuffering: (buffering: boolean) => void;
  setIsPlaying: (playing: boolean) => void;
  toggleLoopMode: () => void;
}

export function useContestQueue(): UseContestQueueReturn {
  const { activeBrand } = useTenantTheme();
  const activeTenantId = activeBrand?.id || 'woofskis';

  const [videos, setVideos] = useState<ContestVideoItem[]>([]);
  const [contestId, setContestId] = useState<string | null>(null);
  const [autoAdvanceDelayMs, setAutoAdvanceDelayMs] = useState(DEFAULT_AUTO_ADVANCE_DELAY_MS);
  const [isLoadingQueue, setIsLoadingQueue] = useState(true);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [isEmptyFallback, setIsEmptyFallback] = useState(false);
  const [replayGeneration, setReplayGeneration] = useState(0);
  const [feedCycle, setFeedCycle] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userRatings, setUserRatings] = useState<Record<string, RatingSubmission>>({});
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [loopMode, setLoopMode] = useState<boolean>(false);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [volume, setVolumeState] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);

  const [lastRatedVideo, setLastRatedVideo] = useState<LastRatedVideo | null>(null);
  const [starBurst, setStarBurst] = useState(0);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [ratingPreset, setRatingPreset] = useState<number | null>(null);
  const [isRevealingScore, setIsRevealingScore] = useState<boolean>(false);
  const [lastSubmittedRating, setLastSubmittedRating] = useState<number | null>(null);
  const [aggregatedResult, setAggregatedResult] = useState<AggregatedScoreResult | null>(null);
  const [revealCountdownProgress, setRevealCountdownProgress] = useState<number>(100);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittingRef = useRef(false);
  const ratingModalOpenRef = useRef(false);
  const commentsOpenRef = useRef(false);
  const currentVideoIdRef = useRef<string | null>(null);
  const videosRef = useRef<ContestVideoItem[]>([]);
  const indexRef = useRef(0);
  const emptyRef = useRef(false);
  const cycleOrderRef = useRef<string[]>([]);
  const viewTokenRef = useRef(0);
  const advanceLockRef = useRef(false);
  const advanceLockVideoRef = useRef<string | null>(null);

  useEffect(() => {
    ratingModalOpenRef.current = ratingModalOpen;
  }, [ratingModalOpen]);

  useEffect(() => {
    commentsOpenRef.current = commentsOpen;
  }, [commentsOpen]);

  const openRatingModal = useCallback(
    (preset: number | null = null) => {
      if (isEmptyFallback) return;
      setRatingPreset(preset);
      setCommentsOpen(false);
      setRatingModalOpen(true);
    },
    [isEmptyFallback]
  );

  const closeRatingModal = useCallback(() => {
    setRatingModalOpen(false);
    setRatingPreset(null);
  }, []);

  const openComments = useCallback(() => {
    setRatingModalOpen(false);
    setCommentsOpen(true);
  }, []);

  const closeComments = useCallback(() => {
    setCommentsOpen(false);
  }, []);

  useEffect(() => {
    try {
      const storedMuted = localStorage.getItem(VIEWER_MUTE_STORAGE_KEY);
      if (storedMuted !== null) {
        setIsMuted(storedMuted === 'true');
      }
    } catch {
      // Ignore localStorage errors in SSR / private mode
    }
  }, []);

  const applyQueues = useCallback(
    (
      queues: Array<{
        contestId: string;
        status: string;
        ratingOpen: boolean;
        autoAdvanceDelayMs: number;
        items: Parameters<typeof queueItemToVideo>[0][];
      }>,
      replace: boolean
    ) => {
      const videosNext = queues.flatMap((queue) =>
        queue.items.map((item) =>
          queueItemToVideo({
            ...item,
            contestId: queue.contestId,
            contestStatus: queue.status,
            ratingOpen: queue.ratingOpen,
          })
        )
      );
      const openQueue = queues.find((queue) => queue.ratingOpen) ?? queues[0];
      if (openQueue) {
        setContestId(openQueue.contestId);
        setAutoAdvanceDelayMs(resolveAutoAdvanceDelayMs(openQueue.autoAdvanceDelayMs));
      }
      const rememberViewerRatings = (list: ContestVideoItem[]) => {
        setUserRatings((prev) => {
          let changed = false;
          const next = { ...prev };
          for (const video of list) {
            if (typeof video.viewerRating !== 'number' || !Number.isInteger(video.viewerRating)) {
              continue;
            }
            if (next[video.id]?.rating === video.viewerRating) continue;
            next[video.id] = {
              videoId: video.id,
              rating: video.viewerRating,
              timestamp: prev[video.id]?.timestamp || new Date().toISOString(),
            };
            changed = true;
          }
          return changed ? next : prev;
        });
      };
      if (videosNext.length === 0) {
        if (replace) {
          setVideos([
            emptyQueueFallback({
              brandName: activeBrand?.name,
              brandSlug: activeBrand?.slug,
              logoUrl: activeBrand?.logoUrl,
            }),
          ]);
          setIsEmptyFallback(true);
        }
        return;
      }
      setIsEmptyFallback(false);
      const unique = dedupeById(videosNext);
      if (replace) {
        const shuffled = orderByIds(unique, shuffleIds(unique.map((video) => video.id)));
        cycleOrderRef.current = shuffled.map((video) => video.id);
        advanceLockRef.current = false;
        setVideos(shuffled);
        rememberViewerRatings(shuffled);
        const sharedId =
          typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('v')
            : null;
        const sharedIndex = sharedId ? shuffled.findIndex((video) => video.id === sharedId) : -1;
        setCurrentIndex(sharedIndex >= 0 ? sharedIndex : 0);
        setIsCompleted(false);
        return;
      }
      setVideos((current) => {
        const byId = new Map(
          current
            .filter((video) => video.id !== 'empty-queue' && !video.id.startsWith('empty-'))
            .map((video) => [video.id, video])
        );
        unique.forEach((video) => {
          const previous = byId.get(video.id);
          byId.set(
            video.id,
            previous
              ? {
                  ...previous,
                  ...video,
                  videoUrl: retainPlaybackUrl(previous.videoUrl, video.videoUrl),
                }
              : video
          );
        });
        const merged = [...byId.values()];
        const order = cycleOrderRef.current.filter((id) => byId.has(id));
        for (const video of merged) {
          if (!order.includes(video.id)) order.push(video.id);
        }
        cycleOrderRef.current = order;
        return orderByIds(merged, order);
      });
      rememberViewerRatings(unique);
    },
    [activeBrand?.logoUrl, activeBrand?.name, activeBrand?.slug]
  );

  const loadQueues = useCallback(
    async (replace: boolean) => {
      const catalog = await listViewableContests();
      if (!catalog.success || !Array.isArray(catalog.data) || catalog.data.length === 0) {
        if (replace) {
          setContestId(null);
          setVideos([
            emptyQueueFallback({
              brandName: activeBrand?.name,
              brandSlug: activeBrand?.slug,
              logoUrl: activeBrand?.logoUrl,
            }),
          ]);
          setIsEmptyFallback(true);
          setAutoAdvanceDelayMs(DEFAULT_AUTO_ADVANCE_DELAY_MS);
        }
        return;
      }
      const queues = await Promise.all(
        catalog.data.map(async (contest) => {
          const envelope = await getJudgingQueue(contest.id);
          if (!envelope.success || !envelope.data) return null;
          return envelope.data;
        })
      );
      applyQueues(
        queues.filter((queue): queue is NonNullable<typeof queue> => queue !== null),
        replace
      );
    },
    [activeBrand?.logoUrl, activeBrand?.name, activeBrand?.slug, applyQueues]
  );

  useEffect(() => {
    let cancelled = false;
    setIsLoadingQueue(true);
    setQueueError(null);
    setRatingError(null);

    void loadQueues(true)
      .catch((error: unknown) => {
        if (cancelled) return;
        setVideos([]);
        setIsEmptyFallback(false);
        setQueueError(
          error instanceof AppApiError ? error.message : 'Judging queue could not be loaded'
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoadingQueue(false);
      });

    const timer = window.setInterval(() => {
      void loadQueues(false).catch(() => undefined);
    }, 12000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [activeTenantId, activeBrand?.id, activeBrand?.activeContestId, reloadToken, loadQueues]);

  const currentVideo = videos[currentIndex] || null;
  currentVideoIdRef.current = currentVideo?.id ?? null;
  videosRef.current = videos;
  indexRef.current = currentIndex;
  emptyRef.current = isEmptyFallback;
  if (advanceLockRef.current && advanceLockVideoRef.current !== (currentVideo?.id ?? null)) {
    advanceLockRef.current = false;
  }

  const clearAdvanceTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const nextVideo = useCallback(() => {
    const list = videosRef.current;
    const index = indexRef.current;
    const fromId = list[index]?.id ?? '';
    if (advanceLockRef.current) return;
    if (list.length > 0) {
      advanceLockRef.current = true;
      advanceLockVideoRef.current = fromId;
    }
    viewTokenRef.current += 1;

    clearAdvanceTimers();
    setIsRevealingScore(false);
    setLastSubmittedRating(null);
    setAggregatedResult(null);
    setRevealCountdownProgress(100);
    setCurrentTime(0);

    if (list.length === 0) return;

    if (index < list.length - 1) {
      const next = list[index + 1];
      currentVideoIdRef.current = next?.id ?? null;
      indexRef.current = index + 1;
      setCurrentIndex(index + 1);
      setIsPlaying(true);
      setIsCompleted(false);
      return;
    }

    if (emptyRef.current) {
      setIsCompleted(true);
      setIsPlaying(false);
      return;
    }

    if (list.length === 1) {
      currentVideoIdRef.current = list[0]?.id ?? null;
      indexRef.current = 0;
      setReplayGeneration((generation) => generation + 1);
      setCurrentIndex(0);
      setIsPlaying(true);
      setIsCompleted(false);
      window.setTimeout(() => {
        if (advanceLockVideoRef.current === fromId) advanceLockRef.current = false;
      }, 400);
      return;
    }

    const nextIds = nextShuffledCycle(list.map((video) => video.id));
    const byId = new Map(list.map((video) => [video.id, video]));
    const nextVideos = nextIds
      .map((id) => byId.get(id))
      .filter((video): video is ContestVideoItem => Boolean(video));
    cycleOrderRef.current = nextVideos.map((video) => video.id);
    currentVideoIdRef.current = nextVideos[0]?.id ?? null;
    indexRef.current = 0;
    setVideos(nextVideos);
    setFeedCycle((cycle) => cycle + 1);
    setCurrentIndex(0);
    setIsPlaying(true);
    setIsCompleted(false);
  }, [clearAdvanceTimers]);

  const prevVideo = useCallback(() => {
    if (currentIndex > 0) {
      advanceLockRef.current = false;
      indexRef.current = currentIndex - 1;
      clearAdvanceTimers();
      setIsRevealingScore(false);
      setLastSubmittedRating(null);
      setAggregatedResult(null);
      setRevealCountdownProgress(100);
      setCurrentTime(0);
      setCurrentIndex((prev) => prev - 1);
      setIsPlaying(true);
      setIsCompleted(false);
    }
  }, [clearAdvanceTimers, currentIndex]);

  const goToVideo = useCallback(
    (index: number) => {
      const list = videosRef.current;
      if (index < 0 || index >= list.length || index === indexRef.current) return;
      advanceLockRef.current = false;
      indexRef.current = index;
      clearAdvanceTimers();
      setIsRevealingScore(false);
      setLastSubmittedRating(null);
      setAggregatedResult(null);
      setRevealCountdownProgress(100);
      setCurrentTime(0);
      setCurrentIndex(index);
      setIsPlaying(true);
      setIsCompleted(false);
    },
    [clearAdvanceTimers]
  );

  const returnToLastRated = useCallback(() => {
    const targetId = lastRatedVideo?.videoId;
    if (!targetId) return;
    const index = videosRef.current.findIndex((video) => video.id === targetId);
    if (index >= 0) {
      goToVideo(index);
      return;
    }
    void loadQueues(false)
      .then(() => {
        const nextIndex = videosRef.current.findIndex((video) => video.id === targetId);
        if (nextIndex >= 0) goToVideo(nextIndex);
      })
      .catch(() => undefined);
  }, [goToVideo, lastRatedVideo, loadQueues]);

  const skipVideo = useCallback(() => {
    nextVideo();
  }, [nextVideo]);

  const restartQueue = useCallback(() => {
    clearAdvanceTimers();
    setCurrentIndex(0);
    setIsCompleted(false);
    setIsRevealingScore(false);
    setLastSubmittedRating(null);
    setAggregatedResult(null);
    setRevealCountdownProgress(100);
    setCurrentTime(0);
    setIsPlaying(true);
  }, [clearAdvanceTimers]);

  const retryQueue = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  const submitRating = useCallback(
    (rating: number) => {
      const videoContestId = currentVideo?.contestId || contestId;
      if (!currentVideo || isRevealingScore || isEmptyFallback || !videoContestId) return;
      if (currentVideo.ratingOpen === false) {
        setRatingError('This contest has ended. Rating is closed.');
        return;
      }
      if (!isAllowedRating(rating)) return;
      if (submittingRef.current) return;

      const videoId = currentVideo.id;
      const viewToken = viewTokenRef.current;
      submittingRef.current = true;
      setIsSubmittingRating(true);
      setRatingError(null);

      void rateSubmission(videoContestId, videoId, { rating })
        .then((envelope) => {
          if (!envelope.success || !envelope.data) {
            if (currentVideoIdRef.current === videoId) {
              setRatingError(envelope.message || 'Rating could not be saved');
            }
            return;
          }
          const averageScore = envelope.data.newScore;
          const voteCount = envelope.data.totalVotes;
          setUserRatings((prev) => ({
            ...prev,
            [videoId]: {
              videoId,
              rating,
              timestamp: new Date().toISOString(),
            },
          }));
          setVideos((prev) =>
            prev.map((video) =>
              video.id === videoId
                ? {
                    ...video,
                    communityScore: averageScore,
                    totalVotes: voteCount,
                    viewerRating: rating,
                  }
                : video
            )
          );
          setLastRatedVideo({
            videoId,
            averageScore,
            voteCount,
            userRating: rating,
            thumbnailUrl: currentVideo?.thumbnailUrl || null,
            title: currentVideo?.title || null,
            creatorName: currentVideo?.creatorName || null,
            creatorHandle: currentVideo?.creatorHandle || null,
            creatorAvatarUrl: currentVideo?.creatorAvatarUrl || null,
          });
          setLastSubmittedRating(rating);
          setRatingModalOpen(false);
          setRatingPreset(null);
          setStarBurst((burst) => burst + 1);
          if (viewToken !== viewTokenRef.current) return;
          if (currentVideoIdRef.current === videoId) {
            nextVideo();
          }
        })
        .catch((error: unknown) => {
          if (currentVideoIdRef.current !== videoId) return;
          const message =
            error instanceof AppApiError ? error.message : 'Rating could not be saved';
          setRatingError(message);
        })
        .finally(() => {
          submittingRef.current = false;
          setIsSubmittingRating(false);
        });
    },
    [contestId, currentVideo, isEmptyFallback, isRevealingScore, nextVideo]
  );

  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const nextMuted = !prev;
      try {
        localStorage.setItem(VIEWER_MUTE_STORAGE_KEY, String(nextMuted));
      } catch {
        // Ignore localStorage error
      }
      return nextMuted;
    });
  }, []);

  const setMutedState = useCallback((muted: boolean) => {
    setIsMuted(muted);
    try {
      localStorage.setItem(VIEWER_MUTE_STORAGE_KEY, String(muted));
    } catch {
      // Ignore
    }
  }, []);

  const toggleLoopMode = useCallback(() => {
    setLoopMode((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (ratingModalOpenRef.current || commentsOpenRef.current) return;
      if (document.querySelector('[role="dialog"]')) return;

      if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        submitRating(parseInt(e.key, 10));
      } else if (e.key === '0') {
        e.preventDefault();
        submitRating(10);
      } else if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      } else if (
        e.key === 'ArrowDown' ||
        e.key === 'ArrowRight' ||
        e.key === 'n' ||
        e.key === 'N' ||
        e.key === 'j' ||
        e.key === 'J'
      ) {
        e.preventDefault();
        nextVideo();
      } else if (
        e.key === 'ArrowUp' ||
        e.key === 'ArrowLeft' ||
        e.key === 'p' ||
        e.key === 'P' ||
        e.key === 'k' ||
        e.key === 'K'
      ) {
        e.preventDefault();
        prevVideo();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        restartQueue();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [submitRating, togglePlayPause, toggleMute, nextVideo, prevVideo, restartQueue]);

  useEffect(() => {
    return () => {
      clearAdvanceTimers();
    };
  }, [clearAdvanceTimers]);

  return {
    videos,
    currentIndex,
    currentVideo,
    totalVideos: videos.length,
    userRatings,
    isCompleted,
    isPlaying,
    isMuted,
    volume,
    currentTime,
    duration,
    isBuffering,
    isRevealingScore,
    lastSubmittedRating,
    aggregatedResult,
    revealCountdownProgress,
    loopMode,
    isLoadingQueue,
    queueError,
    ratingError,
    isSubmittingRating,
    isEmptyFallback,
    autoAdvanceDelayMs,
    replayGeneration,
    feedCycle,
    lastRatedVideo,
    previousResult: resultForActiveVideo(lastRatedVideo, currentVideo?.id ?? null),
    ratingModalOpen,
    commentsOpen,
    ratingPreset,
    openRatingModal,
    closeRatingModal,
    openComments,
    closeComments,
    submitRating,
    returnToLastRated,
    starBurst,
    nextVideo,
    prevVideo,
    goToVideo,
    skipVideo,
    restartQueue,
    retryQueue,
    togglePlayPause,
    toggleMute,
    setMutedState,
    setVolumeState,
    setCurrentTime,
    setDuration,
    setIsBuffering,
    setIsPlaying,
    toggleLoopMode,
  };
}
