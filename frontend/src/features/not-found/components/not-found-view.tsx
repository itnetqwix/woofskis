'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Home,
  Radio,
  ArrowLeft,
  Compass,
  Trophy,
  Heart,
  Video,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTenantTheme } from '@/features/admin/hooks/use-tenant-theme';
import { cn } from '@/lib/utils';

// Decorative Paw Print SVG icon
export function PawPrintIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <ellipse cx="6" cy="6.5" rx="2" ry="2.7" transform="rotate(-20 6 6.5)" />
      <ellipse cx="10.5" cy="4" rx="2" ry="2.8" transform="rotate(-5 10.5 4)" />
      <ellipse cx="15" cy="4.5" rx="2" ry="2.8" transform="rotate(10 15 4.5)" />
      <ellipse cx="19" cy="7.5" rx="2" ry="2.7" transform="rotate(25 19 7.5)" />
      <path d="M7.8 12.8c-1.5 1.5-1.5 3.5-.2 5 1.3 1.5 3.5 2.2 5 1.7 1.2-.4 2.2-.4 3.4 0 1.5.5 3.7-.2 5-1.7 1.3-1.5 1.3-3.5-.2-5-1.8-1.8-3.6-2.2-5.4-1.2-.5.3-1.1.3-1.6 0-1.8-1-3.6-.6-5.4 1.2z" />
    </svg>
  );
}

