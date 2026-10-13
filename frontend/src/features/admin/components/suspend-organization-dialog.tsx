'use client';

import React, { useEffect, useState } from 'react';
import { AlertOctagon, Ban } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SuspendOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationName: string | null;
  error?: string | null;
  onConfirmSuspend: (reason: string) => void | Promise<void>;
}

/**
 * M10-P02-T02. Collects the required free-text suspension reason.
 * There is no reason taxonomy, so no preset categories are offered.
 */
export function SuspendOrganizationDialog({
  open,
  onOpenChange,
  organizationName,
  error,
  onConfirmSuspend,
}: SuspendOrganizationDialogProps) {
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  const handleConfirm = async () => {
    if (!reason.trim()) return;
    setIsSubmitting(true);
    try {
      await onConfirmSuspend(reason.trim());
      onOpenChange(false);
    } catch {
      // The organizations hook records the error. Keep the dialog open.
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!organizationName) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg overflow-hidden border-border/80 bg-card p-0 shadow-2xl">
        <div className="border-b border-rose-500/20 bg-rose-500/10 p-5 pb-4">
          <DialogHeader>
            <div className="flex items-center gap-2 text-rose-400">
              <AlertOctagon className="h-5 w-5" />
              <DialogTitle className="text-lg font-bold text-foreground">
                Suspend {organizationName}
              </DialogTitle>
            </div>
            <DialogDescription className="mt-1 text-xs text-muted-foreground">
              The organization status becomes SUSPENDED. A reason is required and is stored with the
              suspension.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-1.5 p-5">
          <label
            htmlFor="suspension-reason"
            className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
          >
            Suspension reason
          </label>
          <textarea
            id="suspension-reason"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe why this organization is being suspended..."
            className="w-full resize-none rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
          {error && <p className="text-xs font-semibold text-rose-400">{error}</p>}
        </div>

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
            disabled={!reason.trim() || isSubmitting}
            onClick={handleConfirm}
            className="gap-1.5 text-xs font-semibold shadow-md shadow-destructive/20"
          >
            <Ban className="h-3.5 w-3.5" />
            <span>{isSubmitting ? 'Suspending…' : 'Suspend Organization'}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
