'use client';

import React, { useState, useEffect } from 'react';
import {
  contestBannerSrc,
  DEFAULT_CONTEST_BANNER_URL,
} from '@/features/contests/lib/contest-banner';
import { cn } from '@/lib/utils';

export interface ContestBannerThumbnailProps {
  bannerUrl?: string | null;
  title: string;
  className?: string;
}

export function ContestBannerThumbnail({
  bannerUrl,
  title,
  className,
}: ContestBannerThumbnailProps) {
  const initialSrc = contestBannerSrc(bannerUrl);
  const [src, setSrc] = useState<string>(initialSrc);

  useEffect(() => {
    setSrc(contestBannerSrc(bannerUrl));
  }, [bannerUrl]);

  return (
    <div
      className={cn(
        'shadow-xs relative h-12 w-20 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-muted/40 sm:h-14 sm:w-28',
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`${title} banner`}
        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
        onError={() => {
          if (src !== DEFAULT_CONTEST_BANNER_URL) {
            setSrc(DEFAULT_CONTEST_BANNER_URL);
          }
        }}
      />
    </div>
  );
}
