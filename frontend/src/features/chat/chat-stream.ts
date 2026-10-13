import { clearAuthTokenAndEmitUnauthorized } from '@/lib/axios';
import { STORAGE_KEYS } from '@/constants/storage-keys';
import type { ChatMessage } from '@/services/chat-api';

export type ChatStreamEvent =
  | { type: 'message'; friendshipId: string; message: ChatMessage }
  | { type: 'read'; friendshipId: string; userId: string; lastReadAt: string };

function apiBase(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '');
}

function parseFrames(buffer: string, onEvent: (event: ChatStreamEvent) => void): string {
  const frames = buffer.split('\n\n');
  const rest = frames.pop() ?? '';
  for (const frame of frames) {
    const dataLine = frame
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trim())
      .join('\n');
    if (!dataLine) continue;
    const parsed = JSON.parse(dataLine) as ChatStreamEvent;
    if (parsed?.type === 'message' || parsed?.type === 'read') onEvent(parsed);
  }
  return rest;
}

async function readOnce(
  onEvent: (event: ChatStreamEvent) => void,
  onLive: () => void,
  signal: AbortSignal
): Promise<void> {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  const response = await fetch(`${apiBase()}/chat/stream`, {
    headers: {
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal,
  });
  if (response.status === 401) {
    clearAuthTokenAndEmitUnauthorized();
    throw new Error('unauthorized');
  }
  if (!response.ok || !response.body) {
    throw new Error(`Chat stream failed (${response.status})`);
  }
  onLive();
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (!signal.aborted) {
    const { done, value } = await reader.read();
    if (done) return;
    buffer = parseFrames(buffer + decoder.decode(value, { stream: true }), onEvent);
  }
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new Error('aborted'));
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * One SSE connection with backoff. A socket client is not used.
 * Returns a stop function.
 */
export function openChatStream(
  onEvent: (event: ChatStreamEvent) => void,
  onStatus: (status: 'connecting' | 'live' | 'offline') => void
): () => void {
  const controller = new AbortController();
  let stopped = false;
  let attempt = 0;

  async function loop() {
    while (!stopped) {
      onStatus(attempt === 0 ? 'connecting' : 'offline');
      try {
        await readOnce(onEvent, () => onStatus('live'), controller.signal);
        if (stopped) return;
        attempt += 1;
      } catch (error) {
        if (stopped || controller.signal.aborted) return;
        if (error instanceof Error && error.message === 'unauthorized') {
          onStatus('offline');
          return;
        }
        attempt += 1;
        onStatus('offline');
      }
      const delay = Math.min(15000, 1000 * 2 ** Math.min(attempt, 4));
      try {
        await wait(delay, controller.signal);
      } catch {
        return;
      }
    }
  }

  void loop();
  return () => {
    stopped = true;
    controller.abort();
  };
}
