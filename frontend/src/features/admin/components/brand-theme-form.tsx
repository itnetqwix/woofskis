'use client';

import React, { useState, useEffect } from 'react';
import {
  Palette,
  Globe,
  Sparkles,
  Check,
  Code,
  Flame,
  Trophy,
  CheckCircle2,
  Info,
  Copy,
} from 'lucide-react';
import { useTenantTheme } from '@/features/admin/hooks/use-tenant-theme';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { buildOrganizationBrandingPayload } from '@/features/admin/lib/organization-branding';
import { AppApiError } from '@/lib/axios';
import { updateOrganizationBranding } from '@/services/organizations-api';
import { BackgroundStylePreset } from '@/types/tenant';
import { hexToHslTriplet, calculateContrastRatio, getContrastForeground } from '@/lib/theme-utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const COLOR_PRESETS = [
  {
    name: 'Woofskis (Official)',
    primary: '#fa4616',
    accent: '#3e2717',
    bg: 'clean-light' as BackgroundStylePreset,
  },
  {
    name: 'Woofskis Aqua',
    primary: '#06b6d4',
    accent: '#10b981',
    bg: 'oceanic' as BackgroundStylePreset,
  },
  {
    name: 'TalentSkis Violet',
    primary: '#8b5cf6',
    accent: '#ec4899',
    bg: 'cyber-black' as BackgroundStylePreset,
  },
  {
    name: 'GameSkis Crimson',
    primary: '#ef4444',
    accent: '#eab308',
    bg: 'cyber-black' as BackgroundStylePreset,
  },
  {
    name: 'Emerald Spark',
    primary: '#10b981',
    accent: '#84cc16',
    bg: 'midnight' as BackgroundStylePreset,
  },
  {
    name: 'Solar Gold',
    primary: '#eab308',
    accent: '#f97316',
    bg: 'midnight' as BackgroundStylePreset,
  },
];

const LOGO_PRESETS = [
  {
    label: 'Woofskis (Official)',
    url: '/logo/woofskis_logo.png',
  },
  {
    label: 'Canine (Woofskis)',
    url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&auto=format&fit=crop&q=80',
  },
  {
    label: 'Stage (TalentSkis)',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&auto=format&fit=crop&q=80',
  },
  {
    label: 'Neon (GameSkis)',
    url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=150&auto=format&fit=crop&q=80',
  },
];

