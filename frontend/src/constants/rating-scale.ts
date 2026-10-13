import { RatingScaleDefinition } from '@/types/contest';

/** New votes are integers 1–10. Stored historical 1–5 ratings stay valid. */
export const RATING_MIN = 1;
export const RATING_MAX = 10;

export function isAllowedRating(value: number): boolean {
  return Number.isInteger(value) && value >= RATING_MIN && value <= RATING_MAX;
}

export function isStarFilled(star: number, selected: number | null): boolean {
  return selected !== null && star >= 1 && star <= selected;
}

export function ratingToPrefill(existing: number | null | undefined): number | null {
  if (typeof existing !== 'number' || !isAllowedRating(existing)) return null;
  return existing;
}

/** Rounded star count for a community average. 8.7 fills nine stars. */
export function communityStarCount(average: number): number {
  if (!Number.isFinite(average)) return 0;
  return Math.min(RATING_MAX, Math.max(0, Math.round(average)));
}

export const RATING_SCALE_DEFINITIONS: RatingScaleDefinition[] = Array.from(
  { length: RATING_MAX },
  (_, index) => {
    const value = index + 1;
    return {
      value,
      label: String(value),
      description: `${value} out of 10`,
      colorClass: 'text-[#8BC144]',
    };
  }
);
