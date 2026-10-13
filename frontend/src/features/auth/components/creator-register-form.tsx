'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  Video,
  Flame,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { mapAuthApiErrorToFormErrors } from '@/features/auth/lib/map-auth-errors';
import { CreatorRegisterPayload } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CreatorRegisterFormProps {
  onSwitchToBrand?: () => void;
}

const CREATOR_CATEGORIES = [
  { id: 'comedy', name: 'Comedy & Skits', emoji: '🎭' },
  { id: 'vfx', name: 'VFX & 3D Renders', emoji: '✨' },
  { id: 'sports', name: 'Action Sports & Skate', emoji: '🛹' },
  { id: 'gaming', name: 'Esports & Gaming', emoji: '🎮' },
  { id: 'music', name: 'Music & Audio Remix', emoji: '🎵' },
  { id: 'dance', name: 'Dance & Choreography', emoji: '💃' },
  { id: 'pets', name: 'Pets & Animal Bloopers', emoji: '🐾' },
  { id: 'fashion', name: 'Fashion & Streetwear', emoji: '👟' },
  { id: 'tech', name: 'Tech & AI Experiments', emoji: '🤖' },
];

export function CreatorRegisterForm({ onSwitchToBrand }: CreatorRegisterFormProps) {
  const { registerCreator, isLoading } = useAuthSession();

  const [formData, setFormData] = useState<CreatorRegisterPayload>({
    fullName: '',
    username: 'creator',
    email: '',
    password: '',
    category: 'Comedy & Skits',
    bio: '',
    agreeToTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);

  // Password strength calculation
  const calculatePasswordStrength = (
    pass: string
  ): { score: number; label: string; color: string } => {
    if (!pass) return { score: 0, label: 'Empty', color: 'bg-muted' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 25, label: 'Weak', color: 'bg-red-500' };
      case 2:
        return { score: 50, label: 'Fair', color: 'bg-amber-500' };
      case 3:
        return { score: 75, label: 'Good', color: 'bg-blue-500' };
      case 4:
        return { score: 100, label: 'Strong', color: 'bg-emerald-500' };
      default:
        return { score: 0, label: 'Weak', color: 'bg-red-500' };
    }
  };

  const passwordStrength = calculatePasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required.';
    if (!formData.email.trim() || !formData.email.includes('@')) {
      newErrors.email = 'Valid email address is required.';
    }
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must accept the terms & community authenticity pledge.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    try {
      setIsSuccess(true);
      await registerCreator(formData);
    } catch (err) {
      setIsSuccess(false);
      setErrors(mapAuthApiErrorToFormErrors(err, 'creator'));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Header Banner */}
      <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <Video className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="font-bold text-foreground">Creator Track:</span> Compete in tournaments
            & earn cash.
          </div>
        </div>
        {onSwitchToBrand && (
          <button
            type="button"
            onClick={onSwitchToBrand}
            className="shrink-0 text-[11px] font-semibold text-primary hover:underline"
          >
            Brand Track &rarr;
          </button>
        )}
      </div>

      {errors.submit && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errors.submit}</span>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-semibold text-foreground">
          Full Name <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Alex Rivera"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className={cn(
              'w-full rounded-lg border bg-background px-3 py-2 pl-9 text-xs text-foreground transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
              errors.fullName ? 'border-destructive' : 'border-border'
            )}
          />
        </div>
        {errors.fullName && <p className="mt-1 text-[11px] text-destructive">{errors.fullName}</p>}
      </div>

      {/* Email Address */}
      <div>
        <label className="mb-1 block text-xs font-semibold text-foreground">
          Email Address <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="email"
            placeholder="alex@woofskis.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={cn(
              'w-full rounded-lg border bg-background px-3 py-2 pl-9 text-xs text-foreground transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
              errors.email ? 'border-destructive' : 'border-border'
            )}
          />
        </div>
        {errors.email && <p className="mt-1 text-[11px] text-destructive">{errors.email}</p>}
      </div>

      {/* Password */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-xs font-semibold text-foreground">
            Password <span className="text-destructive">*</span>
          </label>
          {formData.password && (
            <span className="font-mono text-[10px] text-muted-foreground">
              Strength:{' '}
              <span className="font-semibold text-foreground">{passwordStrength.label}</span>
            </span>
          )}
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className={cn(
              'w-full rounded-lg border bg-background px-3 py-2 pl-9 pr-10 text-xs text-foreground transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
              errors.password ? 'border-destructive' : 'border-border'
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {formData.password && (
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn('h-full transition-all duration-300', passwordStrength.color)}
              style={{ width: `${passwordStrength.score}%` }}
            />
          </div>
        )}
        {errors.password && <p className="mt-1 text-[11px] text-destructive">{errors.password}</p>}
      </div>

      {/* Primary Category of Interest */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-foreground">
          Primary Creative Category
        </label>
        <div className="grid max-h-32 grid-cols-2 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-3">
          {CREATOR_CATEGORIES.map((cat) => {
            const isSelected = formData.category === cat.name;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFormData({ ...formData, category: cat.name })}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-left text-[11px] font-medium transition-all',
                  isSelected
                    ? 'shadow-xs border-primary bg-primary/10 font-bold text-primary'
                    : 'border-border bg-card/60 text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground'
                )}
              >
                <span>{cat.emoji}</span>
                <span className="truncate">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Creator Bio / Tagline (Optional) */}
      <div>
        <label className="mb-1 block text-xs font-semibold text-foreground">
          Creator Bio / Pitch{' '}
          <span className="text-[10px] font-normal text-muted-foreground">(Optional)</span>
        </label>
        <input
          type="text"
          placeholder="e.g. Vert skater & blender VFX animator from LA"
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Community Authenticity & Terms Checkbox */}
      <div className="rounded-xl border border-border bg-card/50 p-3">
        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            checked={formData.agreeToTerms}
            onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
            className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <div className="text-[11px] leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Woofskis Authenticity Guarantee:</span> I
            agree to the{' '}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{' '}
            and certify that my submissions will contain only original creations (zero unauthorized
            scraped or watermarked footage).
          </div>
        </label>
        {errors.agreeToTerms && (
          <p className="mt-1 text-[11px] text-destructive">{errors.agreeToTerms}</p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading || isSuccess}
        className="h-10 w-full gap-2 bg-primary text-xs font-bold text-white shadow-md shadow-primary/25 transition-all hover:bg-primary-hover"
      >
        {isLoading || isSuccess ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            <span>Setting up your Creator Studio...</span>
          </div>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            <span>Complete Creator Registration</span>
            <ArrowRight className="ml-auto h-3.5 w-3.5" />
          </>
        )}
      </Button>

      {/* Direct Sign-In Link */}
      <div className="pt-1 text-center text-xs text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign In
        </Link>
      </div>
    </form>
  );
}