export function BrandThemeForm() {
  const { user, role } = useAuthSession();
  const isPlatformAdmin = role === 'PLATFORM_ADMIN' || role === 'superadmin';

  const { brands, activeBrand, updateBrand, refreshBranding } = useTenantTheme();

  const currentBrand = activeBrand || brands[0];

  // Local form editing state
  const [name, setName] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [tagline, setTagline] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [primaryColor, setPrimaryColor] = useState<string>('#fa4616');
  const [accentColor, setAccentColor] = useState<string>('#3e2717');
  const [backgroundStyle, setBackgroundStyle] = useState<BackgroundStylePreset>('clean-light');

  // Preview interactive mock state
  const [mockRating, setMockRating] = useState<number>(4.8);
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Sync state when current brand changes
  useEffect(() => {
    if (currentBrand) {
      setName(currentBrand.name || '');
      setLogoUrl(currentBrand.logoUrl || '');
      setTagline(currentBrand.tagline || '');
      setDescription(currentBrand.description || '');
      setPrimaryColor(currentBrand.colors?.primary || '#fa4616');
      setAccentColor(currentBrand.colors?.accent || '#3e2717');
      setBackgroundStyle(currentBrand.colors?.backgroundStyle || 'clean-light');
    }
  }, [currentBrand]);

  useEffect(() => {
    if (!currentBrand?.slug) return;
    void refreshBranding(currentBrand.slug).catch(() => undefined);
  }, [currentBrand?.slug, refreshBranding]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Real-time dynamic preview injection while editing
  const handlePrimaryChange = (hex: string) => {
    setPrimaryColor(hex);
    if (currentBrand.id === activeBrand.id) {
      document.documentElement.style.setProperty('--primary', hexToHslTriplet(hex));
      document.documentElement.style.setProperty(
        '--primary-foreground',
        getContrastForeground(hex)
      );
      document.documentElement.style.setProperty('--ring', hexToHslTriplet(hex));
    }
  };

  const handleAccentChange = (hex: string) => {
    setAccentColor(hex);
    if (currentBrand.id === activeBrand.id) {
      document.documentElement.style.setProperty('--accent', hexToHslTriplet(hex));
      document.documentElement.style.setProperty('--accent-foreground', getContrastForeground(hex));
    }
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    let organizationId = currentBrand.organizationId ?? null;
    if (!organizationId && !isPlatformAdmin && user?.organizationId) {
      organizationId = user.organizationId;
    }
    if (!organizationId && currentBrand.slug) {
      const loaded = await refreshBranding(currentBrand.slug).catch(() => null);
      organizationId = loaded?.organizationId ?? null;
    }
    if (!organizationId) {
      showToast('Organization id is not available from the branding API for this deployment.');
      return;
    }

    const body = buildOrganizationBrandingPayload({
      primaryColor,
      logoUrl,
      accentColor,
      tagline,
    });

    setIsSaving(true);
    try {
      const envelope = await updateOrganizationBranding(organizationId, body);
      if (!envelope.success || envelope.data == null) {
        showToast(envelope.message || 'Could not save organization branding');
        return;
      }

      const saved = envelope.data;
      updateBrand(currentBrand.id, {
        organizationId: saved.id,
        name: name || saved.name,
        slug: saved.slug,
        logoUrl: body.logoUrl,
        tagline: body.tagline ?? tagline,
        description,
        colors: {
          primary: body.primaryColor,
          primaryHsl: hexToHslTriplet(body.primaryColor),
          primaryForeground: getContrastForeground(body.primaryColor),
          accent: body.accentColor ?? accentColor,
          accentHsl: hexToHslTriplet(body.accentColor ?? accentColor),
          accentForeground: getContrastForeground(body.accentColor ?? accentColor),
          backgroundStyle,
        },
      });
      showToast(`Brand "${name || saved.name}" theme saved.`);
    } catch (error) {
      const message =
        error instanceof AppApiError ? error.message : 'Could not save organization branding';
      showToast(message);
    } finally {
      setIsSaving(false);
    }
  };

  // WCAG Contrast calculation
  const contrastRatio = calculateContrastRatio(primaryColor, '#ffffff');
  const isAccessible = contrastRatio >= 4.5;

  // Export snippet code
  const cssVariablesSnippet = `:root {
  --primary: ${hexToHslTriplet(primaryColor)};
  --primary-foreground: ${getContrastForeground(primaryColor)};
  --accent: ${hexToHslTriplet(accentColor)};
  --accent-foreground: ${getContrastForeground(accentColor)};
  --ring: ${hexToHslTriplet(primaryColor)};
  /* Theme Style: ${backgroundStyle} */
  /* Brand: ${name || currentBrand.name} */
}`;

  return (
    <div className="space-y-6">
      {/* TOAST FEEDBACK NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl border border-border bg-card/95 px-4 py-3 text-xs font-semibold text-foreground shadow-2xl backdrop-blur-md duration-200 animate-in fade-in slide-in-from-bottom-4">
          <Sparkles className="h-4 w-4 animate-pulse text-primary" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* BRAND IDENTITY TOP BAR */}
      <div className="shadow-xs flex flex-col justify-between gap-3 rounded-2xl border border-border/80 bg-card p-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="shadow-xs flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-0.5" />
            ) : (
              <span
                className="h-3.5 w-3.5 rounded-full"
                style={{ backgroundColor: primaryColor }}
              />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">{name || currentBrand.name}</span>
              <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">
                DEPLOYMENT BRAND
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => setExportModalOpen(true)}
            className="h-8 gap-1.5 text-xs font-semibold"
          >
            <Code className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Export Theme</span>
          </Button>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE: LEFT FORM + RIGHT LIVE PREVIEW */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN: BRAND METADATA & THEME CUSTOMIZER (7 Cols) */}
        <form onSubmit={handleSaveBrand} className="space-y-6 lg:col-span-7">
          {/* SECTION 1: IDENTITY & PROFILE */}
          <div className="shadow-xs space-y-4 rounded-2xl border border-border/80 bg-card p-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Brand Identity & Profile</h3>
              </div>
              <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                {currentBrand.organizationId
                  ? `ORG: ${currentBrand.organizationId.slice(0, 8)}...`
                  : 'ACTIVE'}
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Organization / Brand Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Woofskis"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Logo Configuration */}
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-bold text-foreground">
                  Brand Logo Asset URL
                </label>
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                  <div className="shadow-xs flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoUrl}
                      alt="Logo preview"
                      className="h-full w-full object-contain p-1"
                    />
                  </div>

                  <div className="w-full flex-1 space-y-1.5">
                    <input
                      type="url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    {/* Presets */}
                    <div className="flex items-center gap-1.5 overflow-x-auto">
                      <span className="shrink-0 text-[10px] text-muted-foreground">Presets:</span>
                      {LOGO_PRESETS.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setLogoUrl(p.url)}
                          className="shrink-0 rounded bg-muted/60 px-2 py-0.5 text-[10px] font-semibold text-foreground transition-colors hover:bg-muted"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tagline & Description */}
              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Tagline</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. High-Octane Comedy & Short Entertainment Showdowns"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Community Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your brand and contest ecosystem..."
                    className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: DYNAMIC CSS VARIABLE THEME CUSTOMIZER */}
          <div className="shadow-xs space-y-5 rounded-2xl border border-border/80 bg-card p-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  Dynamic CSS Variable Theme Engine
                </h3>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">
                Runtime Token Injection
              </span>
            </div>

            {/* Color Theme Presets */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Quick Palette Presets
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {COLOR_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      handlePrimaryChange(p.primary);
                      handleAccentChange(p.accent);
                      setBackgroundStyle(p.bg);
                    }}
                    className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/20 p-2 text-left text-xs transition-all hover:border-primary/50 hover:bg-muted/60"
                  >
                    <div className="flex shrink-0 -space-x-1">
                      <span
                        className="shadow-xs h-3.5 w-3.5 rounded-full border border-white/20"
                        style={{ backgroundColor: p.primary }}
                      />
                      <span
                        className="shadow-xs h-3.5 w-3.5 rounded-full border border-white/20"
                        style={{ backgroundColor: p.accent }}
                      />
                    </div>
                    <span className="truncate text-[11px] font-semibold text-foreground">
                      {p.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Primary & Accent Color Pickers */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Primary Color Picker */}
              <div className="space-y-2 rounded-xl border border-border/80 bg-background/60 p-3.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <span>Primary Color</span>
                    <span className="font-mono text-[10px] text-muted-foreground">(--primary)</span>
                  </label>
                  <span
                    className="shadow-xs h-4 w-4 rounded-full border border-white/30"
                    style={{ backgroundColor: primaryColor }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => handlePrimaryChange(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => handlePrimaryChange(e.target.value)}
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-1.5 font-mono text-xs uppercase text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="font-mono text-[10px] text-muted-foreground">
                  HSL: {hexToHslTriplet(primaryColor)}
                </div>
              </div>

              {/* Accent Color Picker */}
              <div className="space-y-2 rounded-xl border border-border/80 bg-background/60 p-3.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <span>Accent Color</span>
                    <span className="font-mono text-[10px] text-muted-foreground">(--accent)</span>
                  </label>
                  <span
                    className="shadow-xs h-4 w-4 rounded-full border border-white/30"
                    style={{ backgroundColor: accentColor }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => handleAccentChange(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => handleAccentChange(e.target.value)}
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-1.5 font-mono text-xs uppercase text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="font-mono text-[10px] text-muted-foreground">
                  HSL: {hexToHslTriplet(accentColor)}
                </div>
              </div>
            </div>

            {/* Background Style Preset Selector */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Platform Background Style
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { id: 'midnight', label: 'Clean Midnight', desc: 'Dark Navy Tone' },
                  { id: 'cyber-black', label: 'Cyber Black', desc: 'OLED Pure Dark' },
                  { id: 'oceanic', label: 'Oceanic Abyss', desc: 'Deep Aqua Dark' },
                  { id: 'deep-slate', label: 'Deep Slate', desc: 'Charcoal Grey' },
                ].map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => setBackgroundStyle(bg.id as BackgroundStylePreset)}
                    className={cn(
                      'rounded-xl border p-2.5 text-left transition-all',
                      backgroundStyle === bg.id
                        ? 'border-primary bg-primary/10 ring-1 ring-primary/40'
                        : 'border-border/60 bg-muted/20 hover:border-border hover:bg-muted/50'
                    )}
                  >
                    <span className="block text-xs font-bold text-foreground">{bg.label}</span>
                    <span className="text-[10px] text-muted-foreground">{bg.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* WCAG Accessibility Rating Bar */}
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-3 text-xs">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                <div>
                  <span className="font-bold text-foreground">WCAG Contrast Readability:</span>
                  <span className="ml-1.5 font-mono text-muted-foreground">
                    {contrastRatio}:1 vs White
                  </span>
                </div>
              </div>

              {isAccessible ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                  <CheckCircle2 className="h-3 w-3" /> PASS AA (4.5+)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-500">
                  LOW CONTRAST
                </span>
              )}
            </div>
          </div>

          {/* FORM SUBMISSION */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <Button
              type="submit"
              disabled={isSaving}
              className="gap-2 bg-primary text-xs font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary-hover"
            >
              <Check className="h-4 w-4" />
              <span>{isSaving ? 'Saving…' : 'Save Brand Configuration'}</span>
            </Button>
          </div>
        </form>

        {/* RIGHT COLUMN: REAL-TIME INTERACTIVE COMPONENT PREVIEW (5 Cols) */}
        <div className="space-y-4 lg:col-span-5">
          <div className="sticky top-20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Real-Time Live Component Preview
                </h3>
              </div>
              <span className="flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-500" />
                REACTING LIVE
              </span>
            </div>

            {/* PREVIEW CONTAINER WITH INLINE STYLES MATCHING SELECTED COLORS */}
            <div
              className="space-y-5 rounded-2xl border border-border/80 bg-card p-5 shadow-xl transition-all"
              style={
                {
                  '--preview-primary': primaryColor,
                  '--preview-accent': accentColor,
                } as React.CSSProperties
              }
            >
              {/* Preview Brand Header */}
              <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl shadow-md"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-0.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-foreground">{name || 'Brand Name'}</h4>
                    <p className="text-[10px] text-muted-foreground">
                      {tagline || 'Brand Identity'}
                    </p>
                  </div>
                </div>

                <span
                  className="shadow-xs rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                  style={{
                    backgroundColor: `${primaryColor}25`,
                    color: primaryColor,
                    borderColor: `${primaryColor}40`,
                    borderWidth: '1px',
                  }}
                >
                  ACTIVE BRAND
                </span>
              </div>

              {/* 1. Live Interactive Buttons */}
              <div className="space-y-2">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Action Buttons & Micro-Interactions
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-white shadow-md transition-transform hover:scale-105 active:scale-95"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                    }}
                  >
                    <Flame className="h-3.5 w-3.5" />
                    <span>Primary Action</span>
                  </button>

                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all hover:bg-muted"
                    style={{
                      borderColor: `${primaryColor}60`,
                      color: primaryColor,
                    }}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Accent Outline</span>
                  </button>
                </div>
              </div>

              {/* 2. Live Badges & Category Chips */}
              <div className="space-y-2">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Badges, Tags & Categories
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                    style={{
                      backgroundColor: `${primaryColor}20`,
                      color: primaryColor,
                    }}
                  >
                    Comedy Shorts
                  </span>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                    style={{
                      backgroundColor: `${accentColor}20`,
                      color: accentColor,
                    }}
                  >
                    VFX Champion
                  </span>
                  <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[10px] font-bold text-foreground">
                    $25,000 USD Pool
                  </span>
                </div>
              </div>

              {/* 3. Live Contest Video Card Mockup */}
              <div className="space-y-3 rounded-xl border border-border/80 bg-muted/30 p-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" style={{ color: accentColor }} />
                    <span className="font-bold text-foreground">Season 01 Active Contest</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold" style={{ color: primaryColor }}>
                    428 Entries
                  </span>
                </div>

                {/* Rating Interactive Slider Mock */}
                <div className="space-y-1.5 rounded-lg border border-border/60 bg-background/80 p-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      Community Consensus Score
                    </span>
                    <span className="font-mono text-xs font-bold" style={{ color: primaryColor }}>
                      ★ {mockRating} / 10
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.1"
                    value={mockRating}
                    onChange={(e) => setMockRating(parseFloat(e.target.value))}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg"
                    style={{
                      accentColor: primaryColor,
                    }}
                  />
                </div>
              </div>

              {/* Dynamic CSS Token Inspector Box */}
              <div className="space-y-1 rounded-xl border border-border bg-muted/40 p-3 font-mono text-[11px]">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>--primary:</span>
                  <span className="font-semibold text-foreground">
                    {hexToHslTriplet(primaryColor)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>--accent:</span>
                  <span className="font-semibold text-foreground">
                    {hexToHslTriplet(accentColor)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>--theme-bg:</span>
                  <span className="uppercase text-foreground">{backgroundStyle}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EXPORT THEME SNIPPET MODAL */}
      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary">
              <Code className="h-5 w-5" />
              <DialogTitle className="text-lg font-bold">
                Export CSS Variables & JSON Theme
              </DialogTitle>
            </div>
            <DialogDescription className="mt-1 text-xs text-muted-foreground">
              Copy CSS variables snippet or JSON config to inject into production stylesheets or
              theme presets.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs">
            <div className="relative overflow-x-auto rounded-xl border border-border bg-muted/50 p-3 font-mono text-[11px]">
              <pre>{cssVariablesSnippet}</pre>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(cssVariablesSnippet);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="absolute right-2 top-2 h-7 gap-1 text-[10px] font-bold"
              >
                {copiedCode ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                <span>{copiedCode ? 'Copied' : 'Copy CSS'}</span>
              </Button>
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" size="sm" onClick={() => setExportModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
