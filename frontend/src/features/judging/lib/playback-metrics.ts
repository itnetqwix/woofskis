export type PlaybackMetricEvent =
  'loadstart' | 'loadedmetadata' | 'loadeddata' | 'playing' | 'waiting' | 'error';

export interface PlaybackMetricSample {
  videoId: string;
  event: PlaybackMetricEvent;
  sinceLoadStartMs: number | null;
}

const MAX_SAMPLES = 40;
const samples: PlaybackMetricSample[] = [];
const loadStarts = new Map<string, number>();

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

/** In-memory playback timing. URLs, tokens, and media bytes are not stored. */
export function notePlayback(videoId: string, event: PlaybackMetricEvent): void {
  const now = nowMs();
  if (event === 'loadstart') loadStarts.set(videoId, now);
  const start = loadStarts.get(videoId);
  samples.push({
    videoId,
    event,
    sinceLoadStartMs: start === undefined ? null : Math.round(now - start),
  });
  if (samples.length > MAX_SAMPLES) samples.shift();
}

export function playbackSamples(): readonly PlaybackMetricSample[] {
  return samples;
}

export function resetPlaybackSamples(): void {
  samples.length = 0;
  loadStarts.clear();
}
