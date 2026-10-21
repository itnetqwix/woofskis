'use client';

import React, { useState } from 'react';
import {
  Layers,
  Palette,
  Sparkles,
  Plus,
  RotateCcw,
  Globe,
  Radio,
  Trophy,
  ShieldCheck,
} from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { TenantSwitcherHUD } from '@/components/layout/tenant-switcher-hud';
import { RoleGuard } from '@/components/auth/role-guard';
import { AdminTabsNav } from '@/features/admin/components/admin-tabs-nav';
import { ContestsManagementTable } from '@/features/admin/components/contests-management-table';
import { ContestCreateModal } from '@/features/admin/components/contest-create-modal';
import { useContestsManagement } from '@/features/admin/hooks/use-contests-management';
import { useTenantTheme } from '@/features/admin/hooks/use-tenant-theme';
import { ContestConfigItem } from '@/types/tenant';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function AdminContestsPage() {
  const {
    contests,
    filteredContests,
    searchQuery,
    statusFilter,
    sortBy,
    metrics,
    statusCounts,
    setSearchQuery,
    setStatusFilter,
    setSortBy,
    createContest,
    updateContest,
    transitionStatus,
    scheduleJudging,
    duplicateContest,
    deleteContest,
    reloadContests,
    isLoaded,
    loadError,
  } = useContestsManagement();

  const { brands, activeBrand } = useTenantTheme();

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [editingContest, setEditingContest] = useState<ContestConfigItem | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenCreate = () => {
    setEditingContest(null);
    setCreateModalOpen(true);
  };

  const handleEditContest = (contest: ContestConfigItem) => {
    setEditingContest(contest);
    setCreateModalOpen(true);
  };

  const handleSaveNewContest = async (contestData: any) => {
    const created = await createContest(contestData);
    if (!created.ok) return created;
    showToast(`Contest "${created.contest.title}" successfully created and saved!`);
    return created;
  };

  const handleUpdateContest = async (contestId: string, updates: any) => {
    const updated = await updateContest(contestId, updates);
    if (!updated.ok) return updated;
    showToast(`Contest updated successfully.`);
    return updated;
  };

  const handleTransitionStatus = async (contestId: string, newStatus: any) => {
    const updated = await transitionStatus(contestId, newStatus);
    showToast(updated.ok ? `Contest status updated to ${newStatus}.` : updated.message);
    return updated;
  };

  const handleScheduleJudging = async (contestId: string, taglineConfirmation: string) => {
    const result = await scheduleJudging(contestId, taglineConfirmation);
    showToast(result.ok ? 'Judging transition scheduled for 3 days from now.' : result.message);
    return result;
  };

  const handleDuplicate = async (contestId: string) => {
    const result = await duplicateContest(contestId);
    showToast(result.ok ? 'Contest duplicated as draft.' : result.message);
  };

  const handleDelete = async (contestId: string) => {
    const result = await deleteContest(contestId);
    showToast(result.ok ? 'Contest removed.' : result.message);
  };

  return (
    <RoleGuard route="/admin/contests">
      <div className="relative flex min-h-screen w-full flex-col bg-background text-foreground antialiased selection:bg-primary/20">
        {/* UNIFIED GLOBAL HEADER */}
        <AppHeader />

        {/* FLOATING TENANT SWITCHER HUD */}
        <TenantSwitcherHUD />

        {/* TOAST FEEDBACK NOTIFICATION */}
        {toastMessage && (
          <div className="fixed right-4 top-16 z-50 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-bold text-primary shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-2">
            {toastMessage}
          </div>
        )}

        {/* MAIN CONTAINER */}
        <main className="mx-auto w-full max-w-7xl flex-1 space-y-4 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
                Contests
              </h1>
              <p className="truncate text-xs text-muted-foreground">
                Create contests, manage their lifecycle, and review submissions.
              </p>
            </div>
            <Button
              onClick={handleOpenCreate}
              className="h-9 shrink-0 gap-1.5 bg-primary text-xs font-bold text-white shadow-md shadow-primary/25 transition-all hover:bg-primary-hover"
            >
              <Plus className="h-4 w-4" />
              <span>Create Contest</span>
            </Button>
          </div>

          {/* 1. ADMIN TABS NAVIGATION (Contests, Brands, Moderation) */}
          <AdminTabsNav contestsCount={contests.length} />

          {loadError && (
            <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-500">
              {loadError}
            </p>
          )}
          <ContestsManagementTable
            contests={filteredContests}
            isLoading={!isLoaded}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            sortBy={sortBy}
            statusCounts={statusCounts}
            metrics={metrics}
            onSearchChange={setSearchQuery}
            onStatusFilterChange={setStatusFilter}
            onSortByChange={setSortBy}
            onEditContest={handleEditContest}
            onTransitionStatus={handleTransitionStatus}
            onScheduleJudging={handleScheduleJudging}
            onDuplicateContest={handleDuplicate}
            onDeleteContest={handleDelete}
            onResetDefaults={() => {
              reloadContests();
              showToast('Reloaded contests.');
            }}
          />
        </main>

        {/* CONTEST CREATION & EDIT MODAL WIZARD */}
        <ContestCreateModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          brands={brands}
          activeBrandId={activeBrand?.id}
          editContest={editingContest}
          onSaveContest={handleSaveNewContest}
          onUpdateContest={handleUpdateContest}
        />
      </div>
    </RoleGuard>
  );
}