export function NotFoundView() {
  const router = useRouter();
  const { activeBrand } = useTenantTheme();

  // Safe client-side back navigation: falls back to home if no browser history exists
  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <div className="relative w-full overflow-hidden px-4 py-12 sm:px-6 sm:py-16 md:py-20 lg:px-8">
      {/* Decorative ambient background glows */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[600px] -translate-x-1/2 rounded-full opacity-15 blur-[120px] transition-all duration-700"
        style={{ backgroundColor: activeBrand?.colors.primary || '#fa4616' }}
      />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-[320px] w-[420px] rounded-full bg-amber-500/10 blur-[100px]" />

      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Left Column: Dog Illustration Vignette */}
          <div className="flex justify-center lg:col-span-5 lg:order-2">
            <div className="relative">
              {/* Outer soft glow ring */}
              <div
                className="absolute -inset-3 rounded-[2.5rem] opacity-30 blur-2xl transition-all duration-500 group-hover:opacity-50"
                style={{ backgroundColor: activeBrand?.colors.primary || '#fa4616' }}
              />

              {/* Main character image frame */}
              <div className="relative h-72 w-72 overflow-hidden rounded-[2rem] border-2 border-border/80 bg-card shadow-2xl transition-transform duration-300 hover:scale-[1.02] sm:h-80 sm:w-80 md:h-96 md:w-96">
                <Image
                  src="/images/woofskis_404_pup.jpg"
                  alt="Puzzled golden retriever puppy searching with a magnifying glass"
                  fill
                  priority
                  sizes="(max-width: 640px) 288px, (max-width: 768px) 320px, 384px"
                  className="object-cover transition-transform duration-500 hover:scale-105"
                />

                {/* Subtle vignette gradient overlay */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                {/* Floating playful badge inside card */}
                <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center justify-between rounded-xl border border-white/20 bg-background/80 p-2.5 backdrop-blur-md dark:border-white/10 dark:bg-black/60">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-primary animate-ping" />
                    <span className="font-mono text-[11px] font-bold text-foreground">
                      Trail Sniffer Active
                    </span>
                  </div>
                  <PawPrintIcon className="h-4 w-4 text-primary" />
                </div>
              </div>

              {/* Floating decorative pill on top corner */}
              <div className="absolute -top-3 -right-3 flex items-center gap-1.5 rounded-full border border-border/80 bg-background/95 px-3 py-1 text-xs font-bold text-foreground shadow-lg backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>404 Lost Bone</span>
              </div>

              {/* Playful background paw print decorations */}
              <PawPrintIcon className="pointer-events-none absolute -bottom-6 -left-6 h-10 w-10 rotate-[-18deg] text-primary/20 dark:text-primary/30" />
              <PawPrintIcon className="pointer-events-none absolute -top-6 -left-4 h-7 w-7 rotate-[12deg] text-amber-500/20 dark:text-amber-500/30" />
            </div>
          </div>

          {/* Right Column: Error Content & CTAs */}
          <div className="flex flex-col items-center text-center lg:col-span-7 lg:order-1 lg:items-start lg:text-left">
            {/* 404 Status Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary shadow-xs">
              <Compass className="h-3.5 w-3.5 text-primary animate-spin" style={{ animationDuration: '10s' }} />
              <span className="font-mono tracking-wider">ERROR 404 • TRAIL LOST</span>
            </div>

            {/* Main Required Heading */}
            <h1 className="mt-4 font-heading text-3xl font-black tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-[2.75rem] lg:leading-[1.15]">
              Oops! This Pup Took a{' '}
              <span
                className="bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(to right, ${
                    activeBrand?.colors.primary || '#fa4616'
                  }, #f59e0b)`,
                }}
              >
                Wrong Turn!
              </span>
            </h1>

            {/* Required Supporting Text */}
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              Looks like this page wandered off. Let’s get you back to the fun!
            </p>

            {/* Primary & Secondary Action CTAs */}
            <div className="mt-8 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
              {/* Prominent Back to Home CTA */}
              <Button
                asChild
                size="lg"
                className="shadow-md h-12 rounded-xl bg-primary px-6 text-sm font-bold text-white transition-all duration-200 hover:bg-primary-hover hover:scale-[1.02] active:scale-[0.98] sm:h-12"
                id="back-to-home-cta"
              >
                <Link href="/" className="inline-flex items-center justify-center gap-2">
                  <Home className="h-4 w-4" />
                  <span>Back to Home</span>
                </Link>
              </Button>

              {/* Secondary Explore Videos CTA (Links to live continuous judging queue) */}
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 rounded-xl border-2 border-primary/30 bg-background/80 px-6 text-sm font-bold text-foreground transition-all duration-200 hover:border-primary hover:bg-primary/5 hover:scale-[1.02] active:scale-[0.98] sm:h-12"
                id="explore-videos-cta"
              >
                <Link href="/" className="inline-flex items-center justify-center gap-2">
                  <Radio className="h-4 w-4 text-primary animate-pulse" />
                  <span>Explore Videos</span>
                </Link>
              </Button>

              {/* Safe Go Back button */}
              <Button
                type="button"
                variant="ghost"
                size="lg"
                onClick={handleGoBack}
                className="h-12 rounded-xl px-4 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                id="go-back-btn"
                aria-label="Go back to the previous page"
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                <span>Go Back</span>
              </Button>
            </div>

            {/* Trailhead Quick Nav: Help user find their way easily */}
            <div className="mt-10 w-full border-t border-border/80 pt-6">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Or jump straight into popular trails:
              </p>
              <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <Link
                  href="/leaderboard"
                  className="group flex items-center gap-2.5 rounded-xl border border-border/70 bg-card/60 p-2.5 text-xs font-semibold text-foreground transition-all hover:border-amber-500/50 hover:bg-muted/60"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 transition-colors group-hover:bg-amber-500/20">
                    <Trophy className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 text-left">
                    <span className="block truncate font-bold">Leaderboard</span>
                    <span className="block truncate text-[10px] text-muted-foreground">Top star dogs</span>
                  </div>
                </Link>

                <Link
                  href="/about"
                  className="group flex items-center gap-2.5 rounded-xl border border-border/70 bg-card/60 p-2.5 text-xs font-semibold text-foreground transition-all hover:border-rose-500/50 hover:bg-muted/60"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500 transition-colors group-hover:bg-rose-500/20">
                    <Heart className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 text-left">
                    <span className="block truncate font-bold">About Us</span>
                    <span className="block truncate text-[10px] text-muted-foreground">How judging works</span>
                  </div>
                </Link>

                <Link
                  href="/creator"
                  className="group flex items-center gap-2.5 rounded-xl border border-border/70 bg-card/60 p-2.5 text-xs font-semibold text-foreground transition-all hover:border-primary/50 hover:bg-muted/60"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                    <Video className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 text-left">
                    <span className="block truncate font-bold">Creator Studio</span>
                    <span className="block truncate text-[10px] text-muted-foreground">Submit your dog</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
