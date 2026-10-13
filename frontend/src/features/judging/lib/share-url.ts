/** Share link for one submission on the live judging route. */
export function buildVideoShareUrl(origin: string, submissionId: string): string {
  const url = new URL('/', origin);
  url.searchParams.set('v', submissionId);
  return url.toString();
}

export function buildScoreboardPath(contestId: string): string {
  return `/leaderboard?contest=${encodeURIComponent(contestId)}`;
}
