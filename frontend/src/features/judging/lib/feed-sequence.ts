/**
 * Shuffled playback order for the judging feed.
 *
 * The sequence is built once per cycle. Renders and unrelated state updates
 * must not call these helpers. A new cycle is created only when the current
 * sequence is exhausted.
 */

export function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const unique: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    unique.push(item);
  }
  return unique;
}

export function shuffleIds(ids: string[], random: () => number = Math.random): string[] {
  const next = dedupeById(ids.map((id) => ({ id }))).map((item) => item.id);
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = next[index];
    next[index] = next[swapIndex];
    next[swapIndex] = current;
  }
  return next;
}

/**
 * Next cycle of the same ids. When more than one video exists, the first id
 * is not the id that just finished.
 */
export function nextShuffledCycle(
  previousIds: string[],
  random: () => number = Math.random
): string[] {
  const unique = dedupeById(previousIds.map((id) => ({ id }))).map((item) => item.id);
  if (unique.length <= 1) return unique;
  const last = unique[unique.length - 1];
  const cycle = shuffleIds(unique, random);
  if (cycle[0] !== last) return cycle;
  const swapIndex = 1 + Math.floor(random() * (cycle.length - 1));
  const first = cycle[0];
  cycle[0] = cycle[swapIndex];
  cycle[swapIndex] = first;
  return cycle;
}

export function orderByIds<T extends { id: string }>(items: T[], order: string[]): T[] {
  const byId = new Map<string, T>();
  for (const item of items) {
    if (!byId.has(item.id)) byId.set(item.id, item);
  }
  const ordered: T[] = [];
  const seen = new Set<string>();
  for (const id of order) {
    const item = byId.get(id);
    if (!item || seen.has(id)) continue;
    seen.add(id);
    ordered.push(item);
  }
  for (const item of byId.values()) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    ordered.push(item);
  }
  return ordered;
}
