'use client';

import React from 'react';
import { Keyboard, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { MODERATION_HOTKEYS } from '@/constants/mock-admin-data';

interface ModerationShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModerationShortcutsModal({ open, onOpenChange }: ModerationShortcutsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Keyboard className="h-5 w-5" />
            <DialogTitle className="text-lg font-bold">Speed Review Hotkeys</DialogTitle>
          </div>
          <DialogDescription className="mt-1 text-xs text-muted-foreground">
            Accelerate your video moderation pipeline using global single-key shortcuts in Split
            Inspection Mode.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 max-h-[50vh] space-y-2 overflow-y-auto">
          {MODERATION_HOTKEYS.map((hk) => (
            <div
              key={hk.key}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/20 p-2.5 text-xs"
            >
              <div className="min-w-0">
                <span className="block font-bold text-foreground">{hk.label}</span>
                <span className="text-[11px] text-muted-foreground">{hk.description}</span>
              </div>
              <kbd className="shadow-xs flex h-7 min-w-[32px] shrink-0 items-center justify-center rounded-lg border border-border bg-card px-2 font-mono text-xs font-bold text-foreground">
                {hk.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-border/60 bg-muted/40 p-3 text-[11px] text-muted-foreground">
          <p>
            💡 <strong className="text-foreground">Pro-Tip:</strong> Shortcuts are automatically
            disabled when typing in modal inputs or textareas.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
