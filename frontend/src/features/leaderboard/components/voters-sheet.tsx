'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { initials } from '@/lib/initials';
import { listVoters } from '@/services/voters-api';

export interface VotersSheetProps {
  open: boolean;
  submissionId: string | null;
  title?: string;
  onOpenChange: (open: boolean) => void;
}

export function VotersSheet({ open, submissionId, title, onOpenChange }: VotersSheetProps) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [submissionId]);

  const votersQuery = useQuery({
    queryKey: ['submission-voters', submissionId, page],
    enabled: open && Boolean(submissionId),
    queryFn: async () => {
      if (!submissionId) return null;
      const envelope = await listVoters(submissionId, page);
      if (!envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Voters could not be loaded');
      }
      return envelope.data;
    },
  });

  if (!open || !submissionId) return null;

  const items = votersQuery.data?.items ?? [];
  const pagination = votersQuery.data?.pagination;

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close voters"
        className="pointer-events-auto absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Voters"
        className="pointer-events-auto relative z-10 flex max-h-[70dvh] w-full max-w-md flex-col rounded-t-2xl border border-border bg-background shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-black text-foreground">Voters</h2>
            {title ? <p className="truncate text-xs text-muted-foreground">{title}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-xs font-semibold text-muted-foreground"
          >
            Close
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {votersQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-[#fa4616]" />
              Loading voters…
            </div>
          ) : votersQuery.isError ? (
            <p className="py-6 text-center text-sm text-destructive">
              {votersQuery.error instanceof Error
                ? votersQuery.error.message
                : 'Voters could not be loaded'}
            </p>
          ) : items.length > 0 ? (
            <ul className="space-y-2">
              {items.map((voter) => {
                const name = voter.name?.trim() || 'Guest';
                return (
                  <li
                    key={voter.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2"
                  >
                    {voter.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={voter.avatarUrl}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fa4616] text-[11px] font-bold text-white">
                        {voter.name ? initials(voter.name) : 'G'}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(voter.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-sm font-black tabular-nums text-foreground">
                      {voter.rating}
                      <span className="text-[10px] font-semibold text-muted-foreground"> / 10</span>
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No votes yet.</p>
          )}
        </div>
        {pagination && pagination.totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs">
            <button
              type="button"
              disabled={!pagination.hasPrevPage}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="font-semibold text-foreground disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-muted-foreground">
              {pagination.currentPage} / {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={!pagination.hasNextPage}
              onClick={() => setPage((current) => current + 1)}
              className="font-semibold text-foreground disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
