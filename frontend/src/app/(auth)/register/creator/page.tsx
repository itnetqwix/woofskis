'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CreatorRegisterForm } from '@/features/auth/components/creator-register-form';
import { useTenantTheme } from '@/features/admin/hooks/use-tenant-theme';
import { ThemeToggle } from '@/components/common/theme-toggle';

export default function RegisterCreatorPage() {
  const { activeBrand } = useTenantTheme();

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-x-hidden bg-background p-4">
      {/* Glow */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[600px] -translate-x-1/2 rounded-full opacity-20 blur-3xl transition-all duration-700"
        style={{ backgroundColor: activeBrand?.colors.primary || '#13491e' }}
      />

      <header className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between p-4 sm:p-6">
        <Link
          href="/"
          className="group flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Live Showcase</span>
        </Link>
        <ThemeToggle />
      </header>

      <div className="z-10 w-full max-w-xl py-12">
        <div className="rounded-2xl border border-border/80 bg-card/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="mb-6 space-y-2 text-center">
            <div className="inline-flex items-center justify-center">
              <div
                className="h-12 w-12 overflow-hidden rounded-2xl p-0.5 shadow-lg shadow-primary/20"
                style={{ backgroundColor: activeBrand?.colors.primary || '#13491e' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeBrand?.logoUrl || '/logo/woofskis_logo.png'}
                  alt={activeBrand?.name || 'COS Brand'}
                  className="h-full w-full rounded-[14px] object-contain p-0.5"
                />
              </div>
            </div>

            <div className="space-y-0.5">
              <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
                Creator Registration
              </h1>
              <p className="mx-auto max-w-md text-xs text-muted-foreground">
                Join{' '}
                <span className="font-bold text-primary">{activeBrand?.name || 'Woofskis'}</span> to
                submit vertical videos, climb leaderboards, and win tournament cash prizes.
              </p>
            </div>
          </div>

          <CreatorRegisterForm />
        </div>
      </div>
    </div>
  );
}
