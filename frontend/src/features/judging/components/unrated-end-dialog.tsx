'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function UnratedEndDialog({
  open,
  onOpenChange,
  onRate,
  onSkip,
  onDontShowAgain,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRate: () => void;
  onSkip: () => void;
  onDontShowAgain: (hidden: boolean) => void;
}) {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (open) setChecked(false);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(100%-1.5rem,22rem)] max-w-[22rem] gap-3 rounded-2xl border-white/15 bg-black/80 p-4 text-white backdrop-blur-xl sm:p-5">
        <DialogHeader className="space-y-1.5 text-left">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo/woofskis_logo.png"
              alt="Woofskis"
              className="h-6 w-6 shrink-0 object-contain"
              width={24}
              height={24}
            />
            <DialogTitle className="text-base font-semibold text-white">Rate or Skip</DialogTitle>
          </div>
          <DialogDescription className="text-sm leading-relaxed text-white/70">
            This video ended without a rating. Use the rating controls on the video, or skip to the
            next video.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onRate}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-[#fa4616] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#fa4616]/90"
          >
            Rate Video
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white"
          >
            Skip
          </button>
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm text-white/85">
          <input
            type="checkbox"
            className="h-5 w-5 accent-[#fa4616]"
            checked={checked}
            onChange={(event) => {
              const hidden = event.target.checked;
              setChecked(hidden);
              onDontShowAgain(hidden);
            }}
          />
          Don&apos;t show this again
        </label>
      </DialogContent>
    </Dialog>
  );
}
