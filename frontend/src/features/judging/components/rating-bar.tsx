'use client';

import { forwardRef } from 'react';
import { StarRating } from '@/features/judging/components/star-rating';
import { RATING_MAX } from '@/constants/rating-scale';
import { cn } from '@/lib/utils';

export interface RatingBarProps {
  onRate: (rating: number) => void;
  disabled?: boolean;
  closed?: boolean;
  userRating?: number | null;
  onSkip?: () => void;
  error?: string | null;
  attention?: boolean;
  progress?: number;
  className?: string;
}

export const RatingBar = forwardRef<HTMLElement, RatingBarProps>(function RatingBar(
  {
    onRate,
    disabled = false,
    closed = false,
    userRating = null,
    onSkip,
    error = null,
    attention = false,
    progress = 0,
    className,
  },
  ref
) {
  const width = `${Math.min(100, Math.max(0, progress * 100))}%`;

  return (
    <section
      ref={ref}
      id="judging-rating"
      tabIndex={-1}
      aria-label="Rate this video"
      className={cn(
        'pointer-events-none w-full min-w-0 max-w-full overflow-hidden outline-none',
        'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#8BC144]',
        attention && 'ring-2 ring-inset ring-[#8BC144]',
        className
      )}
    >
      <div
        className="pointer-events-auto mx-2 rounded-2xl border-2 border-[#13491e] bg-black/40 px-2 pb-1.5 pt-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.3)] backdrop-blur-md sm:mx-2.5 md:mx-0 md:border-[#13491e]/90 md:bg-black/60 md:px-3 md:py-2 md:shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
        data-interactive="true"
      >
        <div
          className="mb-1.5 h-0.5 w-full overflow-hidden rounded-full bg-white/20 md:mb-2 md:h-1"
          aria-hidden="true"
        >
          <div
            className="h-full rounded-full bg-[#8BC144] transition-[width] duration-75"
            style={{ width }}
          />
        </div>

        <p className="mt-1 text-center text-[11px] font-medium leading-none tracking-wide text-white/70 sm:text-xs md:mt-0.5 md:text-xs md:font-semibold md:text-white/80">
          Select a rating to see the next video
        </p>
        {/* {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="mx-auto mt-1 flex h-8 items-center justify-center px-2 text-[11px] font-semibold text-white/60 underline-offset-2 transition-colors hover:text-white hover:underline"
          >
            or skip to the next video
          </button>
        )} */}
        {error && (
          <p className="mt-1 text-center text-[11px] font-semibold text-rose-300">{error}</p>
        )}
        {closed ? (
          <p className="px-2 py-2 text-center text-xs leading-relaxed text-white/80">
            This contest has ended. You can still watch. Rating is closed.
          </p>
        ) : (
          <div data-rating-scale="10" className="min-w-0 overflow-hidden">
            <StarRating
              value={userRating}
              onChange={onRate}
              disabled={disabled}
              tone="onDark"
              size="overlay"
              scale={RATING_MAX}
              groupLabel="Your rating from 1 to 10"
            />
          </div>
        )}
      </div>
    </section>
  );
});
