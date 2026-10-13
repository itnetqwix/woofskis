'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CreatorRegisterForm } from '@/features/auth/components/creator-register-form';
import { useTenantTheme } from '@/features/admin/hooks/use-tenant-theme';
import { ThemeToggle } from '@/components/common/theme-toggle';

function RegisterContent() {
  const { activeBrand } = useTenantTheme();

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-x-hidden bg-background p-4">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[600px] -translate-x-1/2 rounded-full opacity-20 blur-3xl transition-all duration-700"
        style={{ backgroundColor: activeBrand?.colors.primary || '#fa4616' }}
      />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

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
        <div className="rounded-2xl border border-border/80 bg-card/90 p-6 shadow-2xl backdrop-blur-xl transition-all sm:p-8">
          <div className="mb-6 space-y-2 text-center">
            <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
              Creator signup
            </h1>
            <p className="mx-auto max-w-md text-xs text-muted-foreground">
              Create a creator account for this deployment. You will see its active contests after
              signup. Administrators are already provisioned and sign in from the login page.
            </p>
          </div>
          <CreatorRegisterForm />
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="relative flex min-h-screen w-full items-center justify-center bg-background p-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
