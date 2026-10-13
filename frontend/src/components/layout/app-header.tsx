'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Radio,
  Trophy,
  LayoutDashboard,
  Layers,
  Palette,
  ShieldCheck,
  UploadCloud,
  ChevronDown,
  Check,
  LogOut,
  LogIn,
  Sparkles,
  Radar,
  Menu,
  X,
  User,
  Users,
} from 'lucide-react';
import { ProfileAvatar } from '@/components/common/profile-avatar';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { CreatorProfileEditor } from '@/features/auth/components/creator-profile-editor';
import { useTenantTheme } from '@/features/admin/hooks/use-tenant-theme';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types/auth';
import { useQuery } from '@tanstack/react-query';
import { moderationQueueQueryKey } from '@/lib/query-keys';
import { listModerationQueue } from '@/services/moderation-api';

interface AppHeaderProps {
  onOpenUploadModal?: () => void;
  extraControls?: React.ReactNode;
  /** Judging player only: transparent chrome so this bar sits on the video. */
  overlay?: boolean;
}

export function AppHeader({ onOpenUploadModal, extraControls, overlay = false }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { brands, activeBrand, switchTenant } = useTenantTheme();
  const { user, role, isAuthenticated, logout, isClientReady, updateUserProfile } =
    useAuthSession();

  // Mobile navigation drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);

  // Close mobile drawer on route transition
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const isActuallyLoggedIn = isClientReady && isAuthenticated && user && role !== 'GUEST';

  // Role categorization helpers
  const isSuperAdmin = false;
  const isAdmin = role === 'ADMIN' || role === 'ORGANIZATION_ADMIN' || role === 'organizer';
  const isBrandAdmin = isAdmin;
  const isCreator = role === 'CREATOR';
  const isModerator = role === 'MODERATOR' || role === 'judge';
  const isGuest = !isActuallyLoggedIn;
  const canLoadModerationQueue = Boolean(isActuallyLoggedIn && isAdmin);

  const pendingQuery = useQuery({
    queryKey: moderationQueueQueryKey,
    enabled: canLoadModerationQueue,
    queryFn: async () => {
      const envelope = await listModerationQueue();
      if (!envelope.success || !Array.isArray(envelope.data)) return 0;
      return envelope.data.filter((item) => item.status === 'PENDING_REVIEW').length;
    },
  });

  const pendingCount = canLoadModerationQueue ? (pendingQuery.data ?? 0) : 0;

  // Format role badge styling
  const getRoleBadge = (userRole: UserRole) => {
    switch (userRole) {
      case 'CREATOR':
        return {
          label: 'CREATOR',
          className: 'text-primary bg-primary/10 border-primary/20',
        };
      case 'ADMIN':
      case 'ORGANIZATION_ADMIN':
      case 'organizer':
        return {
          label: 'ADMIN',
          className: 'text-primary bg-primary/10 border-primary/30 dark:border-primary/40',
        };
      case 'MODERATOR':
      case 'judge':
        return {
          label: 'MODERATOR',
          className:
            'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        };
      case 'PLATFORM_ADMIN':
      case 'superadmin':
        return {
          label: 'PLATFORM ADMIN',
          className: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
        };
      case 'GUEST':
      default:
        return {
          label: 'GUEST',
          className: 'text-muted-foreground bg-muted border-border',
        };
    }
  };

  const roleBadge = getRoleBadge(role);

  // Quick CTA action handler
  const handleUploadClick = () => {
    if (onOpenUploadModal) {
      onOpenUploadModal();
    } else {
      router.push('/creator?upload=true');
    }
  };

  return (
    <>
      <header
        className={cn(
          'z-40 flex h-[4.5rem] w-full shrink-0 items-center justify-between px-3.5 sm:h-24 sm:px-5 lg:px-7',
          overlay
            ? 'relative border-0 bg-background/80 backdrop-blur-xl'
            : 'sticky top-0 border-b border-border/80 bg-background/95 backdrop-blur-md'
        )}
      >
        {/* Left: Brand Logo & Contextual Role Navigation */}
        <div className="flex min-w-0 shrink-0 items-center gap-3 sm:gap-5 lg:gap-7">
          {/* Brand Presentation */}
          {isSuperAdmin ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="group flex min-w-0 shrink-0 items-center gap-2 rounded-xl py-1 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:gap-2.5"
                  title="Super Admin Cross-Tenant Switcher"
                  aria-label="Super Admin Cross-Tenant Switcher"
                >
                  <div className="flex shrink-0 items-center justify-center p-0.5">
                    <img
                      src={activeBrand?.logoUrl || '/logo/woofskis_logo.png'}
                      alt={activeBrand?.name || 'Woofskis'}
                      className="h-9 w-auto max-w-[160px] object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-105 sm:h-12 sm:max-w-[200px] md:h-14 md:max-w-[240px]"
                      width={220}
                      height={72}
                    />
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                    <span className="hidden rounded-full border border-rose-500/30 bg-rose-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-500 sm:inline-flex sm:text-xs">
                      RADAR
                    </span>
                    <ChevronDown className="hidden h-4 w-4 text-muted-foreground group-hover:text-foreground sm:block" />
                  </div>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="start" className="w-60">
                <DropdownMenuLabel className="flex items-center justify-between text-[10px] font-bold uppercase text-muted-foreground">
                  <span>Cross-Tenant Switcher</span>
                  <span className="font-mono text-rose-500">SUPER ADMIN</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {brands.map((b) => {
                  const isSelected = activeBrand?.id === b.id;
                  return (
                    <DropdownMenuItem
                      key={b.id}
                      onClick={() => switchTenant(b.id)}
                      className="flex cursor-pointer items-center justify-between text-xs font-semibold"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: b.colors.primary }}
                        />
                        <span className="truncate">{b.name}</span>
                      </div>
                      {isSelected && <Check className="ml-1 h-3.5 w-3.5 shrink-0 text-primary" />}
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href="/super-admin"
                    className="flex items-center gap-2 text-xs font-bold text-rose-500"
                  >
                    <Radar className="h-3.5 w-3.5" />
                    <span>Open Platform Radar</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/admin/contests"
                    className="flex items-center gap-2 text-xs font-bold text-primary"
                  >
                    <Palette className="h-3.5 w-3.5" />
                    <span>Configure Brand Themes</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/"
              className="group flex min-w-0 shrink-0 items-center rounded-xl py-0.5 transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Woofskis Home"
            >
              {/* Clean Native Official Logo Asset - Prominent Woofskis Branding */}
              <div className="flex shrink-0 items-center justify-center p-0.5">
                <img
                  src={activeBrand?.logoUrl || '/logo/woofskis_logo.png'}
                  alt="Woofskis Logo"
                  className="h-10 w-auto max-w-[170px] object-contain drop-shadow-md transition-transform duration-200 group-hover:scale-105 sm:h-12 sm:max-w-[210px] md:h-14 md:max-w-[250px] lg:h-16 lg:max-w-[280px]"
                  width={240}
                  height={80}
                />
              </div>
            </Link>
          )}

          {/* Desktop Navigation Tabs - Filtered by Active Role */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main Navigation">
            {/* 1. PLATFORM SUPER ADMIN TABS */}
            {isSuperAdmin && (
              <>
                <Link
                  href="/super-admin"
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                    pathname === '/super-admin'
                      ? 'bg-rose-500/15 font-semibold text-rose-500'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  <Radar
                    className={cn(
                      'h-3.5 w-3.5 text-rose-500',
                      pathname === '/super-admin' && 'animate-spin'
                    )}
                  />
                  <span>Platform Radar</span>
                </Link>

                <Link
                  href="/admin/contests"
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                    pathname.startsWith('/admin/contests')
                      ? 'shadow-xs bg-muted font-semibold text-foreground'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Contests</span>
                </Link>

                <Link
                  href="/admin/moderation"
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                    pathname.startsWith('/admin/moderation')
                      ? 'shadow-xs bg-muted font-semibold text-foreground'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Moderation</span>
                  {pendingCount > 0 && (
                    <span className="py-0.2 rounded-full border border-amber-500/30 bg-amber-500/20 px-1.5 font-mono text-[9px] font-bold text-amber-600 dark:text-amber-400">
                      {pendingCount}
                    </span>
                  )}
                </Link>

                <Link
                  href="/"
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                    pathname === '/'
                      ? 'shadow-xs bg-muted font-semibold text-foreground'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  <Radio className="h-3.5 w-3.5" />
                  <span>Live Judging</span>
                </Link>

                <Link
                  href="/leaderboard"
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                    pathname === '/leaderboard'
                      ? 'shadow-xs bg-muted font-semibold text-foreground'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  <Trophy className="h-3.5 w-3.5 text-amber-500" />
                  <span>Leaderboard</span>
                </Link>
              </>
            )}

            {/* 2. BRAND ADMIN TABS */}
            {isBrandAdmin && !isSuperAdmin && (
              <>
                <Link
                  href="/admin/contests"
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                    pathname.startsWith('/admin/contests')
                      ? 'shadow-xs bg-muted font-semibold text-foreground'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Contests</span>
                </Link>

                <Link
                  href="/admin/creators"
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                    pathname.startsWith('/admin/creators')
                      ? 'shadow-xs bg-muted font-semibold text-foreground'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  <User className="h-3.5 w-3.5" />
                  <span>Creators</span>
                </Link>

                <Link
                  href="/admin/moderation"
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                    pathname.startsWith('/admin/moderation')
                      ? 'shadow-xs bg-muted font-semibold text-foreground'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Moderation</span>
                  {pendingCount > 0 && (
                    <span className="py-0.2 rounded-full border border-amber-500/30 bg-amber-500/20 px-1.5 font-mono text-[9px] font-bold text-amber-600 dark:text-amber-400">
                      {pendingCount}
                    </span>
                  )}
                </Link>

                <Link
                  href="/"
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                    pathname === '/'
                      ? 'shadow-xs bg-muted font-semibold text-foreground'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  <Radio className="h-3.5 w-3.5" />
                  <span>Live Judging</span>
                </Link>

                <Link
                  href="/leaderboard"
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                    pathname === '/leaderboard'
                      ? 'shadow-xs bg-muted font-semibold text-foreground'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  <Trophy className="h-3.5 w-3.5 text-amber-500" />
                  <span>Leaderboard</span>
                </Link>
              </>
            )}

            {/* 3. CREATOR TABS */}
            {isCreator && (
              <>
                <Link
                  href="/"
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                    pathname === '/'
                      ? 'shadow-xs bg-muted font-semibold text-foreground'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  <Radio
                    className={cn('h-3.5 w-3.5', pathname === '/' && 'animate-pulse text-primary')}
                  />
                  <span>Live Judging</span>
                </Link>

                <Link
                  href="/leaderboard"
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                    pathname === '/leaderboard'
                      ? 'shadow-xs bg-muted font-semibold text-foreground'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  <Trophy className="h-3.5 w-3.5 text-amber-500" />
                  <span>Leaderboard</span>
                </Link>

                <Link
                  href="/creator"
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                    pathname === '/creator'
                      ? 'shadow-xs bg-muted font-semibold text-foreground'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
                  <span>Creator Studio</span>
                </Link>
                <Link
                  href="/creator/friends"
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                    pathname.startsWith('/creator/friends')
                      ? 'shadow-xs bg-muted font-semibold text-foreground'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  <Users className="h-3.5 w-3.5 text-primary" />
                  <span>Friends</span>
                </Link>
              </>
            )}

            {/* 4. MODERATOR TABS */}
            {isModerator && !isSuperAdmin && !isBrandAdmin && (
              <>
                <Link
                  href="/admin/moderation"
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                    pathname.startsWith('/admin/moderation')
                      ? 'shadow-xs bg-muted font-semibold text-foreground'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Moderation</span>
                  {pendingCount > 0 && (
                    <span className="py-0.2 rounded-full border border-amber-500/30 bg-amber-500/20 px-1.5 font-mono text-[9px] font-bold text-amber-600 dark:text-amber-400">
                      {pendingCount}
                    </span>
                  )}
                </Link>

                <Link
                  href="/"
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                    pathname === '/'
                      ? 'shadow-xs bg-muted font-semibold text-foreground'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  <Radio className="h-3.5 w-3.5" />
                  <span>Live Judging</span>
                </Link>

                <Link
                  href="/leaderboard"
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                    pathname === '/leaderboard'
                      ? 'shadow-xs bg-muted font-semibold text-foreground'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  <Trophy className="h-3.5 w-3.5 text-amber-500" />
                  <span>Leaderboard</span>
                </Link>
              </>
            )}

            {/* 5. GUEST / LOGGED-OUT TABS */}
            {isGuest && (
              <>
                <Link
                  href="/"
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                    pathname === '/'
                      ? 'shadow-xs bg-muted font-semibold text-foreground'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  <Radio
                    className={cn('h-3.5 w-3.5', pathname === '/' && 'animate-pulse text-primary')}
                  />
                  <span>Live Judging</span>
                </Link>

                <Link
                  href="/leaderboard"
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                    pathname === '/leaderboard'
                      ? 'shadow-xs bg-muted font-semibold text-foreground'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  <Trophy className="h-3.5 w-3.5 text-amber-500" />
                  <span>Leaderboard</span>
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Right: Actions, CTA & User Profile Controls */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {extraControls}

          {/* Quick CTA: For authenticated Creators or Super Admins - Hidden on mobile */}
          {(isCreator || isSuperAdmin) && (
            <Button
              size="sm"
              onClick={handleUploadClick}
              className="shadow-xs sm:px-4.5 hidden h-10 gap-2 rounded-xl bg-primary px-3.5 text-xs font-bold text-white transition-colors hover:bg-primary-hover sm:inline-flex sm:h-11 sm:text-sm"
            >
              <UploadCloud className="h-4 w-4" />
              <span>+ Submit Entry</span>
            </Button>
          )}

          {/* User Menu vs Logged-Out Actions */}
          {isActuallyLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/80 bg-background/80 p-0 text-xs transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:h-11 sm:w-auto sm:gap-2.5 sm:p-1.5 sm:pr-3"
                  aria-label="User profile and account settings"
                >
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border bg-muted sm:h-9 sm:w-9">
                    <ProfileAvatar
                      name={user?.displayName}
                      url={user?.avatarUrl}
                      fallbackSrc="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                      alt={user?.displayName || 'User Avatar'}
                      className="h-full w-full text-[10px] sm:text-xs"
                    />
                  </div>

                  <div className="hidden flex-col text-left sm:flex">
                    <div className="flex items-center gap-1.5">
                      <span className="max-w-[110px] truncate text-xs font-semibold text-foreground sm:text-sm">
                        {isBrandAdmin
                          ? user?.organizationName || user?.displayName
                          : user?.displayName}
                      </span>
                      <span
                        className={cn(
                          'py-0.2 rounded-full border px-1.5 font-mono text-[9px] font-bold leading-none',
                          roleBadge.className
                        )}
                      >
                        {roleBadge.label}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-64">
                {/* User Profile Header */}
                <div className="rounded-t-lg border-b border-border/60 bg-muted/40 p-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border">
                      <ProfileAvatar
                        name={user?.displayName}
                        url={user?.avatarUrl}
                        fallbackSrc="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                        alt={user?.displayName || 'Avatar'}
                        className="h-full w-full text-[10px]"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="truncate text-xs font-bold text-foreground">
                          {isBrandAdmin
                            ? user?.organizationName || user?.displayName
                            : user?.displayName}
                        </span>
                      </div>
                      <p className="truncate font-mono text-[10px] text-muted-foreground">
                        {user?.username}
                      </p>
                      <p className="truncate text-[10px] text-muted-foreground">{user?.email}</p>
                      <div className="mt-1">
                        <span
                          className={cn(
                            'py-0.2 inline-block rounded-full border px-1.5 font-mono text-[8px] font-bold',
                            roleBadge.className
                          )}
                        >
                          {roleBadge.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CREATOR SPECIFIC MENU ITEMS */}
                {isCreator && (
                  <>
                    <DropdownMenuLabel className="mt-1 text-[10px] font-bold uppercase text-muted-foreground">
                      Creator Account
                    </DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/creator"
                        className="flex cursor-pointer items-center gap-2 text-xs font-medium"
                      >
                        <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
                        <span>Creator Studio</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/creator/friends"
                        className="flex cursor-pointer items-center gap-2 text-xs font-medium"
                      >
                        <Users className="h-3.5 w-3.5 text-primary" />
                        <span>Friends</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setProfileModalOpen(true)}
                      className="flex cursor-pointer items-center gap-2 text-xs font-medium"
                    >
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Profile Settings</span>
                    </DropdownMenuItem>
                  </>
                )}

                {/* BRAND ADMIN SPECIFIC MENU ITEMS */}
                {isBrandAdmin && !isSuperAdmin && (
                  <>
                    <DropdownMenuLabel className="mt-1 text-[10px] font-bold uppercase text-muted-foreground">
                      Brand Management
                    </DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/admin/contests"
                        className="flex cursor-pointer items-center gap-2 text-xs font-medium"
                      >
                        <Layers className="h-3.5 w-3.5 text-primary" />
                        <span>Contests & Tournaments</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/admin/creators"
                        className="flex cursor-pointer items-center gap-2 text-xs font-medium"
                      >
                        <User className="h-3.5 w-3.5 text-primary" />
                        <span>Creators</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/admin/moderation"
                        className="flex cursor-pointer items-center gap-2 text-xs font-medium"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Moderation Queue</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                {/* PLATFORM SUPER ADMIN SPECIFIC MENU ITEMS */}
                {isSuperAdmin && (
                  <>
                    <DropdownMenuLabel className="mt-1 flex items-center gap-1 text-[10px] font-bold uppercase text-rose-500">
                      <Radar className="h-3 w-3" />
                      <span>Super Admin Fleet</span>
                    </DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/super-admin"
                        className="flex cursor-pointer items-center gap-2 text-xs font-bold text-rose-500"
                      >
                        <Radar className="h-3.5 w-3.5" />
                        <span>Platform Radar Console</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/admin/contests"
                        className="flex cursor-pointer items-center gap-2 text-xs font-medium"
                      >
                        <Layers className="h-3.5 w-3.5 text-primary" />
                        <span>Contests Fleet</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/admin/moderation"
                        className="flex cursor-pointer items-center gap-2 text-xs font-medium"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Global Moderation</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                {/* MODERATOR MENU ITEMS */}
                {isModerator && !isSuperAdmin && !isBrandAdmin && (
                  <>
                    <DropdownMenuLabel className="mt-1 text-[10px] font-bold uppercase text-muted-foreground">
                      Safety & Integrity
                    </DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/admin/moderation"
                        className="flex cursor-pointer items-center gap-2 text-xs font-medium"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Moderation Queue</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />
                {/* Sign Out Action */}
                <DropdownMenuItem
                  onClick={() => logout('/login')}
                  className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            /* Logged-Out Actions: Sign In & Get Started */
            <div className="flex items-center gap-2 sm:gap-2.5">
              <Link
                href="/login"
                className="inline-flex h-10 items-center gap-1.5 rounded-xl border-2 border-primary/80 bg-background px-3 text-xs font-medium text-foreground transition-colors hover:border-primary hover:bg-muted sm:h-11 sm:gap-2 sm:px-4 sm:text-sm"
              >
                <LogIn className="h-4 w-4 text-primary" />
                <span>Sign In</span>
              </Link>

              <Link
                href="/register"
                className="shadow-xs sm:px-4.5 hidden h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-white transition-colors hover:bg-primary-hover sm:inline-flex sm:h-11 sm:text-sm"
              >
                <Sparkles className="h-4 w-4" />
                <span>Get Started</span>
              </Link>
            </div>
          )}

          {/* Light / Dark Mode Toggle */}
          <ThemeToggle className="border border-border/80 bg-background/80" />

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/80 bg-background/80 text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:h-11 sm:w-11 md:hidden"
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="bg-background/98 fixed inset-x-0 top-[4.5rem] z-50 flex flex-col space-y-3 border-b border-border p-4 shadow-xl backdrop-blur-xl duration-150 animate-in slide-in-from-top-2 sm:top-24 md:hidden">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>Navigation Menu</span>
            <span className={cn('rounded-full border px-2 py-0.5 font-bold', roleBadge.className)}>
              {roleBadge.label}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            {/* SUPER ADMIN MOBILE NAV */}
            {isSuperAdmin && (
              <>
                <Link
                  href="/super-admin"
                  className={cn(
                    'flex min-h-[44px] items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    pathname === '/super-admin'
                      ? 'bg-rose-500/15 font-semibold text-rose-500'
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  <Radar className="h-4 w-4 text-rose-500" />
                  <span>Platform Radar Console</span>
                </Link>
                <Link
                  href="/admin/contests"
                  className={cn(
                    'flex min-h-[44px] items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    pathname.startsWith('/admin/contests')
                      ? 'bg-muted font-semibold text-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  <Layers className="h-4 w-4" />
                  <span>Contests Fleet</span>
                </Link>
                <Link
                  href="/admin/moderation"
                  className={cn(
                    'flex min-h-[44px] items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    pathname.startsWith('/admin/moderation')
                      ? 'bg-muted font-semibold text-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>Moderation Queue ({pendingCount})</span>
                </Link>
              </>
            )}

            {/* BRAND ADMIN MOBILE NAV */}
            {isBrandAdmin && !isSuperAdmin && (
              <>
                <Link
                  href="/admin/contests"
                  className={cn(
                    'flex min-h-[44px] items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    pathname.startsWith('/admin/contests')
                      ? 'bg-muted font-semibold text-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  <Layers className="h-4 w-4" />
                  <span>Contests Dashboard</span>
                </Link>
                <Link
                  href="/admin/creators"
                  className={cn(
                    'flex min-h-[44px] items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    pathname.startsWith('/admin/creators')
                      ? 'bg-muted font-semibold text-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  <User className="h-4 w-4" />
                  <span>Creators</span>
                </Link>
                <Link
                  href="/admin/moderation"
                  className={cn(
                    'flex min-h-[44px] items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    pathname.startsWith('/admin/moderation')
                      ? 'bg-muted font-semibold text-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>Moderation Queue ({pendingCount})</span>
                </Link>
              </>
            )}

            {/* CREATOR MOBILE NAV */}
            {isCreator && (
              <>
                <Link
                  href="/creator"
                  className={cn(
                    'flex min-h-[44px] items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    pathname === '/creator'
                      ? 'bg-muted font-semibold text-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  <LayoutDashboard className="h-4 w-4 text-primary" />
                  <span>Creator Studio</span>
                </Link>
                <Link
                  href="/creator/friends"
                  className={cn(
                    'flex min-h-[44px] items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    pathname.startsWith('/creator/friends')
                      ? 'bg-muted font-semibold text-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  <Users className="h-4 w-4 text-primary" />
                  <span>Friends</span>
                </Link>
              </>
            )}

            {/* MODERATOR MOBILE NAV */}
            {isModerator && !isSuperAdmin && !isBrandAdmin && (
              <Link
                href="/admin/moderation"
                className={cn(
                  'flex min-h-[44px] items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  pathname.startsWith('/admin/moderation')
                    ? 'bg-muted font-semibold text-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                )}
              >
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Moderation Queue ({pendingCount})</span>
              </Link>
            )}

            {/* SHARED PUBLIC TABS */}
            <Link
              href="/"
              className={cn(
                'flex min-h-[44px] items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                pathname === '/'
                  ? 'bg-muted font-semibold text-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <Radio className="h-4 w-4 text-primary" />
              <span>Live Judging Showcase</span>
            </Link>

            <Link
              href="/leaderboard"
              className={cn(
                'flex min-h-[44px] items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                pathname === '/leaderboard'
                  ? 'bg-muted font-semibold text-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <Trophy className="h-4 w-4 text-amber-500" />
              <span>Global Leaderboard</span>
            </Link>
          </div>

          {/* Mobile Auth Actions */}
          <div className="border-t border-border/60 pt-3">
            {isActuallyLoggedIn ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout('/login');
                }}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 py-2.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out ({user?.displayName})</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border-2 border-primary/80 bg-background py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:bg-muted"
                >
                  <LogIn className="h-3.5 w-3.5 text-primary" />
                  <span>Sign In</span>
                </Link>
                <Link
                  href="/register"
                  className="shadow-xs flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-bold text-white transition-colors hover:bg-primary-hover"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Get Started</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Creator Profile Settings Modal */}
      {user && (
        <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <User className="h-4 w-4 text-primary" />
                <span>
                  {user.role === 'CREATOR' ? 'Edit profile' : 'Creator Profile & Reputation'}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {user.role === 'CREATOR'
                  ? 'Update your name and profile photo. Email stays your sign-in identity.'
                  : 'Verified Contest Operating System Identity'}
              </DialogDescription>
            </DialogHeader>

            {user.role === 'CREATOR' ? (
              <CreatorProfileEditor
                user={user}
                open={profileModalOpen}
                onClose={() => setProfileModalOpen(false)}
                onUpdated={(next) => updateUserProfile(next)}
              />
            ) : (
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border">
                    <ProfileAvatar
                      name={user.displayName}
                      url={user.avatarUrl}
                      fallbackSrc="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                      alt={user.displayName || 'Avatar'}
                      className="h-full w-full text-xs"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="truncate text-sm font-bold text-foreground">
                        {user.displayName}
                      </h4>
                      <span className="py-0.2 rounded-full border border-primary/30 bg-primary/10 px-2 font-mono text-[9px] font-bold text-primary">
                        {user.role}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-muted-foreground">{user.username}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                {/* Creator Statistics */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl border border-border bg-card p-2.5">
                    <span className="block text-[10px] font-bold text-muted-foreground">
                      Submissions
                    </span>
                    <span className="font-mono text-base font-black text-foreground">
                      {user.stats?.submissionsCount ?? 7}
                    </span>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-2.5">
                    <span className="block text-[10px] font-bold text-muted-foreground">
                      Earnings
                    </span>
                    <span className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400">
                      ${user.stats?.earnings?.toLocaleString() ?? '4,500'}
                    </span>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-2.5">
                    <span className="block text-[10px] font-bold text-muted-foreground">
                      Reputation
                    </span>
                    <span className="font-mono text-base font-black text-primary">
                      {user.stats?.reputationScore ?? 98}%
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 rounded-xl border border-border bg-card p-3">
                  <span className="block text-[11px] font-bold text-muted-foreground">Bio</span>
                  <p className="text-xs leading-relaxed text-foreground">
                    {user.bio ||
                      'Vertical video creator competing in high-stakes community contests.'}
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setProfileModalOpen(false)}
                    className="text-xs"
                  >
                    Close
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setProfileModalOpen(false);
                      router.push('/creator');
                    }}
                    className="gap-1 bg-primary text-xs font-semibold text-white hover:bg-primary-hover"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    <span>Go to Creator Studio</span>
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
