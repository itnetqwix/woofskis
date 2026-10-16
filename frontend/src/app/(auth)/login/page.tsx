'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { LoginForm } from '@/features/auth/components/login-form';
import { useTenantTheme } from '@/features/admin/hooks/use-tenant-theme';
import { ThemeToggle } from '@/components/common/theme-toggle';

function LoginContent() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || undefined;
  const { activeBrand } = useTenantTheme();

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-x-hidden bg-background p-4">
      {/* Dynamic Ambient Background Glow */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[600px] -translate-x-1/2 rounded-full opacity-20 blur-3xl transition-all duration-700"
        style={{ backgroundColor: activeBrand?.colors.primary || '#fa4616' }}
      />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

      {/* Top Bar Header */}
      <header className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between p-4 sm:p-6">
        <Link
          href="/"
          className="group flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Live Showcase</span>
        </Link>

        <div className="flex items-center gap-3">
          {/* Active Tenant Badge */}
          <div className="hidden items-center gap-1.5 rounded-full border border-border/60 bg-card/80 px-2.5 py-1 font-mono text-[11px] text-muted-foreground sm:flex">
            <span
              className="shadow-xs h-2 w-2 rounded-full"
              style={{ backgroundColor: activeBrand?.colors.primary || '#fa4616' }}
            />
            <span className="font-semibold text-foreground">{activeBrand?.name || 'Woofskis'}</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Auth Card Container */}
      <div className="z-10 w-full max-w-lg py-12">
        <div className="rounded-2xl border border-border/80 bg-card/90 p-6 shadow-2xl backdrop-blur-xl transition-all sm:p-8">
          {/* Brand Logo & Title */}
          <div className="mb-6 space-y-2 text-center">
            <div className="inline-flex items-center justify-center">
              <div
                className="h-12 w-12 overflow-hidden rounded-2xl p-0.5 shadow-lg shadow-primary/20"
                style={{ backgroundColor: activeBrand?.colors.primary || '#fa4616' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeBrand?.logoUrl || '/logo/woofskis_logo_with_dog_transparent.png'}
                  alt={activeBrand?.name || 'COS Brand'}
                  className="h-full w-full rounded-[14px] object-contain p-0.5"
                />
              </div>
            </div>

            <div className="space-y-0.5">
              <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
                Sign in to <span className="text-primary">{activeBrand?.name || 'Woofskis'}</span>{' '}
                COS
              </h1>
              <p className="mx-auto max-w-sm text-xs text-muted-foreground">
                {activeBrand?.tagline || 'Sign in as the deployment admin, or as a creator.'}
              </p>
            </div>
          </div>

          {/* Login Form */}
          <LoginForm redirectUrl={redirectUrl} />
        </div>

        {/* Footer info */}
        <div className="mt-6 space-y-1 text-center text-[11px] text-muted-foreground">
          <p>Contest Operating System MVP (v1.0) • Multi-Role Access Control</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/terms" className="hover:underline">
              Terms & Authenticity
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:underline">
              Privacy Protocol
            </Link>
            <span>•</span>
            <Link href="/admin/contests" className="text-primary hover:underline">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="relative flex min-h-screen w-full items-center justify-center bg-background p-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
