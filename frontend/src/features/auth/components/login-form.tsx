'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Video, AlertCircle, ShieldAlert } from 'lucide-react';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { mapAuthApiErrorToFormErrors } from '@/features/auth/lib/map-auth-errors';
import { LoginCredentials } from '@/types/auth';
import { Button } from '@/components/ui/button';
interface LoginFormProps {
  redirectUrl?: string;
}

export function LoginForm({ redirectUrl }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading } = useAuthSession();

  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
    rememberMe: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [platformWarning, setPlatformWarning] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'unauthorized_platform_access') {
      setPlatformWarning(
        'Unauthorized platform access. A platform administrator session is required for the Platform Radar console.'
      );
    }
  }, [searchParams]);

  // Standard Credential Login handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentials.email || !credentials.password) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      setError(null);
      setPlatformWarning(null);
      const user = await login(credentials);

      // Check redirectUrl authorization
      if (redirectUrl) {
        if (redirectUrl === '/super-admin') {
          if (user.role === 'CREATOR') router.push('/creator');
          else if (user.role === 'ADMIN' || user.role === 'ORGANIZATION_ADMIN')
            router.push('/admin/contests');
          else if (user.role === 'MODERATOR') router.push('/admin/moderation');
          else router.push('/');
          return;
        }

        if (
          redirectUrl === '/creator' &&
          user.role !== 'CREATOR' &&
          user.role !== 'PLATFORM_ADMIN'
        ) {
          if (user.role === 'ADMIN' || user.role === 'ORGANIZATION_ADMIN')
            router.push('/admin/contests');
          else if (user.role === 'MODERATOR') router.push('/admin/moderation');
          else router.push('/');
          return;
        }

        if (
          redirectUrl.startsWith('/admin') &&
          user.role !== 'ADMIN' &&
          user.role !== 'ORGANIZATION_ADMIN' &&
          user.role !== 'MODERATOR' &&
          user.role !== 'PLATFORM_ADMIN'
        ) {
          router.push('/');
          return;
        }

        router.push(redirectUrl);
        return;
      }

      // Default role routing
      switch (user.role) {
        case 'CREATOR':
          router.push('/creator');
          break;
        case 'ADMIN':
        case 'ORGANIZATION_ADMIN':
        case 'organizer':
          router.push('/admin/contests');
          break;
        case 'PLATFORM_ADMIN':
        case 'superadmin':
          router.push('/');
          break;
        case 'MODERATOR':
        case 'judge':
          router.push('/admin/moderation');
          break;
        case 'GUEST':
        default:
          router.push('/');
          break;
      }
    } catch (err) {
      const mapped = mapAuthApiErrorToFormErrors(err, 'login');
      setError(mapped.submit || mapped.email || 'Invalid email or password');
    }
  };

  return (
    <div className="space-y-5">
      {/* Platform Access Warning Toast */}
      {platformWarning && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-300 duration-200 animate-in fade-in slide-in-from-top-2">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
          <div className="space-y-1">
            <span className="font-bold text-rose-200">Restricted Route:</span>
            <p className="text-[11px] leading-relaxed text-rose-300/90">{platformWarning}</p>
          </div>
        </div>
      )}

      {/* General Error Banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive duration-150 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Standard Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="mb-1 block text-xs font-semibold text-foreground">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="email"
              placeholder="you@example.com"
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 pl-9 text-xs text-foreground transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-foreground">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••••"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 pl-9 pr-10 text-xs text-foreground transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-0.5">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={credentials.rememberMe}
              onChange={(e) => setCredentials({ ...credentials, rememberMe: e.target.checked })}
              className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary"
            />
            <span>Remember this device</span>
          </label>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="h-10 w-full gap-2 bg-primary text-xs font-bold text-white shadow-md shadow-primary/25 transition-all hover:bg-primary-hover"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              <span>Authenticating...</span>
            </div>
          ) : (
            <>
              <span>Sign In to Contest OS</span>
              <ArrowRight className="ml-auto h-3.5 w-3.5" />
            </>
          )}
        </Button>
      </form>

      {/* Registration Link Triggers */}
      <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-3 text-center text-xs">
        <span className="text-muted-foreground">Creating videos for this deployment?</span>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/register"
            className="flex items-center gap-1 font-bold text-primary hover:underline"
          >
            <Video className="h-3.5 w-3.5" />
            <span>Join as Creator</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
