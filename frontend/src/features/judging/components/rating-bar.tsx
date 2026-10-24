'use client';

import { forwardRef } from 'react';
import { StarRating } from '@/features/judging/components/star-rating';
import { RATING_MAX } from '@/constants/rating-scale';
import { useTenantTheme } from '@/features/admin/hooks/use-tenant-theme';
import { isRipskisBrand } from '@/features/judging/components/brand-rating-icons';
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
  /** Star outline tone. Phones sit on video (`onDark`); tablet/desktop use the theme card. */
  tone?: 'theme' | 'onDark';
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
    tone = 'onDark',
    className,
  },
  ref
) {
  const { activeBrand } = useTenantTheme();
  const isRipskis = isRipskisBrand(activeBrand);
  const width = `${Math.min(100, Math.max(0, progress * 100))}%`;

  return (
    <section
      ref={ref}
      id="judging-rating"
      tabIndex={-1}
      aria-label="Rate this video"
      className={cn(
        'pointer-events-none w-full min-w-0 max-w-full overflow-hidden outline-none',
        isRipskis
          ? 'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#8BC144]'
          : 'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#fa4616]',
        attention && (isRipskis ? 'ring-2 ring-inset ring-[#8BC144]' : 'ring-2 ring-inset ring-[#fa4616]'),
        className
      )}
    >
      <div
        className={cn(
          'pointer-events-auto mx-2 rounded-2xl border border-white/15 ring-1 ring-inset ring-white/5 bg-black/40 px-2 pb-1.5 pt-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.35)] backdrop-blur-md sm:mx-2.5 md:mx-0 md:border md:border-border md:bg-card md:px-4 md:pb-2.5 md:pt-3 md:shadow-sm md:backdrop-blur-none',
          isRipskis ? 'border-[#8BC144]/60' : 'border-[#fa4616]/70'
        )}
        data-interactive="true"
      >
        <div
          className="mb-1.5 h-0.5 w-full overflow-hidden rounded-full bg-white/20 md:hidden"
          aria-hidden="true"
        >
          <div
            className={cn(
              'h-full rounded-full transition-[width] duration-75',
              isRipskis ? 'bg-[#8BC144]' : 'bg-[#fa4616]'
            )}
            style={{ width }}
          />
        </div>

        <p className="mt-1 text-center text-[11px] font-medium leading-none tracking-wide text-white/70 sm:text-xs md:mt-0 md:text-base md:font-bold md:text-foreground">
          Select a rating to see the next video
        </p>
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="mx-auto mt-1 flex h-8 items-center justify-center px-2 text-[11px] font-semibold text-white/60 underline-offset-2 transition-colors hover:text-white hover:underline"
          >
            or skip to the next video
          </button>
        )}
        {error && (
          <p className="mt-1 text-center text-[11px] font-semibold text-rose-300 md:text-destructive">
            {error}
          </p>
        )}
        {closed ? (
          <p className="px-2 py-2 text-center text-xs leading-relaxed text-white/80 md:text-muted-foreground">
            This contest has ended. You can still watch. Rating is closed.
          </p>
        ) : (
          <div
            data-rating-scale="10"
            className="min-w-0 overflow-hidden md:mx-auto md:mt-1.5 md:max-w-[520px]"
          >
            <StarRating
              value={userRating}
              onChange={onRate}
              disabled={disabled}
              tone={tone}
              size="overlay"
              scale={RATING_MAX}
              groupLabel="Your rating from 1 to 10"
              numbered
            />
          </div>
        )}
      </div>
    </section>
  );
});
