'use client';

import React from 'react';
import Link from 'next/link';
import {
  Heart,
  Radio,
  Trophy,
  Sparkles,
  ShieldCheck,
  Video,
  Award,
  LogIn,
} from 'lucide-react';
import { useTenantTheme } from '@/features/admin/hooks/use-tenant-theme';
import { cn } from '@/lib/utils';

export function AppFooter({ className }: { className?: string }) {
  const { activeBrand } = useTenantTheme();
  const currentYear = new Date().getFullYear();

  return (
    <footer
      aria-label="Woofskis Footer"
      className={cn(
        'relative border-t border-border/80 bg-card/60 backdrop-blur-md text-foreground transition-colors',
        className
      )}
    >
      {/* Decorative top ambient glow */}
      <div
        className="pointer-events-none absolute -top-12 left-1/2 h-24 w-3/4 -translate-x-1/2 rounded-full opacity-10 blur-3xl"
        style={{ backgroundColor: activeBrand?.colors.primary || '#fa4616' }}
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Info (spans 2 columns on lg) */}
          <div className="space-y-4 lg:col-span-2">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Woofskis Home"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeBrand?.logoUrl || '/logo/woofskis_logo_with_dog_transparent.png'}
                alt="Woofskis Logo"
                className="h-auto max-h-12 w-[120px] object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-105 sm:max-h-14 sm:w-[140px]"
                width={140}
                height={56}
              />
            </Link>

            <p className="text-sm font-semibold text-primary">
              Where Every Dog Has a Chance to Be a Star.
            </p>

            <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
              Woofskis is the community-driven platform where dog lovers watch, rate, and celebrate
              dogs through fun, fair video contests. Every dog deserves their moment in the spotlight.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-mono text-[11px] font-semibold text-primary">
                <Sparkles className="h-3 w-3" />
                Community-Powered
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 font-mono text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                <ShieldCheck className="h-3 w-3" />
                Fair Scoring
              </span>
            </div>
          </div>

          {/* Column 1: Explore */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Explore
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary"
                >
                  <Radio className="h-3.5 w-3.5 text-primary" />
                  <span>Live Judging</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/leaderboard"
                  className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-amber-500"
                >
                  <Trophy className="h-3.5 w-3.5 text-amber-500" />
                  <span>Leaderboard</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-rose-500 font-medium"
                >
                  <Heart className="h-3.5 w-3.5 text-rose-500" />
                  <span>About Woofskis</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Creators */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              For Creators
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/creator"
                  className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Video className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Creator Studio</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span>Join as a Creator</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <LogIn className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Sign In</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Trust & Fair Play */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Fair Play
            </h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-primary" />
                <span>1–10 Rating System</span>
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>HMAC Anti-Fraud Protection</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Live Consensus Formula</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom divider and copyright */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {currentYear} Woofskis. Celebrating dogs everywhere.</p>
          <div className="flex items-center gap-4">
            <Link href="/about" className="transition-colors hover:text-foreground">
              About
            </Link>
            <span>•</span>
            <Link href="/" className="transition-colors hover:text-foreground">
              Watch Videos
            </Link>
            <span>•</span>
            <Link href="/leaderboard" className="transition-colors hover:text-foreground">
              Leaderboard
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
