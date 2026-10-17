'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AppApiError } from '@/lib/axios';
import {
  createVideoCategory,
  deleteVideoCategory,
  listAdminVideoCategories,
  updateVideoCategory,
  type VideoCategory,
} from '@/services/video-categories-api';

const PAGE_SIZE = 20;

type StatusFilter = 'all' | 'active' | 'inactive';

function messageFrom(error: unknown): string {
  if (error instanceof AppApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return 'Request failed';
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function VideoCategoriesPanel() {
  const [items, setItems] = useState<VideoCategory[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editor, setEditor] = useState<VideoCategory | null | 'new'>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const envelope = await listAdminVideoCategories({
        search,
        status,
        page,
        limit: PAGE_SIZE,
      });
      if (!envelope.success || !envelope.data) {
        setItems([]);
        setError(envelope.message || 'Could not load categories');
        return;
      }
      setItems(envelope.data.items);
      setTotalCount(envelope.data.pagination.totalCount);
      setTotalPages(envelope.data.pagination.totalPages);
    } catch (err) {
      setItems([]);
      setError(messageFrom(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const setActive = async (category: VideoCategory, isActive: boolean) => {
    setBusyId(category.id);
    setNotice(null);
    try {
      const envelope = await updateVideoCategory(category.id, { isActive });
      if (!envelope.success) {
        setError(envelope.message || 'Could not update the category');
        return;
      }
      setNotice(isActive ? 'Category activated.' : 'Category deactivated. Existing videos were kept.');
      await load();
    } catch (err) {
      setError(messageFrom(err));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (category: VideoCategory) => {
    const confirmed = window.confirm(
      `Delete "${category.name}"? This only works when no videos or contests use it.`
    );
    if (!confirmed) return;
    setBusyId(category.id);
    setNotice(null);
    try {
      const envelope = await deleteVideoCategory(category.id);
      if (!envelope.success) {
        setError(envelope.message || 'Could not delete the category');
        return;
      }
      setNotice('Category deleted.');
      await load();
    } catch (err) {
      setError(messageFrom(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <form
          className="flex min-w-0 flex-1 gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setSearch(searchInput.trim());
          }}
        >
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search categories"
            aria-label="Search categories"
            className="h-9 w-full rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button type="submit" variant="outline" className="h-9 shrink-0 text-xs">
            Search
          </Button>
        </form>
        <select
          value={status}
          aria-label="Filter by status"
          onChange={(event) => {
            setStatus(event.target.value as StatusFilter);
            setPage(1);
          }}
          className="h-9 rounded-xl border border-border bg-card px-3 text-xs font-semibold"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <Button
          type="button"
          onClick={() => setEditor('new')}
          className="h-9 gap-1.5 bg-primary text-xs font-bold text-white"
        >
          <Plus className="h-4 w-4" />
          Create category
        </Button>
      </div>

      {notice && (
        <p className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
          {notice}
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-500">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3">Description</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Videos</th>
                <th className="px-3 py-3">Created</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index} className="border-b border-border/70">
                    <td colSpan={6} className="px-3 py-3">
                      <div className="h-8 animate-pulse rounded-lg bg-muted" />
                    </td>
                  </tr>
                ))}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-sm text-muted-foreground">
                    No categories yet. Create one to offer it on video upload.
                  </td>
                </tr>
              )}
              {!loading &&
                items.map((category) => (
                  <tr key={category.id} className="border-b border-border/70 last:border-0">
                    <td className="px-3 py-3 font-semibold text-foreground">{category.name}</td>
                    <td className="max-w-[240px] truncate px-3 py-3 text-xs text-muted-foreground">
                      {category.description || '—'}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={
                          category.isActive
                            ? 'rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-600'
                            : 'rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground'
                        }
                      >
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{category.submissionCount}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs text-muted-foreground">
                      {formatDate(category.createdAt)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-8 gap-1 px-2 text-[11px]"
                          onClick={() => setEditor(category)}
                          disabled={busyId === category.id}
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-8 px-2 text-[11px]"
                          disabled={busyId === category.id}
                          onClick={() => void setActive(category, !category.isActive)}
                        >
                          {category.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-8 gap-1 px-2 text-[11px]"
                          disabled={busyId === category.id}
                          onClick={() => void remove(category)}
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border px-3 py-2 text-xs">
          <span className="text-muted-foreground">{totalCount} categories</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="font-semibold disabled:opacity-40"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </button>
            <span className="text-muted-foreground">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              className="font-semibold disabled:opacity-40"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <CategoryEditor
        open={editor !== null}
        category={editor && editor !== 'new' ? editor : null}
        onOpenChange={(open) => {
          if (!open) setEditor(null);
        }}
        onSaved={async (text) => {
          setEditor(null);
          setNotice(text);
          await load();
        }}
      />
    </div>
  );
}

function CategoryEditor({
  open,
  category,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  category: VideoCategory | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(category?.name ?? '');
    setDescription(category?.description ?? '');
    setIsActive(category?.isActive ?? true);
    setFormError(null);
    setSaving(false);
  }, [open, category]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError('Category name is required.');
      return;
    }
    setSaving(true);
    setFormError(null);
    const body = {
      name: trimmed,
      description: description.trim() ? description.trim() : null,
      isActive,
    };
    try {
      const envelope = category
        ? await updateVideoCategory(category.id, body)
        : await createVideoCategory(body);
      if (!envelope.success) {
        setFormError(envelope.message || 'Could not save the category');
        return;
      }
      await onSaved(category ? 'Category updated.' : 'Category created.');
    } catch (err) {
      setFormError(messageFrom(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? 'Edit category' : 'Create category'}</DialogTitle>
          <DialogDescription>
            Official categories appear on video upload. Other stays a creator free-text choice.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={(event) => void submit(event)}>
          <label className="block space-y-1">
            <span className="text-xs font-semibold">Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={80}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold">Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={500}
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
            />
            Active for new uploads
          </label>
          {formError && <p className="text-xs font-semibold text-destructive">{formError}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-primary text-white">
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
