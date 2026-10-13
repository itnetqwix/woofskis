'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldX, Lock, LogIn, Radio } from 'lucide-react';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { useAppSelector } from '@/store/hooks';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/layout/app-header';
import {
  getProtectedRoutePolicy,
  resolveRoleGuardDecision,
  type ProtectedDashboardRoute,
} from '@/components/auth/role-guard-policy';

interface RoleGuardProps {
  route: ProtectedDashboardRoute;
  unauthorizedMessage?: string;
  children: React.ReactNode;
}

export function RoleGuard({ route, unauthorizedMessage, children }: RoleGuardProps) {
  const router = useRouter();
  const { isClientReady, isLoading } = useAuthSession();
  const reduxAuth = useAppSelector((state) => state.auth);
  const policy = getProtectedRoutePolicy(route);

  const sessionRole = reduxAuth.user?.role;
  const isAuthenticated = Boolean(
    reduxAuth.token &&
    reduxAuth.isAuthenticated &&
    reduxAuth.user &&
    reduxAuth.user.role !== 'GUEST'
  );

  const decision = resolveRoleGuardDecision({
    isClientReady,
    isLoading,
    isAuthenticated,
    sessionRole,
    allowedSessionRoles: policy.allowedSessionRoles,
    unauthenticatedRedirect: policy.unauthenticatedRedirect,
    unauthorizedRedirect: policy.unauthorizedRedirect,
  });

  const redirectTo =
    decision.status === 'unauthenticated' || decision.status === 'unauthorized'
      ? decision.redirectTo
      : undefined;

  useEffect(() => {
    if (redirectTo) {
      router.replace(redirectTo);
    }
  }, [redirectTo, router]);

  if (decision.status === 'loading' || redirectTo) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background text-foreground antialiased">
        <AppHeader />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/60 bg-card/60 p-8 text-center shadow-xl backdrop-blur-md">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
              <Lock className="h-6 w-6 animate-pulse text-primary" />
              <div className="absolute inset-0 animate-spin rounded-2xl border-2 border-primary border-t-transparent" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">Verifying Access Permissions</h3>
              <p className="text-xs text-muted-foreground">
                Checking authentication state & role credentials...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (decision.status === 'unauthorized') {
    const message = unauthorizedMessage || policy.unauthorizedMessage;
    const roleLabel = sessionRole || 'GUEST';

    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background text-foreground antialiased">
        <AppHeader />
        <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-lg space-y-6 rounded-2xl border border-destructive/30 bg-card/90 p-6 text-center shadow-2xl backdrop-blur-xl duration-200 animate-in fade-in zoom-in-95 sm:p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/15 text-destructive shadow-lg shadow-destructive/20">
              <ShieldX className="h-7 w-7" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-destructive/20 bg-destructive/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-destructive">
                <span>403 FORBIDDEN</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                Access Restricted
              </h1>
              <p className="text-xs leading-relaxed text-muted-foreground">{message}</p>
            </div>

            <div className="space-y-1 rounded-xl border border-border bg-muted/40 p-3 text-left font-mono text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Current Identity:</span>
                <span className="font-bold text-foreground">
                  {reduxAuth.user?.displayName || 'Guest User'}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Active Role:</span>
                <span className="font-bold text-destructive">{roleLabel}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Required Roles:</span>
                <span className="font-bold text-emerald-400">
                  {policy.allowedSessionRoles.join(' | ')}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-2 pt-2 sm:flex-row">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full gap-1.5 text-xs sm:w-auto"
              >
                <Link href="/">
                  <Radio className="h-3.5 w-3.5" />
                  <span>Return to Live Judging</span>
                </Link>
              </Button>

              <Button
                asChild
                size="sm"
                className="w-full gap-1.5 bg-primary text-xs font-bold text-white hover:bg-primary-hover sm:w-auto"
              >
                <Link href="/login">
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Switch Account / Sign In</span>
                </Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return <>{children}</>;
}
