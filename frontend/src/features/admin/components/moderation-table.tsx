'use client';

import React from 'react';
import {
  Search,
  Check,
  X,
  ShieldAlert,
  ShieldCheck,
  Eye,
  CheckSquare,
  Square,
  AlertTriangle,
  Play,
  BadgeCheck,
} from 'lucide-react';
import { AdminSubmissionItem } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function SubmissionStatusBadge({ item }: { item: AdminSubmissionItem }) {
  if (item.status === 'FLAGGED' || item.isFlagged) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning">
        <AlertTriangle className="h-3 w-3" /> Flagged
        {item.flagScore ? ` ${item.flagScore}%` : ''}
      </span>
    );
  }
  if (item.status === 'APPROVED') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
        <Check className="h-3 w-3" /> Approved
      </span>
    );
  }
  if (item.status === 'REJECTED') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-500">
        <X className="h-3 w-3" /> Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-500">
      Pending
    </span>
  );
}

interface ModerationTableProps {
  submissions: AdminSubmissionItem[];
  selectedBatchIds: string[];
  onToggleBatchSelect: (id: string) => void;
  onSelectAllBatch: (ids: string[]) => void;
  onClearBatchSelection: () => void;
  onInspectSubmission: (id: string) => void;
  onApprove: (id: string) => void;
  onRequestReject: (submission: AdminSubmissionItem) => void;
  onToggleFlag: (id: string) => void;
  onBatchApprove: (ids: string[]) => void;
  onRequestBatchReject: (ids: string[]) => void;
}

export function ModerationTable({
  submissions,
  selectedBatchIds,
  onToggleBatchSelect,
  onSelectAllBatch,
  onClearBatchSelection,
  onInspectSubmission,
  onApprove,
  onRequestReject,
  onToggleFlag,
  onBatchApprove,
  onRequestBatchReject,
}: ModerationTableProps) {
  const isAllSelected =
    submissions.length > 0 && submissions.every((s) => selectedBatchIds.includes(s.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      onClearBatchSelection();
    } else {
      onSelectAllBatch(submissions.map((s) => s.id));
    }
  };

  return (
    <div className="space-y-2">
      {selectedBatchIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2">
          <span className="text-xs font-bold text-foreground">
            {selectedBatchIds.length} selected
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              onClick={() => onBatchApprove(selectedBatchIds)}
              className="h-7 gap-1 bg-emerald-600 px-2 text-[11px] font-bold text-white hover:bg-emerald-500"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onRequestBatchReject(selectedBatchIds)}
              className="h-7 gap-1 px-2 text-[11px] font-bold"
            >
              <X className="h-3.5 w-3.5" />
              Reject
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClearBatchSelection}
              className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
            >
              Deselect
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border/80 bg-card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="w-9 px-2 py-2 text-center">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    aria-label={isAllSelected ? 'Deselect all' : 'Select all'}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {isAllSelected ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="px-2 py-2">Submission</th>
                <th className="hidden px-2 py-2 md:table-cell">Creator</th>
                <th className="hidden px-2 py-2 xl:table-cell">Category · Specs</th>
                <th className="px-2 py-2">Status</th>
                <th className="hidden px-2 py-2 lg:table-cell">Submitted</th>
                <th className="px-2 py-2 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60">
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    <Search className="mx-auto h-6 w-6 text-muted-foreground/50" />
                    <p className="mt-1 font-semibold text-foreground">
                      No submissions match these filters
                    </p>
                  </td>
                </tr>
              ) : (
                submissions.map((item) => {
                  const isSelected = selectedBatchIds.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        'transition-colors hover:bg-muted/20',
                        isSelected && 'bg-primary/5'
                      )}
                    >
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => onToggleBatchSelect(item.id)}
                          aria-label={isSelected ? 'Deselect' : 'Select'}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>

                      <td className="px-2 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onInspectSubmission(item.id)}
                            aria-label={`Inspect ${item.title}`}
                            className="group/thumb relative h-11 w-8 shrink-0 overflow-hidden rounded-md border border-border bg-black"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.thumbnailUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                            <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover/thumb:opacity-100">
                              <Play className="h-3 w-3 fill-white text-white" />
                            </span>
                          </button>
                          <div className="min-w-0 max-w-[260px]">
                            <button
                              type="button"
                              onClick={() => onInspectSubmission(item.id)}
                              className="block w-full truncate text-left font-bold text-foreground hover:text-primary"
                            >
                              {item.title}
                            </button>
                            <p className="truncate text-[10px] text-muted-foreground">
                              <span className="md:hidden">{item.creatorName} · </span>
                              {item.durationSeconds}s
                              <span className="lg:hidden">
                                {' · '}
                                {new Date(item.submittedAt).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="hidden px-2 py-2 md:table-cell">
                        <div className="flex min-w-0 items-center gap-1.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.creatorAvatarUrl}
                            alt=""
                            className="h-6 w-6 shrink-0 rounded-full border border-border bg-primary/10 object-cover"
                          />
                          <div className="min-w-0">
                            <p className="flex items-center gap-1 truncate font-semibold text-foreground">
                              <span className="truncate">{item.creatorName}</span>
                              {item.creatorVerified && (
                                <BadgeCheck className="h-3 w-3 shrink-0 text-blue-500" />
                              )}
                            </p>
                            <p className="truncate text-[10px] text-muted-foreground">
                              {item.creatorHandle}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="hidden px-2 py-2 xl:table-cell">
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
                          {item.category}
                        </span>
                        <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
                          {item.resolution} · {item.audioBitrate}
                        </p>
                      </td>

                      <td className="px-2 py-2">
                        <SubmissionStatusBadge item={item} />
                      </td>

                      <td className="hidden whitespace-nowrap px-2 py-2 text-[11px] text-muted-foreground lg:table-cell">
                        {new Date(item.submittedAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="px-2 py-2">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onInspectSubmission(item.id)}
                            className="h-7 w-7 p-0"
                            title="Inspect in split view"
                            aria-label={`Inspect ${item.title}`}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {item.status !== 'APPROVED' && (
                            <Button
                              size="sm"
                              onClick={() => onApprove(item.id)}
                              className="h-7 w-7 bg-emerald-600 p-0 text-white hover:bg-emerald-500"
                              title="Approve"
                              aria-label={`Approve ${item.title}`}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {item.status !== 'REJECTED' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => onRequestReject(item)}
                              className="h-7 w-7 p-0"
                              title="Reject with reason"
                              aria-label={`Reject ${item.title}`}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onToggleFlag(item.id)}
                            className={cn('h-7 w-7 p-0', item.isFlagged && 'bg-warning/15 text-warning')}
                            title={item.isFlagged ? 'Clear flag' : 'Flag suspicious'}
                            aria-label={item.isFlagged ? 'Clear flag' : 'Flag suspicious'}
                          >
                            <ShieldAlert className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
