'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/** First two characters, matching the existing feed initials fallback. */
export function profileInitials(name?: string | null): string {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return '??';
  return trimmed.slice(0, 2).toUpperCase();
}

interface ProfileAvatarProps {
  name?: string | null;
  url?: string | null;
  /** Used only when the creator has no profile image. A failed image uses initials. */
  fallbackSrc?: string | null;
  className?: string;
  alt?: string;
}

export function ProfileAvatar({ name, url, fallbackSrc, className, alt }: ProfileAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);
  const label = alt || name || 'Profile';

  useEffect(() => {
    setImageFailed(false);
  }, [url]);

  if (url && !imageFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={label}
        className={cn('object-cover', className)}
        onError={() => setImageFailed(true)}
      />
    );
  }

  if (!url && fallbackSrc && !fallbackFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={fallbackSrc}
        alt={label}
        className={cn('object-cover', className)}
        onError={() => setFallbackFailed(true)}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center bg-primary font-black text-white',
        className
      )}
      aria-label={label}
    >
      {profileInitials(name)}
    </div>
  );
}
