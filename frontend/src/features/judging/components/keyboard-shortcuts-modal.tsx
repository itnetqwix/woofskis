'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function KeyboardShortcutsModal({
  open,
  onOpenChange,
  trigger,
}: KeyboardShortcutsModalProps) {
  const shortcuts = [
    { key: '1–9 / 0', label: 'Rate the current video from 1 to 10' },
    { key: 'Space', label: 'Toggle Play / Pause video playback' },
    { key: 'M', label: 'Mute / Unmute audio playback' },
    { key: '↓ / N', label: 'Advance to next video entry in queue' },
    { key: '↑ / P', label: 'Go back to previous video entry' },
    { key: 'R', label: 'Restart queue from the beginning' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-md rounded-3xl border border-white/20 bg-black/90 p-6 text-white backdrop-blur-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-white">
            <Keyboard className="h-5 w-5 text-primary" />
            <span>Viewer Keyboard Shortcuts</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-white/70">
            Control the continuous voting stream directly from your keyboard.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-2">
          {shortcuts.map((sc) => (
            <div
              key={sc.key}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs"
            >
              <span className="font-medium text-white/80">{sc.label}</span>
              <kbd className="inline-flex min-w-[40px] items-center justify-center rounded-lg border border-white/20 bg-white/10 px-2 py-1 font-mono text-[11px] font-bold text-amber-300 shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
