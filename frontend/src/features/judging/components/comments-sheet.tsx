'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { AppApiError } from '@/lib/axios';
import { initials } from '@/lib/initials';
import { createComment, listComments } from '@/services/comments-api';

export interface CommentsSheetProps {
  open: boolean;
  submissionId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function CommentsSheet({ open, submissionId, onOpenChange }: CommentsSheetProps) {
  const { isAuthenticated } = useAuthSession();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const commentsQuery = useQuery({
    queryKey: ['submission-comments', submissionId],
    enabled: open && Boolean(submissionId),
    queryFn: async () => {
      if (!submissionId) return [];
      const envelope = await listComments(submissionId);
      if (!envelope.success || !Array.isArray(envelope.data)) {
        throw new Error(envelope.message || 'Comments could not be loaded');
      }
      return envelope.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (body: string) => {
      if (!submissionId) throw new Error('Missing video');
      const envelope = await createComment(submissionId, body);
      if (!envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Comment could not be saved');
      }
      if (envelope.data.submissionId !== submissionId) {
        throw new Error('Comment was not saved on this video');
      }
      return envelope.data;
    },
    onSuccess: async () => {
      setDraft('');
      setValidationError(null);
      await queryClient.invalidateQueries({ queryKey: ['submission-comments', submissionId] });
    },
  });

  if (!open || !submissionId) return null;

  const submit = () => {
    const body = draft.trim();
    if (!body) {
      setValidationError('Comment cannot be empty');
      return;
    }
    if (body.length > 500) {
      setValidationError('Comment cannot exceed 500 characters');
      return;
    }
    setValidationError(null);
    createMutation.mutate(body);
  };

  const mutationMessage =
    createMutation.error instanceof AppApiError
      ? createMutation.error.message
      : createMutation.error instanceof Error
        ? createMutation.error.message
        : null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close comments"
        className="pointer-events-auto absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Comments"
        className="pointer-events-auto relative z-10 flex max-h-[70dvh] w-full max-w-md flex-col rounded-t-2xl border border-border bg-background shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-black text-foreground">Comments</h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-xs font-semibold text-muted-foreground"
          >
            Close
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {commentsQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-[#8BC144]" />
              Loading comments…
            </div>
          ) : commentsQuery.isError ? (
            <p className="py-6 text-center text-sm text-destructive">
              {commentsQuery.error instanceof Error
                ? commentsQuery.error.message
                : 'Comments could not be loaded'}
            </p>
          ) : commentsQuery.data && commentsQuery.data.length > 0 ? (
            <ul className="space-y-3">
              {commentsQuery.data.map((comment) => (
                <li key={comment.id} className="rounded-xl border border-border bg-card px-3 py-2">
                  <div className="flex items-center gap-2">
                    {comment.author.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={comment.author.avatarUrl}
                        alt=""
                        className="h-7 w-7 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#13491e] text-[10px] font-bold text-white">
                        {initials(comment.author.name)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-foreground">
                        {comment.author.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-foreground">{comment.body}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No comments yet.</p>
          )}
        </div>
        <div className="border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {isAuthenticated ? (
            <form
              className="flex items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                submit();
              }}
            >
              <label className="min-w-0 flex-1">
                <span className="sr-only">Write a comment</span>
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder="Write a comment"
                  className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
              </label>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="h-11 shrink-0 rounded-xl bg-[#8BC144] px-3 text-xs font-bold text-white disabled:opacity-50"
              >
                Submit
              </button>
            </form>
          ) : (
            <p className="text-center text-xs text-muted-foreground">
              Guest comments are not specified.{' '}
              <Link href="/login" className="font-bold text-[#8BC144]">
                Sign in
              </Link>{' '}
              to comment.
            </p>
          )}
          {validationError ? (
            <p className="mt-2 text-xs font-semibold text-destructive">{validationError}</p>
          ) : null}
          {mutationMessage ? (
            <p className="mt-2 text-xs font-semibold text-destructive">{mutationMessage}</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
