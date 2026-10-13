'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Send,
  Sparkles,
  Tv2,
  Music2,
  Clock,
  ShieldAlert,
  BadgeAlert,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AdminSubmissionItem, RejectionReasonCode } from '@/types/admin';
import { REJECTION_REASON_PRESETS } from '@/constants/mock-admin-data';
import { cn } from '@/lib/utils';

interface RejectReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: AdminSubmissionItem | null;
  onConfirmReject: (id: string, code: RejectionReasonCode, notes: string) => void | Promise<void>;
}

const REASON_ICONS: Record<string, React.ReactNode> = {
  BadgeAlert: <BadgeAlert className="h-4 w-4" />,
  Music2: <Music2 className="h-4 w-4" />,
  Clock: <Clock className="h-4 w-4" />,
  ShieldAlert: <ShieldAlert className="h-4 w-4" />,
  Tv2: <Tv2 className="h-4 w-4" />,
  FileText: <FileText className="h-4 w-4" />,
};

export function RejectReasonDialog({
  open,
  onOpenChange,
  submission,
  onConfirmReject,
}: RejectReasonDialogProps) {
  const [selectedCode, setSelectedCode] = useState<RejectionReasonCode>('WATERMARK');
  const [customNotes, setCustomNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // When dialog opens or submission changes, reset to default note for chosen reason
  useEffect(() => {
    if (open && submission) {
      // Check if submission already had a flagged reason
      let defaultCode: RejectionReasonCode = 'WATERMARK';
      if (submission.isFlagged && submission.flagReason?.toLowerCase().includes('audio')) {
        defaultCode = 'COPYRIGHT_AUDIO';
      }
      setSelectedCode(defaultCode);
      const preset = REJECTION_REASON_PRESETS.find((p) => p.code === defaultCode);
      setCustomNotes(preset?.defaultFeedback || '');
    }
  }, [open, submission]);

  const handleReasonCodeChange = (code: RejectionReasonCode) => {
    setSelectedCode(code);
    const preset = REJECTION_REASON_PRESETS.find((p) => p.code === code);
    if (preset) {
      setCustomNotes(preset.defaultFeedback);
    }
  };

  const handleConfirm = async () => {
    if (!submission || !customNotes.trim()) return;
    setIsSubmitting(true);
    try {
      await onConfirmReject(submission.id, selectedCode, customNotes.trim());
      onOpenChange(false);
    } catch {
      // The queue hook records the error. Keep the dialog open.
    } finally {
      setIsSubmitting(false);
    }
  };

  const insertTimestampTemplate = () => {
    setCustomNotes((prev) => `${prev} [Timestamp reference: 0:12]`);
  };

  const insertResolutionTemplate = () => {
    setCustomNotes(
      (prev) =>
        `${prev} Current specs: ${submission?.resolution || 'Unknown'}. Required: 1080x1920 (9:16 vertical).`
    );
  };

  if (!submission) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl overflow-hidden border-border/80 bg-card p-0 shadow-2xl">
        {/* MODAL HEADER */}
        <div className="border-b border-destructive/20 bg-destructive/10 p-5 pb-4">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle className="text-lg font-bold text-foreground">
                Reject Contest Submission
              </DialogTitle>
            </div>
            <DialogDescription className="mt-1 text-xs text-muted-foreground">
              Select standard rejection reason codes. Constructive feedback will be sent directly to
              the creator with resubmission guidance.
            </DialogDescription>
          </DialogHeader>

          {/* ITEM SUMMARY CARD */}
          <div className="mt-3.5 flex items-center gap-3 rounded-xl border border-border/60 bg-background/80 p-2.5 backdrop-blur-sm">
            <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={submission.thumbnailUrl}
                alt={submission.title}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-muted-foreground">{submission.id}</span>
                <span className="py-0.2 rounded bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">
                  {submission.category}
                </span>
              </div>
              <h4 className="truncate text-xs font-bold text-foreground">{submission.title}</h4>
              <p className="truncate text-[11px] text-muted-foreground">
                by <span className="font-semibold text-foreground">{submission.creatorName}</span> (
                {submission.creatorHandle})
              </p>
            </div>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="max-h-[60vh] space-y-4 overflow-y-auto p-5">
          {/* PRE-CONFIGURED REASONS */}
          <div className="space-y-2">
            <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <span>1. Standard Violation Categories</span>
              <span className="text-[11px] font-normal normal-case text-muted-foreground">
                Select applicable rule
              </span>
            </label>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {REJECTION_REASON_PRESETS.map((preset) => {
                const isSelected = selectedCode === preset.code;
                return (
                  <button
                    type="button"
                    key={preset.code}
                    onClick={() => handleReasonCodeChange(preset.code)}
                    className={cn(
                      'flex items-start gap-2.5 rounded-xl border p-2.5 text-left transition-all',
                      isSelected
                        ? 'border-destructive bg-destructive/10 text-foreground ring-1 ring-destructive/50'
                        : 'border-border/70 bg-card text-muted-foreground hover:border-destructive/30 hover:bg-muted/40'
                    )}
                  >
                    <div
                      className={cn(
                        'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg',
                        isSelected
                          ? 'bg-destructive text-destructive-foreground'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {REASON_ICONS[preset.iconName] || <AlertTriangle className="h-3.5 w-3.5" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            'text-xs font-semibold',
                            isSelected ? 'font-bold text-foreground' : 'text-foreground/90'
                          )}
                        >
                          {preset.title}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="ml-1 h-3.5 w-3.5 shrink-0 text-destructive" />
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[10px] leading-tight text-muted-foreground">
                        {preset.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CUSTOM MODERATOR FEEDBACK TEXTAREA */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                2. Moderator Feedback & Resubmission Guidance
              </label>
              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={insertTimestampTemplate}
                  className="text-[10px] font-medium text-primary hover:underline"
                >
                  + Add Timestamp
                </button>
                <span className="text-muted-foreground">|</span>
                <button
                  type="button"
                  onClick={insertResolutionTemplate}
                  className="text-[10px] font-medium text-primary hover:underline"
                >
                  + Add Specs
                </button>
              </div>
            </div>

            <textarea
              rows={4}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Provide clear, actionable instructions for how the creator can rectify the submission..."
              className="w-full resize-none rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-destructive focus:outline-none focus:ring-1 focus:ring-destructive"
            />

            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Visible to {submission.creatorName} in Creator Studio</span>
              <span>{customNotes.length} characters</span>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="flex items-center justify-end gap-2.5 border-t border-border bg-muted/30 p-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs font-semibold"
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={!customNotes.trim() || isSubmitting}
            onClick={handleConfirm}
            className="gap-1.5 text-xs font-semibold shadow-md shadow-destructive/20"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Confirm Rejection & Notify Creator</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
