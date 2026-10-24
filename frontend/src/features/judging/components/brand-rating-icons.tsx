'use client';

import React from 'react';

export interface BrandRatingIconProps {
  filled?: boolean;
  className?: string;
  strokeWidth?: number;
  tone?: 'theme' | 'onDark';
  'aria-hidden'?: boolean | 'true' | 'false';
  style?: React.CSSProperties;
}

/**
 * Determines whether the active tenant brand is Ripskis based on brand configuration.
 * Avoids fragile URL checks and respects the tenant theme system.
 */
export function isRipskisBrand(
  brandOrSlug?: { slug?: string; id?: string; name?: string } | string | null
): boolean {
  if (!brandOrSlug) return false;
  const val =
    typeof brandOrSlug === 'string'
      ? brandOrSlug
      : brandOrSlug.slug || brandOrSlug.id || brandOrSlug.name || '';
  return val.trim().toLowerCase() === 'ripskis';
}

/**
 * Woofskis Paw-Print Rating Icon
 *
 * Cute, playful dog paw print consisting of 4 distinct toe pads and a rounded metacarpal pad.
 * In unselected states, renders a crisp outline; in selected/submitted states, fills with
 * Woofskis vibrant brand orange (#fa4616) or current theme foreground.
 */
export function PawRatingIcon({
  filled = false,
  className,
  strokeWidth = 1.75,
  'aria-hidden': ariaHidden = true,
  style,
}: BrandRatingIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={ariaHidden}
      data-rating-glyph="paw"
      data-filled={filled ? 'true' : 'false'}
      style={style}
    >
      {/* 4 Playful Dog Toe Pads (arch formation) */}
      <ellipse cx="6" cy="6.5" rx="2" ry="2.7" transform="rotate(-20 6 6.5)" />
      <ellipse cx="10.5" cy="4" rx="2" ry="2.8" transform="rotate(-5 10.5 4)" />
      <ellipse cx="15" cy="4.5" rx="2" ry="2.8" transform="rotate(10 15 4.5)" />
      <ellipse cx="19" cy="7.5" rx="2" ry="2.7" transform="rotate(25 19 7.5)" />
      {/* Metacarpal Main Heel/Palm Pad */}
      <path d="M7.8 12.8c-1.5 1.5-1.5 3.5-.2 5 1.3 1.5 3.5 2.2 5 1.7 1.2-.4 2.2-.4 3.4 0 1.5.5 3.7-.2 5-1.7 1.3-1.5 1.3-3.5-.2-5-1.8-1.8-3.6-2.2-5.4-1.2-.5.3-1.1.3-1.6 0-1.8-1-3.6-.6-5.4 1.2z" />
    </svg>
  );
}

/**
 * Ripskis Rolled Cannabis Joint Rating Icon
 *
 * Slim, cigarette-shaped roll with rolling paper, a distinct filter/crutch seam near the mouthpiece,
 * and a recognizable pinched/twisted pointed end at the tip.
 *
 * Distinctly hand-rolled (not a bong, vape, pack, or generic cannabis leaf).
 * Scaled and balanced to remain legible at 16px, 24px, 32px, and 48px sizes.
 */
export function JointRatingIcon({
  filled = false,
  className,
  strokeWidth = 1.5,
  'aria-hidden': ariaHidden = true,
  style,
}: BrandRatingIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={ariaHidden}
      data-rating-glyph="joint"
      data-filled={filled ? 'true' : 'false'}
      style={style}
    >
      {/* Slim hand-rolled cone roll with pointed twisted tip */}
      <path
        d="M4.2 18.2 L14 8.4 C15 7.4 16.2 6.8 17.5 7 L20.5 4 C20.9 3.6 21.4 4.1 21 4.5 L19 7.5 C19.2 8.8 18.6 10 17.6 11 L7.8 20.8 C7.2 21.4 6.2 21.4 5.6 20.8 L4.2 19.4 C3.6 18.8 3.6 18.2 4.2 18.2 Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />
      {/* Filter / Crutch Seam Line */}
      <line
        x1="7.2"
        y1="15.2"
        x2="9.8"
        y2="17.8"
        stroke={filled ? '#13491e' : 'currentColor'}
        strokeWidth={strokeWidth}
      />
      {/* Twisted Tip Fold Creases (defining the hand-rolled paper twist) */}
      <path
        d="M15.2 8.8 C16.2 7.8 17.5 8 18.5 9"
        stroke={filled ? '#13491e' : 'currentColor'}
        strokeWidth={Math.max(1, strokeWidth - 0.25)}
      />
      <path
        d="M17 6.8 C17.8 6.2 18.8 6.5 19.3 7.3"
        stroke={filled ? '#13491e' : 'currentColor'}
        strokeWidth={Math.max(1, strokeWidth - 0.25)}
      />
    </svg>
  );
}

/**
 * Brand-specific rating glyph switcher. Automatically selects PawRatingIcon for Woofskis
 * and JointRatingIcon for Ripskis.
 */
export function BrandRatingGlyph({
  brand,
  filled,
  className,
  strokeWidth,
  tone,
  style,
}: BrandRatingIconProps & { brand?: string }) {
  if (isRipskisBrand(brand)) {
    return (
      <JointRatingIcon
        filled={filled}
        className={className}
        strokeWidth={strokeWidth}
        tone={tone}
        style={style}
      />
    );
  }
  return (
    <PawRatingIcon
      filled={filled}
      className={className}
      strokeWidth={strokeWidth}
      tone={tone}
      style={style}
    />
  );
}
