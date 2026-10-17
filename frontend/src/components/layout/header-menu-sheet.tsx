'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useTheme } from 'next-themes';
import {
  ChevronRight,
  LogIn,
  LogOut,
  Moon,
  Sparkles,
  Sun,
  UploadCloud,
  User,
  X,
  type LucideIcon,
} from 'lucide-react';
import { ProfileAvatar } from '@/components/common/profile-avatar';
import { cn } from '@/lib/utils';

export interface HeaderNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  iconClassName?: string;
  active: boolean;
  badge?: number;
}

export interface HeaderNavSection {
  id: string;
  title: string;
  items: HeaderNavItem[];
}

export interface HeaderMenuAccount {
  name?: string;
  username?: string;
  email?: string;
  avatarUrl?: string | null;
  roleLabel: string;
  roleClassName: string;
}

interface HeaderMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
  sections: HeaderNavSection[];
  account?: HeaderMenuAccount | null;
  onOpenProfile?: () => void;
  onSubmitEntry?: () => void;
  onSignOut?: () => void;
}

const AVATAR_FALLBACK =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';

const rowClassName =
  'flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h3
      id={id}
      className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
    >
      {children}
    </h3>
  );
}

function AppearanceSwitch() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';
  const options = [
    { value: 'light', label: 'Light', icon: Sun, selected: mounted && !isDark },
    { value: 'dark', label: 'Dark', icon: Moon, selected: isDark },
  ] as const;

  return (
    <div
      role="radiogroup"
      aria-label="Color theme"
      className="mx-3 grid grid-cols-2 gap-1 rounded-xl border border-border/80 bg-muted/40 p-1"
    >
      {options.map(({ value, label, icon: Icon, selected }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={selected}
          disabled={!mounted}
          onClick={() => setTheme(value)}
          className={cn(
            'flex min-h-[40px] items-center justify-center gap-2 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60',
            selected
              ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Icon className={cn('h-4 w-4', selected && value === 'dark' && 'text-primary')} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

export function HeaderMenuSheet({
  open,
  onOpenChange,
  trigger,
  sections,
  account,
  onOpenProfile,
  onSubmitEntry,
  onSignOut,
}: HeaderMenuSheetProps) {
  const close = () => onOpenChange(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 right-0 z-50 flex w-[88vw] max-w-sm flex-col border-l border-border/80 bg-background text-foreground shadow-2xl duration-200 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:animate-in data-[state=open]:slide-in-from-right"
        >
          <div className="flex h-[4.5rem] shrink-0 items-center justify-between border-b border-border/60 px-4 sm:h-20">
            <DialogPrimitive.Title className="text-sm font-bold tracking-tight">
              Menu
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto overscroll-contain px-2 py-4">
            {/* Account */}
            <section aria-labelledby="menu-account">
              <SectionTitle id="menu-account">Account</SectionTitle>
              {account ? (
                <div className="space-y-1">
                  <div className="mx-1 mb-2 flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/40 p-3">
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                      <ProfileAvatar
                        name={account.name}
                        url={account.avatarUrl}
                        fallbackSrc={AVATAR_FALLBACK}
                        alt={account.name || 'Avatar'}
                        className="h-full w-full text-xs"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-bold">{account.name}</span>
                        <span
                          className={cn(
                            'shrink-0 rounded-full border px-1.5 py-px font-mono text-[9px] font-bold leading-none',
                            account.roleClassName
                          )}
                        >
                          {account.roleLabel}
                        </span>
                      </div>
                      {account.username && (
                        <p className="truncate font-mono text-[11px] text-muted-foreground">
                          {account.username}
                        </p>
                      )}
                      {account.email && (
                        <p className="truncate text-[11px] text-muted-foreground">
                          {account.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {onOpenProfile && (
                    <button
                      type="button"
                      onClick={() => {
                        close();
                        onOpenProfile();
                      }}
                      className={cn(rowClassName, 'text-foreground hover:bg-muted/70')}
                    >
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1">Profile settings</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}

                  {onSignOut && (
                    <button
                      type="button"
                      onClick={() => {
                        close();
                        onSignOut();
                      }}
                      className={cn(
                        rowClassName,
                        'text-destructive hover:bg-destructive/10 focus-visible:ring-destructive'
                      )}
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign out</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 px-1">
                  <Link
                    href="/login"
                    onClick={close}
                    className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border-2 border-primary/80 bg-background text-xs font-semibold transition-colors hover:border-primary hover:bg-muted"
                  >
                    <LogIn className="h-4 w-4 text-primary" />
                    <span>Sign In</span>
                  </Link>
                  <Link
                    href="/register"
                    onClick={close}
                    className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-primary text-xs font-bold text-white transition-colors hover:bg-primary-hover"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Get Started</span>
                  </Link>
                </div>
              )}
            </section>

            {/* Navigation */}
            {sections.map((section) => (
              <nav key={section.id} aria-labelledby={`menu-${section.id}`}>
                <SectionTitle id={`menu-${section.id}`}>{section.title}</SectionTitle>
                <ul className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={close}
                          aria-current={item.active ? 'page' : undefined}
                          className={cn(
                            rowClassName,
                            item.active
                              ? 'bg-muted font-semibold text-foreground'
                              : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                          )}
                        >
                          <Icon className={cn('h-4 w-4', item.iconClassName)} />
                          <span className="flex-1">{item.label}</span>
                          {typeof item.badge === 'number' && item.badge > 0 && (
                            <span className="rounded-full border border-amber-500/30 bg-amber-500/20 px-1.5 font-mono text-[10px] font-bold text-amber-600 dark:text-amber-400">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                {section.id === 'create' && onSubmitEntry && (
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      onSubmitEntry();
                    }}
                    className="mx-1 mt-2 flex min-h-[44px] w-[calc(100%-0.5rem)] items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <UploadCloud className="h-4 w-4" />
                    <span>Submit Entry</span>
                  </button>
                )}
              </nav>
            ))}

            {/* Appearance */}
            <section aria-labelledby="menu-appearance">
              <SectionTitle id="menu-appearance">Appearance</SectionTitle>
              <AppearanceSwitch />
            </section>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
