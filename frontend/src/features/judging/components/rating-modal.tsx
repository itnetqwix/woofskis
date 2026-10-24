'use client';

import React, { useEffect, useRef, useState } from 'react';
import { RATING_MAX, RATING_MIN } from '@/constants/rating-scale';
import { formatAverageScore, formatVoteCount } from '@/features/judging/lib/feed-state';
import { StarRating } from '@/features/judging/components/star-rating';
import { useTenantTheme } from '@/features/admin/hooks/use-tenant-theme';
import { isRipskisBrand } from '@/features/judging/components/brand-rating-icons';

export interface RatingModalProps {
  open: boolean;
  initialRating?: number | null;
  existingRating?: number | null;
  communityScore?: number | null;
  communityVotes?: number | null;
  disabled?: boolean;
  error?: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (rating: number) => void;
}

export function RatingModal({
  open,
  initialRating = null,
  existingRating = null,
  communityScore = null,
  communityVotes = null,
  disabled = false,
  error = null,
  onOpenChange,
  onSubmit,
}: RatingModalProps) {
  const { activeBrand } = useTenantTheme();
  const isRipskis = isRipskisBrand(activeBrand);
  const panelRef = useRef<HTMLDivElement>(null);
  const initialRef = useRef(initialRating);
  initialRef.current = initialRating;
  const [selected, setSelected] = useState<number | null>(initialRating);

  useEffect(() => {
    if (open) setSelected(initialRef.current ?? null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onOpenChange(false);
        return;
      }
      if (event.key >= '1' && event.key <= '9') {
        event.preventDefault();
        setSelected(Number(event.key));
        return;
      }
      if (event.key === '0') {
        event.preventDefault();
        setSelected(RATING_MAX);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center px-2 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rating-modal-title"
    >
      <button
        type="button"
        aria-label="Close rating"
        className="absolute inset-0 bg-black/60"
        onClick={() => onOpenChange(false)}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative z-10 max-h-[min(90dvh,640px)] w-full min-w-0 max-w-sm overflow-y-auto overflow-x-hidden rounded-2xl border border-border bg-background px-2.5 py-4 shadow-2xl outline-none motion-safe:duration-200 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-reduce:animate-none sm:p-5"
      >
        <h2
          id="rating-modal-title"
          className="text-center font-sans text-base font-bold text-foreground"
        >
          Your rating
        </h2>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          {selected === null ? `Choose ${RATING_MIN}–${RATING_MAX}` : `${selected} / 10`}
        </p>
        <div className="mt-3">
          <StarRating value={selected} disabled={disabled} size="md" onChange={setSelected} />
        </div>
        <div className="mt-4 border-t border-border pt-3 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Community
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {communityVotes && communityVotes > 0
              ? `${formatAverageScore(communityScore ?? 0)} / 10 · ${formatVoteCount(communityVotes)} ${communityVotes === 1 ? 'vote' : 'votes'}`
              : 'No votes yet'}
          </p>
        </div>
        {error ? (
          <p className="mt-3 text-center text-xs font-semibold text-destructive">{error}</p>
        ) : null}
        <button
          type="button"
          disabled={disabled || selected === null}
          onClick={() => {
            if (selected !== null) onSubmit(selected);
          }}
          className={
            isRipskis
              ? 'mt-4 h-12 w-full rounded-xl bg-[#8BC144] text-sm font-bold text-white transition-colors hover:bg-[#8BC144]/90 disabled:opacity-50'
              : 'mt-4 h-12 w-full rounded-xl bg-[#fa4616] text-sm font-bold text-white transition-colors hover:bg-[#fa4616]/90 disabled:opacity-50'
          }
        >
          {existingRating !== null ? 'Update rating' : 'Submit rating'}
        </button>
      </div>
    </div>
  );
}

