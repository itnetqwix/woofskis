import { ContestRepository } from '../repositories/contest.repository.js';

/**
 * Service for managing delayed contest transitions (e.g. ACTIVE -> JUDGING 3-day schedule).
 *
 * Persisted in the database via `scheduledJudgingAt` so it survives API restarts
 * and does not depend on a browser session.
 *
 * Transitions are executed atomically and idempotently: repeated jobs or concurrent
 * workers will not trigger duplicate transitions.
 */
export class ContestTransitionService {
  /**
   * Process all ACTIVE contests whose scheduledJudgingAt instant has passed.
   * Atomically moves them to JUDGING status and clears scheduledJudgingAt.
   */
  static async processDueTransitions(now = new Date()): Promise<number> {
    const dueContests = await ContestRepository.findDueScheduledTransitions(now);

    if (dueContests.length === 0) {
      return 0;
    }

    let transitionedCount = 0;
    for (const contest of dueContests) {
      const transitioned = await ContestRepository.transitionDueToJudging(contest.id, now);
      if (transitioned) {
        transitionedCount += 1;
        console.log(
          `[ContestTransitionService] Contest ${contest.id} ("${contest.title}") transitioned to JUDGING.`,
        );
      }
    }

    return transitionedCount;
  }

  /**
   * Starts a background polling scheduler that checks for due contest transitions.
   * Runs immediately on startup, then every `intervalMs` milliseconds.
   */
  static startScheduler(intervalMs = 30000): () => void {
    void ContestTransitionService.processDueTransitions().catch((err) => {
      console.error('[ContestTransitionService] Startup check failed:', err);
    });

    const timer = setInterval(() => {
      void ContestTransitionService.processDueTransitions().catch((err) => {
        console.error('[ContestTransitionService] Interval check failed:', err);
      });
    }, intervalMs);

    timer.unref?.();

    return () => {
      clearInterval(timer);
    };
  }
}
