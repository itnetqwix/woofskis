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
  ChevronDown,
  Check,
  LogIn,
  Sparkles,
  Radar,
  Menu,
  Tags,
  User,
  Users,
  Heart,
} from 'lucide-react';
import { ProfileAvatar } from '@/components/common/profile-avatar';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { NotificationBell } from '@/components/layout/notification-bell';
import {
  HeaderMenuSheet,
  type HeaderNavSection,
} from '@/components/layout/header-menu-sheet';
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

  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);

  // Close the menu on route transition
  useEffect(() => {
    setMenuOpen(false);
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

  // Menu navigation, grouped by role. Routes and role gates match the previous header.
  const menuSections: HeaderNavSection[] = [];
  if (isSuperAdmin) {
    menuSections.push({
      id: 'platform',
      title: 'Platform',
      items: [
        {
          href: '/super-admin',
          label: 'Platform Radar Console',
          icon: Radar,
          iconClassName: 'text-rose-500',
          active: pathname === '/super-admin',
        },
        {
          href: '/admin/contests',
          label: 'Contests Fleet',
          icon: Layers,
          active: pathname.startsWith('/admin/contests'),
        },
        {
          href: '/admin/moderation',
          label: 'Global Moderation',
          icon: ShieldCheck,
          iconClassName: 'text-emerald-500',
          active: pathname.startsWith('/admin/moderation'),
          badge: pendingCount,
        },
      ],
    });
  } else if (isBrandAdmin) {
    menuSections.push({
      id: 'manage',
      title: 'Manage',
      items: [
        {
          href: '/admin/contests',
          label: 'Contests',
          icon: Layers,
          active: pathname.startsWith('/admin/contests'),
        },
        {
          href: '/admin/creators',
          label: 'Creators',
          icon: User,
          active: pathname.startsWith('/admin/creators'),
        },
        {
          href: '/admin/leaderboard',
          label: 'Leaderboard',
          icon: Trophy,
          active: pathname.startsWith('/admin/leaderboard'),
        },
        {
          href: '/admin/categories',
          label: 'Video Categories',
          icon: Tags,
          active: pathname.startsWith('/admin/categories'),
        },
        {
          href: '/admin/moderation',
          label: 'Moderation Queue',
          icon: ShieldCheck,
          iconClassName: 'text-emerald-500',
          active: pathname.startsWith('/admin/moderation'),
          badge: pendingCount,
        },
      ],
    });
  } else if (isModerator) {
    menuSections.push({
      id: 'safety',
      title: 'Safety & Integrity',
      items: [
        {
          href: '/admin/moderation',
          label: 'Moderation Queue',
          icon: ShieldCheck,
          iconClassName: 'text-emerald-500',
          active: pathname.startsWith('/admin/moderation'),
          badge: pendingCount,
        },
      ],
    });
  }
  if (isCreator) {
    menuSections.push({
      id: 'create',
      title: 'Create',
      items: [
        {
          href: '/creator',
          label: 'Creator Studio',
          icon: LayoutDashboard,
          iconClassName: 'text-primary',
          active: pathname === '/creator',
        },
        {
          href: '/creator/friends',
          label: 'Friends',
          icon: Users,
          iconClassName: 'text-primary',
          active: pathname.startsWith('/creator/friends'),
        },
      ],
    });
  }
  menuSections.push({
    id: 'explore',
    title: 'Explore',
    items: [
      {
        href: '/',
        label: 'Live Judging',
        icon: Radio,
        iconClassName: 'text-primary',
        active: pathname === '/',
      },
      {
        href: '/leaderboard',
        label: 'Leaderboard',
        icon: Trophy,
        iconClassName: 'text-amber-500',
        active: pathname === '/leaderboard',
      },
      {
        href: '/about',
        label: 'About Woofskis',
        icon: Heart,
        iconClassName: 'text-rose-500',
        active: pathname === '/about',
      },
    ],
  });

  const accountName = isBrandAdmin
    ? user?.organizationName || user?.displayName
    : user?.displayName;

  return (
    <>
      <header
        className={cn(
          'z-40 flex h-[4.5rem] w-full shrink-0 items-center justify-between px-3.5 sm:h-24 sm:px-5 lg:px-7',
          overlay
            ? 'relative border-0 bg-background/80 backdrop-blur-xl md:h-16 md:border-b md:border-border md:bg-background/95 md:px-5 md:shadow-sm lg:px-8'
            : 'sticky top-0 border-b border-border/80 bg-background/95 backdrop-blur-md'
        )}
      >
        {/* Left: Brand Logo (+ guest navigation) */}
        <div className="flex min-w-0 shrink-0 items-center gap-3 sm:gap-5 lg:gap-7">
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeBrand?.logoUrl || '/logo/woofskis_logo_with_dog_transparent.png'}
                      alt={activeBrand?.name || 'Woofskis'}
                      className="h-auto w-[84px] max-h-12 object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-105 sm:w-[110px] sm:max-h-16 md:w-[130px] md:max-h-20"
                      width={160}
                      height={88}
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
              <div className="flex shrink-0 items-center justify-center p-0.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeBrand?.logoUrl || '/logo/woofskis_logo_with_dog_transparent.png'}
                  alt="Woofskis Logo"
                  className={cn(
                    'h-auto w-[88px] max-h-12 object-contain drop-shadow-md transition-transform duration-200 group-hover:scale-105 sm:w-[115px] sm:max-h-16 md:w-[135px] md:max-h-20 lg:w-[155px]',
                    overlay && 'md:max-h-14 md:w-[100px] lg:w-[104px]'
                  )}
                  width={160}
                  height={88}
                />
              </div>
            </Link>
          )}

          {/* Guest desktop navigation. Signed-in navigation lives in the menu. */}
          {isGuest && (
            <nav className="hidden items-center gap-1 md:flex" aria-label="Main Navigation">
              <Link
                href="/"
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                  pathname === '/'
                    ? 'shadow-xs bg-muted font-semibold text-foreground'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  overlay &&
                    pathname === '/' &&
                    'border border-primary/30 bg-primary/10 px-3 py-2 text-foreground'
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
                href="/about"
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                  pathname === '/about'
                    ? 'shadow-xs bg-muted font-semibold text-foreground'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                )}
              >
                <Heart className="h-3.5 w-3.5 text-rose-500" />
                <span>About Woofskis</span>
              </Link>
            </nav>
          )}
        </div>

        {/* Right: signed-in = bell + menu; guest = sign-in actions, theme, mobile menu */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {extraControls}

          {isActuallyLoggedIn ? (
            <NotificationBell />
          ) : (
            <>
              <div className="flex items-center gap-2 sm:gap-2.5">
                <Link
                  href="/login"
                  className={cn(
                    'inline-flex h-10 items-center gap-1.5 rounded-xl border-2 border-primary/80 bg-background px-3 text-xs font-medium text-foreground transition-colors hover:border-primary hover:bg-muted sm:h-11 sm:gap-2 sm:px-4 sm:text-sm',
                    overlay && 'md:h-10 md:border md:text-[13px]'
                  )}
                >
                  <LogIn className="h-4 w-4 text-primary" />
                  <span>Sign In</span>
                </Link>

                <Link
                  href="/register"
                  className={cn(
                    'shadow-xs sm:px-4.5 hidden h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-white transition-colors hover:bg-primary-hover sm:inline-flex sm:h-11 sm:text-sm',
                    overlay && 'md:h-10 md:text-[13px]'
                  )}
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Get Started</span>
                </Link>
              </div>
              <ThemeToggle
                className={cn(
                  'hidden border border-border/80 bg-background/80 md:flex',
                  overlay && 'md:order-first'
                )}
              />
            </>
          )}

          <HeaderMenuSheet
            open={menuOpen}
            onOpenChange={setMenuOpen}
            sections={menuSections}
            account={
              isActuallyLoggedIn
                ? {
                    name: accountName,
                    username: user?.username,
                    email: user?.email,
                    avatarUrl: user?.avatarUrl,
                    roleLabel: roleBadge.label,
                    roleClassName: roleBadge.className,
                  }
                : null
            }
            onOpenProfile={isActuallyLoggedIn && isCreator ? () => setProfileModalOpen(true) : undefined}
            onSubmitEntry={isCreator || isSuperAdmin ? handleUploadClick : undefined}
            onSignOut={isActuallyLoggedIn ? () => logout('/login') : undefined}
            trigger={
              <button
                type="button"
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl border border-border/80 bg-background/80 text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:h-11 sm:w-11',
                  isGuest && 'md:hidden'
                )}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            }
          />
        </div>
      </header>

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
