'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Heart,
  Radio,
  Trophy,
  Sparkles,
  Star,
  ShieldCheck,
  CheckCircle2,
  Users,
  Video,
  Play,
  ArrowRight,
  UploadCloud,
  Eye,
  Sliders,
  Scale,
  Smile,
  Compass,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTenantTheme } from '@/features/admin/hooks/use-tenant-theme';
import { AboutDoodleWallpaper } from './about-doodle-wallpaper';

export function AboutPageView() {
  const { activeBrand } = useTenantTheme();
  const [activeTab, setActiveTab] = useState<'viewer' | 'creator'>('viewer');

  return (
    <div className="relative w-full overflow-hidden text-foreground antialiased selection:bg-primary/20">
      {/* WhatsApp-inspired subtle repeating doodle wallpaper */}
      <AboutDoodleWallpaper />

      {/* Background ambient light effects */}
      <div
        className="pointer-events-none absolute -top-48 left-1/2 h-[550px] w-[800px] -translate-x-1/2 rounded-full opacity-15 blur-[120px] transition-all duration-700"
        style={{ backgroundColor: activeBrand?.colors.primary || '#fa4616' }}
      />
      <div className="pointer-events-none absolute top-[35%] -left-48 h-[400px] w-[500px] rounded-full bg-amber-500/10 blur-[100px]" />
      <div className="pointer-events-none absolute top-[70%] -right-48 h-[500px] w-[600px] rounded-full bg-primary/10 blur-[110px]" />

      {/* =========================================================================
          SECTION 1: HERO — WELCOME TO WOOFSKIS
          ========================================================================= */}
      <section
        aria-labelledby="hero-heading"
        className="relative mx-auto max-w-7xl px-4 pt-8 pb-16 sm:px-6 sm:pt-14 sm:pb-24 lg:px-8"
      >
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Hero Left Content */}
          <div className="space-y-6 text-center lg:col-span-7 lg:text-left">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary shadow-xs">
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-primary" />
              <span>The Premier Dog Video Competition Platform</span>
            </div>

            {/* Headline */}
            <h1
              id="hero-heading"
              className="text-display font-black tracking-tight text-foreground"
            >
              Where Every Dog Has a Chance to{' '}
              <span
                className="bg-gradient-to-r from-primary via-amber-500 to-rose-500 bg-clip-text text-transparent"
              >
                Be a Star.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
              Woofskis is a joyful, community-driven platform where dog lovers watch, rate, and
              celebrate dogs through fun video contests. Watch one dog at a time, submit genuine
              ratings, and help the community honor extraordinary dogs everywhere.
            </p>

            {/* Call to Actions */}
            <div className="flex flex-col items-center justify-center gap-3.5 pt-2 sm:flex-row lg:justify-start">
              <Button
                asChild
                size="lg"
                className="group h-12 w-full gap-2 rounded-xl bg-primary px-7 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-hover hover:shadow-xl hover:shadow-primary/30 sm:w-auto"
              >
                <Link href="/" id="hero-cta-watch">
                  <Play className="h-4 w-4 fill-current transition-transform group-hover:scale-110" />
                  <span>Watch & Rate Videos</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 w-full gap-2 rounded-xl border-2 border-border/80 bg-background/80 px-7 text-sm font-bold text-foreground backdrop-blur-sm transition-all hover:border-primary hover:bg-muted sm:w-auto"
              >
                <Link href="/register" id="hero-cta-creator">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>Become a Creator</span>
                </Link>
              </Button>
            </div>

            {/* Trust Highlights */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-medium text-muted-foreground lg:justify-start">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>100% Community Judged</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Fair 1–10 Rating System</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Anti-Fraud Protected</span>
              </div>
            </div>
          </div>

          {/* Hero Right Media Card */}
          <div className="relative mx-auto w-full max-w-lg lg:col-span-5 lg:max-w-none">
            <div className="relative overflow-hidden rounded-3xl border-2 border-primary/20 bg-card/60 p-3 shadow-2xl backdrop-blur-md">
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/woofskis_hero_dogs.jpg"
                  alt="Joyful dogs celebrating on Woofskis"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  width={640}
                  height={400}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Overlay live tag */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-xl bg-black/60 px-3 py-1.5 backdrop-blur-md">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-semibold text-white">Live Contests Open</span>
                </div>
              </div>

              {/* Floating Stat Pill Bottom Right */}
              <div className="mt-3 flex items-center justify-between rounded-xl bg-muted/60 px-4 py-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                    <Trophy className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">Real-Time Leaderboards</p>
                    <p className="text-[11px] text-muted-foreground">Every vote recalculates rank</p>
                  </div>
                </div>
                <Link
                  href="/leaderboard"
                  className="text-xs font-bold text-primary hover:underline"
                >
                  View Podium &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: WHAT IS WOOFSKIS?
          ========================================================================= */}
      <section
        aria-labelledby="what-is-woofskis-heading"
        className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
            <Compass className="h-3.5 w-3.5" />
            <span>Platform Overview</span>
          </div>
          <h2
            id="what-is-woofskis-heading"
            className="text-h1 font-black tracking-tight text-foreground"
          >
            A Pure Stage for Dog Videos. No Noise, Just Love.
          </h2>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Woofskis was built with one goal: to create a fair, focused space where dog lovers can
            enjoy dog videos and celebrate real pets. We replace chaotic endless scrolling with an
            intentional contest experience that treats every canine contestant like royalty.
          </p>
        </div>

        {/* Two-Persona Interactive Switcher */}
        <div className="mt-12">
          <div className="flex justify-center">
            <div className="inline-flex rounded-2xl border border-border/80 bg-muted/50 p-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('viewer')}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all sm:text-sm',
                  activeTab === 'viewer'
                    ? 'bg-background text-foreground shadow-md ring-1 ring-border'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Eye className="h-4 w-4 text-primary" />
                <span>As a Viewer & Fan</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('creator')}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all sm:text-sm',
                  activeTab === 'creator'
                    ? 'bg-background text-foreground shadow-md ring-1 ring-border'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Video className="h-4 w-4 text-amber-500" />
                <span>As a Dog Owner & Creator</span>
              </button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Viewer Perspective Card */}
            <div
              className={cn(
                'rounded-3xl border p-6 transition-all duration-300 sm:p-8',
                activeTab === 'viewer'
                  ? 'border-primary/40 bg-card/90 shadow-xl shadow-primary/5 ring-1 ring-primary/20'
                  : 'border-border/70 bg-card/40 opacity-80'
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Radio className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-h3 font-bold text-foreground">
                Watch, Enjoy & Judge Honest Moments
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Sit back and enjoy short, adorable dog videos one at a time. No cluttered comments
                pushing rage-bait or irrelevant trends. When you watch, you have the power to cast
                a genuine 1–10 rating that directly determines which dogs rise up the podium.
              </p>

              <ul className="mt-6 space-y-3 text-xs sm:text-sm">
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>Focused single-video feed designed for relaxation and smiles</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>Easy rating on screen or with keyboard keys 1–10</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>Instant consensus reveal showing your rating&apos;s impact</span>
                </li>
              </ul>

              <div className="mt-8 pt-4 border-t border-border/60">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline"
                >
                  <span>Start Judging Today&apos;s Dogs</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Creator Perspective Card */}
            <div
              className={cn(
                'rounded-3xl border p-6 transition-all duration-300 sm:p-8',
                activeTab === 'creator'
                  ? 'border-amber-500/40 bg-card/90 shadow-xl shadow-amber-500/5 ring-1 ring-amber-500/20'
                  : 'border-border/70 bg-card/40 opacity-80'
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-h3 font-bold text-foreground">
                Give Your Dog the Spotlight They Deserve
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Every dog has a special spark—whether it&apos;s an acrobatic frisbee catch, a hilarious
                bark conversation, or pure puppy sweetness. Join as a creator to enter your dog in
                official contests and celebrate their personality with thousands of dog lovers.
              </p>

              <ul className="mt-6 space-y-3 text-xs sm:text-sm">
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <span>Upload vertical clips up to 60 seconds (MP4, WebM, MOV)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <span>Transparent Creator Studio with views, ratings & status</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <span>Connect with other creators and build pet friendships</span>
                </li>
              </ul>

              <div className="mt-8 pt-4 border-t border-border/60">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 text-xs font-bold text-amber-500 hover:underline"
                >
                  <span>Create Free Creator Account</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: HOW IT WORKS
          ========================================================================= */}
      <section
        aria-labelledby="how-it-works-heading"
        className="relative border-y border-border/60 bg-muted/20 py-16 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              <Sliders className="h-3.5 w-3.5" />
              <span>Step-by-Step Experience</span>
            </div>
            <h2
              id="how-it-works-heading"
              className="text-h1 font-black tracking-tight text-foreground"
            >
              How Woofskis Works
            </h2>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Simple, transparent, and joyful. Here is how our live contest system brings dogs and
              voters together.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Step 1 */}
            <div className="relative rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-black text-white">
                1
              </div>
              <h3 className="mt-4 text-base font-bold text-foreground">
                Watch One Dog Video at a Time
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Our vertical video player queues candidate contest entries one by one. You get to
                give each dog your undivided attention and appreciate their talent.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-black text-white">
                2
              </div>
              <h3 className="mt-4 text-base font-bold text-foreground">
                Rate on a 1–10 Scale
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Cast your score on the interactive rating bar or simply press keys 1–9 and 0 (for 10) on your keyboard.
                Every score is immediately factored into the live consensus.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-black text-white">
                3
              </div>
              <h3 className="mt-4 text-base font-bold text-foreground">
                Live Consensus Reveal
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Watch the score reveal overlay display the video&apos;s previous average, the score delta
                from your rating, and the newly calculated running community score.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-black text-white">
                4
              </div>
              <h3 className="mt-4 text-base font-bold text-foreground">
                Rankings & Creator Progress
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Entries climb the official leaderboard in real time. Creators track their views,
                votes, and contest performance in Creator Studio.
              </p>
            </div>
          </div>

          {/* Interactive Rating Demo Banner */}
          <div className="mt-10 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center sm:p-8">
            <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
              The Woofskis Rating Bar (1 to 10 Scale)
            </h4>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <div
                  key={num}
                  className="group flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl border border-amber-500/30 bg-card shadow-xs transition-transform hover:scale-110"
                >
                  <span className="font-mono text-xs sm:text-sm font-bold text-amber-500">{num}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Hotkeys enabled: Press <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] font-bold">1</kbd> to <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] font-bold">10</kbd> on your keyboard during playback to rate instantly!
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: WHY YOUR RATING MATTERS
          ========================================================================= */}
      <section
        aria-labelledby="why-rating-matters-heading"
        className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
      >
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="space-y-6 lg:col-span-6">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <Scale className="h-3.5 w-3.5" />
              <span>Integrity & Fairness</span>
            </div>

            <h2
              id="why-rating-matters-heading"
              className="text-h1 font-black tracking-tight text-foreground"
            >
              Why Your Rating Matters.
            </h2>

            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              On Woofskis, every single rating is meaningful. We don&apos;t use secret engagement algorithms
              that bury smaller creators. Instead, our scoring system treats every viewer&apos;s vote as a
              vital input into the live mathematical average.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    Mathematical Consensus Calculation
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Your rating is combined with previous votes using a transparent running average.
                    The new score reflects the true consensus of the whole pack.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    HMAC Anti-Fraud Protection
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Votes are secured using cryptographic IP hashing. A viewer can update their score,
                    but cannot spam votes to unfairly inflate numbers or bias the contest.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Trophy className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    Equal Rotation in the Live Queue
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Approved entries rotate fairly to active judges, ensuring every pup gets fair
                    exposure regardless of follower count.
                  </p>
                </div>
              </div>
            </div>

            {/* Honest Disclaimer Box */}
            <div className="rounded-xl border border-border/80 bg-muted/40 p-4 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">Fair Play Commitment:</p>
              <p className="mt-1">
                Ratings directly determine leaderboard rankings and contest standings through our
                verified scoring formula. An individual rating contributes fairly to the score, but
                no single vote can guarantee a win or override the community consensus.
              </p>
            </div>
          </div>

          {/* Consensus Math Callout Card */}
          <div className="lg:col-span-6">
            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xl sm:p-8">
              <h3 className="text-base font-bold text-foreground">
                How Community Scoring Works
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                The exact formula that powers the Woofskis Score Reveal engine:
              </p>

              <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 font-mono text-xs text-primary">
                NewScore = round((PreviousScore × Votes + Rating) / (Votes + 1), 1)
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3 text-xs">
                  <span className="font-medium text-muted-foreground">Rating Scale</span>
                  <span className="font-bold text-foreground">1 to 10 Scale</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3 text-xs">
                  <span className="font-medium text-muted-foreground">Auto-Advance Reveal</span>
                  <span className="font-bold text-foreground">1.8-second countdown</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3 text-xs">
                  <span className="font-medium text-muted-foreground">Leaderboard Metric</span>
                  <span className="font-bold text-foreground">Score & Total Verified Votes</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Button asChild variant="outline" className="w-full rounded-xl text-xs font-bold">
                  <Link href="/leaderboard">
                    <span>Inspect Current Standings</span>
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: BECOME A CREATOR
          ========================================================================= */}
      <section
        aria-labelledby="become-creator-heading"
        className="relative border-t border-border/60 bg-muted/10 py-16 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
            {/* Visual Card Left */}
            <div className="order-2 lg:order-1 lg:col-span-5">
              <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-2xl sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Video className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Creator Studio</h4>
                    <p className="text-[11px] text-muted-foreground">Woofskis Creator Dashboard</p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="rounded-2xl border border-border/60 bg-muted/30 p-3.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Video Duration</span>
                      <span className="font-bold text-foreground">Up to 60 seconds</span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/30 p-3.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Supported Formats</span>
                      <span className="font-bold text-foreground">MP4, WebM, MOV (&le;100MB)</span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/30 p-3.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Review Workflow</span>
                      <span className="inline-flex items-center gap-1 font-bold text-amber-500">
                        <CheckCircle2 className="h-3 w-3" />
                        Human Moderation
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-primary/10 p-4 text-center">
                  <p className="text-xs font-semibold text-primary">
                    Ready to show off your dog?
                  </p>
                  <Button
                    asChild
                    className="mt-3 w-full rounded-xl bg-primary text-xs font-bold text-white hover:bg-primary-hover"
                  >
                    <Link href="/register">
                      <span>Get Started as a Creator</span>
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Creator Copy Right */}
            <div className="order-1 space-y-6 lg:order-2 lg:col-span-7">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                <UploadCloud className="h-3.5 w-3.5" />
                <span>Creator Opportunities</span>
              </div>

              <h2
                id="become-creator-heading"
                className="text-h1 font-black tracking-tight text-foreground"
              >
                Share Your Dog&apos;s Magic with the World.
              </h2>

              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                Whether your dog does world-class agility or has the funniest reaction to a squeaky
                toy, Woofskis is your dog&apos;s digital runway. Here is what you get when you become a
                Woofskis creator:
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
                <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
                  <h4 className="text-sm font-bold text-foreground">Community Recognition</h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Get genuine feedback from fellow dog lovers who appreciate your dog&apos;s unique spirit.
                  </p>
                </div>

                <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
                  <h4 className="text-sm font-bold text-foreground">Dedicated Creator Studio</h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Track submission approvals, views, votes, and average rating metrics in real time.
                  </p>
                </div>

                <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
                  <h4 className="text-sm font-bold text-foreground">Connect with Other Pet Owners</h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Send friend requests, discover fellow creators, and celebrate milestones together.
                  </p>
                </div>

                <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
                  <h4 className="text-sm font-bold text-foreground">Safe & Moderated</h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Every submission is reviewed to ensure a safe, wholesome, and pet-friendly community.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs text-muted-foreground">
                  *Note: Woofskis focuses on honest celebration, community recognition, and friendly
                  competition. We do not make speculative financial promises or unverified prize claims.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: OUR MISSION FOR DOG LOVERS
          ========================================================================= */}
      <section
        aria-labelledby="our-mission-heading"
        className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
      >
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="space-y-6 lg:col-span-7">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-500">
              <Heart className="h-3.5 w-3.5" />
              <span>Our Purpose</span>
            </div>

            <h2
              id="our-mission-heading"
              className="text-h1 font-black tracking-tight text-foreground"
            >
              Built by Dog Lovers, for Dog Lovers.
            </h2>

            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Dogs give us unconditional loyalty, endless laughter, and a warmth that brightens even
              the hardest days. Yet on modern social platforms, dog clips are often buried under noise,
              arguments, and algorithmic clutter.
            </p>

            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              We built Woofskis to be a sanctuary of pure dog appreciation. Whether a dog is a purebred
              champion, an adventurous rescue, a playful pup, or a dignified senior with a graying
              muzzle—every dog deserves to be celebrated.
            </p>

            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5">
              <p className="italic text-xs leading-relaxed text-foreground sm:text-sm">
                &ldquo;Our mission is to bring dog lovers together in an uplifting, positive space where
                every wag, bark, and zoom is cherished.&rdquo;
              </p>
              <p className="mt-2 text-xs font-bold text-rose-500">— The Woofskis Team</p>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:col-span-5 lg:max-w-none">
            <div className="overflow-hidden rounded-3xl border-2 border-rose-500/20 bg-card p-3 shadow-2xl">
              <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/woofskis_mission_dog.jpg"
                  alt="A happy dog receiving affection"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  width={600}
                  height={450}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: FINAL CALL TO ACTION
          ========================================================================= */}
      <section
        aria-labelledby="final-cta-heading"
        className="relative mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-28 lg:px-8"
      >
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-card via-card/95 to-primary/10 p-8 text-center shadow-2xl sm:p-14">
          {/* Subtle decorative glow */}
          <div
            className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full opacity-20 blur-3xl"
            style={{ backgroundColor: activeBrand?.colors.primary || '#fa4616' }}
          />

          <div className="relative mx-auto max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Join the Pack</span>
            </div>

            <h2
              id="final-cta-heading"
              className="text-h1 font-black tracking-tight text-foreground"
            >
              Ready to Discover Extraordinary Dogs?
            </h2>

            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Dive into live judging right now, explore today&apos;s top-ranked pups on the leaderboard,
              or create your free creator account to enter your dog.
            </p>

            <div className="flex flex-col items-center justify-center gap-3 pt-6 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 w-full gap-2 rounded-xl bg-primary px-8 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary-hover sm:w-auto"
              >
                <Link href="/" id="final-cta-watch">
                  <Play className="h-4 w-4 fill-current" />
                  <span>Start Watching & Rating</span>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 w-full gap-2 rounded-xl border-2 border-border/80 bg-background/80 px-8 text-sm font-bold text-foreground hover:border-primary sm:w-auto"
              >
                <Link href="/register" id="final-cta-register">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>Join as a Creator</span>
                </Link>
              </Button>

              <Button
                asChild
                variant="ghost"
                size="lg"
                className="h-12 w-full gap-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground sm:w-auto"
              >
                <Link href="/leaderboard" id="final-cta-leaderboard">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  <span>View Leaderboard</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
