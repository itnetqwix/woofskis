'use client';

import { useEffect, useState } from 'react';
import { AppApiError } from '@/lib/axios';
import { listActiveVideoCategories, type VideoCategory } from '@/services/video-categories-api';

export function useActiveVideoCategories(enabled = true) {
  const [categories, setCategories] = useState<VideoCategory[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setIsLoading(true);
    void listActiveVideoCategories()
      .then((rows) => {
        if (cancelled) return;
        setCategories(rows);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setCategories([]);
        setError(
          err instanceof AppApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Could not load categories'
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { categories, isLoading, error };
}
