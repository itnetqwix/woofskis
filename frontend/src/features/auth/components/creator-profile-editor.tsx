'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, Mail, User } from 'lucide-react';
import { ProfileAvatar } from '@/components/common/profile-avatar';
import { Button } from '@/components/ui/button';
import { AppApiError } from '@/lib/axios';
import { cn } from '@/lib/utils';
import type { AuthUser } from '@/types/auth';
import { mapApiUserToAuthUser } from '@/features/auth/lib/map-auth-user';
import { putFileToPresignedUrl } from '@/features/submissions/lib/s3-upload';
import { presignAvatar, requireAuthData, updateMyProfile } from '@/services/auth-api';

const AVATAR_TYPES: Record<string, string> = {
  'image/jpeg': 'image/jpeg',
  'image/png': 'image/png',
  'image/webp': 'image/webp',
  'image/gif': 'image/gif',
};

function resolveAvatarContentType(file: File): string | null {
  const type = file.type.toLowerCase();
  if (type in AVATAR_TYPES) return AVATAR_TYPES[type];
  const name = file.name.toLowerCase();
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.webp')) return 'image/webp';
  if (name.endsWith('.gif')) return 'image/gif';
  return null;
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof AppApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

interface CreatorProfileEditorProps {
  user: AuthUser;
  open: boolean;
  onUpdated: (user: AuthUser) => void;
  onClose: () => void;
}

export function CreatorProfileEditor({
  user,
  open,
  onUpdated,
  onClose,
}: CreatorProfileEditorProps) {
  const [name, setName] = useState(user.displayName ?? '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const wasOpen = useRef(false);

  const replacePreview = (next: string | null) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = next;
    setPreviewUrl(next);
  };

  useEffect(() => {
    if (open && !wasOpen.current) {
      setName(user.displayName ?? '');
      setNameError(null);
      setFormError(null);
      setSuccess(null);
      replacePreview(null);
    }
    wasOpen.current = open;
  }, [open, user.displayName]);

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  const validateName = (value: string): string | null => {
    const trimmed = value.trim();
    if (trimmed.length < 2) return 'Name must be at least 2 characters long';
    if (trimmed.length > 100) return 'Name cannot exceed 100 characters';
    return null;
  };

  const applyProfile = (apiUser: Parameters<typeof mapApiUserToAuthUser>[0]) => {
    const mapped = mapApiUserToAuthUser(apiUser);
    onUpdated({
      ...user,
      displayName: mapped.displayName,
      avatarUrl: mapped.avatarUrl,
      email: mapped.email,
    });
    replacePreview(null);
  };

  const saveName = async () => {
    const validation = validateName(name);
    setNameError(validation);
    setFormError(null);
    setSuccess(null);
    if (validation) return;
    const trimmed = name.trim();
    if (trimmed === (user.displayName ?? '').trim()) {
      setSuccess('Profile is already up to date.');
      return;
    }
    setSaving(true);
    try {
      const envelope = await updateMyProfile({ name: trimmed });
      applyProfile(requireAuthData(envelope, 'Profile update did not return your account'));
      setSuccess('Profile saved.');
    } catch (error) {
      setFormError(errorMessage(error, 'Profile could not be saved'));
    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async (file: File) => {
    const contentType = resolveAvatarContentType(file);
    if (!contentType) {
      setFormError('Choose a JPEG, PNG, WebP, or GIF image.');
      return;
    }
    if (file.size < 1) {
      setFormError('Choose an image file.');
      return;
    }

    setFormError(null);
    setSuccess(null);
    setUploading(true);
    const localPreview = URL.createObjectURL(file);
    replacePreview(localPreview);
    try {
      const presignEnvelope = await presignAvatar({ contentType });
      const presign = requireAuthData(presignEnvelope, 'Could not prepare the image upload');
      await putFileToPresignedUrl(presign, file, undefined, 'Profile image upload failed');
      const envelope = await updateMyProfile({ avatarObjectKey: presign.objectKey });
      applyProfile(requireAuthData(envelope, 'Profile image could not be saved'));
      setSuccess('Profile image updated.');
    } catch (error) {
      replacePreview(null);
      setFormError(errorMessage(error, 'Profile image could not be uploaded'));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const shownUrl = previewUrl || user.avatarUrl || null;
  const busy = saving || uploading;

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-border">
          <ProfileAvatar
            name={name || user.displayName}
            url={shownUrl}
            className="h-full w-full text-sm"
          />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="truncate text-sm font-bold text-foreground">
            {name.trim() || user.displayName || 'Creator'}
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadImage(file);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="gap-1.5 text-xs"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
            <span>{user.avatarUrl || previewUrl ? 'Change photo' : 'Upload photo'}</span>
          </Button>
        </div>
      </div>

      {formError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {formError}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
          {success}
        </p>
      ) : null}

      <div>
        <label className="mb-1 block text-xs font-semibold text-foreground" htmlFor="creator-name">
          Full name
        </label>
        <div className="relative">
          <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            id="creator-name"
            type="text"
            value={name}
            maxLength={100}
            disabled={busy}
            onChange={(event) => {
              setName(event.target.value);
              setNameError(null);
              setSuccess(null);
            }}
            className={cn(
              'w-full rounded-lg border bg-background px-3 py-2 pl-9 text-xs text-foreground transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
              nameError ? 'border-destructive' : 'border-border'
            )}
          />
        </div>
        {nameError ? <p className="mt-1 text-[11px] text-destructive">{nameError}</p> : null}
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-foreground" htmlFor="creator-email">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            id="creator-email"
            type="email"
            value={user.email ?? ''}
            readOnly
            className="w-full cursor-not-allowed rounded-lg border border-border bg-muted px-3 py-2 pl-9 text-xs text-muted-foreground"
          />
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Email is your sign-in identity and cannot be changed here.
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
          Close
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={busy}
          onClick={() => void saveName()}
          className="gap-1.5 bg-primary text-xs font-semibold text-white hover:bg-primary-hover"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          <span>Save profile</span>
        </Button>
      </div>
    </div>
  );
}
