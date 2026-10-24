'use client';

import { RATING_MAX, isStarFilled } from '@/constants/rating-scale';
import { cn } from '@/lib/utils';
import { useTenantTheme } from '@/features/admin/hooks/use-tenant-theme';
import {
  isRipskisBrand,
  PawRatingIcon,
  JointRatingIcon,
} from '@/features/judging/components/brand-rating-icons';

const RATING_ICON_SIZE = {
  /** Modal: ~32px at 360, up to 36px. Touch row is 48px. */
  md: 'h-[clamp(1.5rem,9.85cqi,2.25rem)] w-[clamp(1.5rem,9.85cqi,2.25rem)]',
  /** Last-rated card: 24–30px with a gap between glyphs. */
  card: 'h-[clamp(1.5rem,8.8cqi,1.875rem)] w-[clamp(1.5rem,8.8cqi,1.875rem)]',
  /** Video overlay: 10 icons, ~90% of the row, so the strip cannot overflow. */
  overlay: 'h-[clamp(0.75rem,9cqi,1.65rem)] w-[clamp(0.75rem,9cqi,1.65rem)]',
} as const;

export function StarRating({
  value,
  onChange,
  disabled = false,
  readOnly = false,
  tone = 'theme',
  size = 'md',
  scale = RATING_MAX,
  layout = 'spread',
  groupLabel,
  numbered = false,
  brand,
}: {
  value: number | null;
  onChange?: (rating: number) => void;
  disabled?: boolean;
  readOnly?: boolean;
  tone?: 'theme' | 'onDark';
  size?: 'md' | 'card' | 'overlay';
  scale?: number;
  layout?: 'spread' | 'inline';
  groupLabel?: string;
  /** Tablet/desktop only: show the value under each icon. */
  numbered?: boolean;
  /** Optional brand override (e.g. 'woofskis' or 'ripskis'). Defaults to active tenant theme. */
  brand?: string;
}) {
  const { activeBrand } = useTenantTheme();
  const effectiveBrand = brand || activeBrand?.slug || activeBrand?.id || 'woofskis';
  const isRipskis = isRipskisBrand(effectiveBrand);

  const starCount = scale;
  const iconClass = layout === 'inline' ? 'h-8 w-8' : RATING_ICON_SIZE[size];

  // Brand-tailored palettes:
  // Woofskis: Vibrant Brand Orange (#fa4616)
  // Ripskis: Fresh Rolled Herbal Lime/Green (#8BC144)
  const defaultGroupLabel = readOnly
    ? isRipskis
      ? 'Community joints'
      : 'Community paws'
    : `Your rating from 1 to ${starCount}`;

  return (
    <div
      className={cn(
        'min-w-0',
        layout === 'inline'
          ? 'inline-flex w-auto items-center justify-center gap-1 sm:gap-2'
          : cn(
              'flex w-full',
              size === 'card' ? 'h-8' : size === 'overlay' ? 'h-9' : 'h-12',
              numbered && 'md:h-14'
            )
      )}
      style={layout === 'spread' ? { containerType: 'inline-size' } : undefined}
      role={readOnly ? 'img' : 'radiogroup'}
      aria-label={groupLabel ?? defaultGroupLabel}
      data-rating-stars={String(starCount)}
      data-brand={isRipskis ? 'ripskis' : 'woofskis'}
    >
      {Array.from({ length: starCount }, (_, index) => {
        const star = index + 1;
        const on = isStarFilled(star, value);

        const glyphClasses = cn(
          iconClass,
          'shrink-0',
          'motion-safe:transition-all motion-safe:duration-150',
          on && size === 'md' && layout === 'spread' && 'motion-safe:scale-110',
          on
            ? isRipskis
              ? 'fill-[#8BC144] text-[#8BC144] drop-shadow-[0_0_6px_rgba(139,193,68,0.45)]'
              : 'fill-[#fa4616] text-[#fa4616] drop-shadow-[0_0_6px_rgba(250,70,22,0.4)]'
            : tone === 'onDark'
              ? 'fill-transparent text-white/35 hover:text-white/70'
              : 'fill-transparent text-foreground/30 hover:text-foreground/70'
        );

        const glyph = isRipskis ? (
          <JointRatingIcon filled={on} className={glyphClasses} />
        ) : (
          <PawRatingIcon filled={on} className={glyphClasses} />
        );

        if (readOnly) {
          return (
            <span
              key={star}
              className="flex h-full min-w-0 flex-1 items-center justify-center"
              data-filled={on ? 'true' : 'false'}
            >
              {glyph}
            </span>
          );
        }

        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`Rate ${star} out of ${starCount}`}
            disabled={disabled}
            data-filled={on ? 'true' : 'false'}
            data-rating-value={star}
            onClick={() => onChange?.(star)}
            className={cn(
              'touch-manipulation items-center justify-center rounded-md',
              isRipskis
                ? 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8BC144]'
                : 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa4616]',
              'transition-all duration-100 hover:scale-110 hover:bg-white/10 active:scale-95 disabled:opacity-50',
              layout === 'inline' ? 'flex h-12 w-12 shrink-0' : 'flex h-full min-w-0 flex-1',
              value === star && (isRipskis ? 'bg-[#8BC144]/15' : 'bg-[#fa4616]/15'),
              numbered && 'md:flex-col md:gap-1'
            )}
          >
            {glyph}
            {numbered && (
              <span
                aria-hidden="true"
                className="hidden text-[11px] font-medium leading-none text-muted-foreground md:block"
              >
                {star}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export { StarRating as BrandRating };
