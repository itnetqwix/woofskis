'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldX, AlertOctagon, Mail, RefreshCw } from 'lucide-react';
import { TenantBrandConfig } from '@/types/tenant';
import { Button } from '@/components/ui/button';
import { useTenantTheme } from '@/features/admin/hooks/use-tenant-theme';

interface TenantSuspensionOverlayProps {
  brand: TenantBrandConfig;
}

export function TenantSuspensionOverlay({ brand }: TenantSuspensionOverlayProps) {
  const { switchTenant, brands } = useTenantTheme();

  // Helper to switch to another active brand for testing
  const alternativeActiveBrand = brands.find((b) => b.id !== brand.id && b.status !== 'SUSPENDED');

  const handleQuickSwitchToActive = () => {
    if (alternativeActiveBrand) {
      switchTenant(alternativeActiveBrand.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex min-h-screen w-full items-center justify-center bg-background/95 p-4 antialiased backdrop-blur-2xl sm:p-6">
      {/* GLOWING AMBIENT RADIALS */}
      <div className="pointer-events-none absolute left-1/2 top-1/4 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500/15 blur-3xl" />

      <div className="relative z-10 w-full max-w-xl space-y-6 rounded-3xl border border-rose-500/40 bg-card/90 p-6 text-center shadow-2xl backdrop-blur-2xl duration-200 animate-in fade-in zoom-in-95 sm:p-10">
        {/* BRAND IDENTITY BADGE */}
        <div className="flex items-center justify-center gap-2.5">
          <div
            className="h-8 w-8 shrink-0 overflow-hidden rounded-xl border border-white/20 shadow-md grayscale"
            style={{ backgroundColor: brand.colors.primary }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={brand.logoUrl || '/logo/woofskis_logo.png'}
              alt={brand.name}
              className="h-full w-full object-contain p-0.5"
            />
          </div>
          <span className="text-sm font-bold text-foreground">{brand.name}</span>
        </div>

        {/* SUSPENSION ICON */}
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-rose-500/30 bg-rose-500/15 text-rose-400 shadow-xl shadow-rose-500/20">
          <ShieldX className="h-10 w-10 animate-pulse" />
          <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-xs font-black text-white">
            !
          </span>
        </div>

        {/* HERO TITLE & EXPLANATION */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/15 px-3 py-1 font-mono text-xs font-bold text-rose-400">
            <AlertOctagon className="h-3.5 w-3.5" />
            <span>ACCOUNT TEMPORARILY SUSPENDED</span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Compliance Review in Progress
          </h1>

          <p className="mx-auto max-w-md text-xs leading-relaxed text-muted-foreground sm:text-sm">
            Your brand administrator console and live contest circuits have been temporarily locked
            by COS Platform Trust & Safety due to compliance or terms enforcement.
          </p>
        </div>

        {/* SUSPENSION DETAILS CARD */}
        <div className="space-y-2 rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4 text-left font-mono text-xs">
          <div className="flex items-center justify-between border-b border-rose-500/20 pb-2 text-muted-foreground">
            <span>Status:</span>
            <span className="font-bold uppercase text-rose-400">SUSPENDED (READ-ONLY LOCK)</span>
          </div>

          <div className="space-y-1">
            <span className="block text-[11px] text-muted-foreground">Enforcement Rationale:</span>
            <p className="font-sans text-xs text-foreground">
              {brand.suspensionReason ||
                'Unresolved compliance violation notice or pending legal copyright / regulatory audit.'}
            </p>
          </div>

          {brand.suspendedAt && (
            <div className="flex items-center justify-between border-t border-rose-500/20 pt-1 text-[10px] text-muted-foreground">
              <span>Timestamp:</span>
              <span>{new Date(brand.suspendedAt).toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* CONTACT COMPLIANCE INFO */}
        <div className="flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-muted/40 p-3 text-xs text-muted-foreground">
          <Mail className="h-4 w-4 shrink-0 text-primary" />
          <span>To appeal, contact platform governance: </span>
          <a
            href="mailto:compliance@contestos.com"
            className="font-mono font-bold text-primary hover:underline"
          >
            compliance@contestos.com
          </a>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
          {alternativeActiveBrand && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleQuickSwitchToActive}
              className="w-full gap-1.5 text-xs sm:w-auto"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Switch to {alternativeActiveBrand.name}</span>
            </Button>
          )}

          <Button
            asChild
            variant="secondary"
            size="sm"
            className="w-full gap-1.5 text-xs font-bold sm:w-auto"
          >
            <Link href="/">
              <span>Return to Viewer</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
