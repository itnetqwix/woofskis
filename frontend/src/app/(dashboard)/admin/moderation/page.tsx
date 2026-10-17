'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Layers,
  Table,
  Keyboard,
  History,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  Flame,
  Check,
  X,
  Plus,
} from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { TenantSwitcherHUD } from '@/components/layout/tenant-switcher-hud';
import { RoleGuard } from '@/components/auth/role-guard';
import { AdminTabsNav } from '@/features/admin/components/admin-tabs-nav';
import { ModerationMetrics } from '@/features/admin/components/moderation-metrics';
import { ModerationFilterBar } from '@/features/admin/components/moderation-filter-bar';
import { ModerationSplitViewer } from '@/features/admin/components/moderation-split-viewer';
import { ModerationTable } from '@/features/admin/components/moderation-table';
import { RejectReasonDialog } from '@/features/admin/components/reject-reason-dialog';
import { ModerationShortcutsModal } from '@/features/admin/components/moderation-shortcuts-modal';
import { ModerationAuditLogModal } from '@/features/admin/components/moderation-audit-log-modal';
import {
  UNSUPPORTED_MODERATION_ACTION,
  useModerationQueue,
} from '@/features/admin/hooks/use-moderation-queue';
import { AdminSubmissionItem, RejectionReasonCode } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function AdminModerationPage() {
  const {
    submissions,
    filteredSubmissions,
    selectedSubmission,
    selectedIndex,
    filterStatus,
    searchQuery,
    categoryFilter,
    sortBy,
    viewMode,
    metrics,
    statusCounts,
    auditLogs,
    selectedBatchIds,
    isHydrated,
    loadError,
    isActing,
    setFilterStatus,
    setSearchQuery,
    setCategoryFilter,
    setSortBy,
    setViewMode,
    setSelectedSubmissionId,
    toggleBatchSelect,
    selectAllBatch,
    clearBatchSelection,
    approveSubmission,
    rejectSubmission,
    flagSubmission,
    unflagSubmission,
    batchApprove,
    batchReject,
    toggleComplianceCheck,
    goToNextSubmission,
    goToPrevSubmission,
    goToNextPending,
    goToPrevPending,
    resetQueue,
    reloadAuditLogs,
  } = useModerationQueue();

  // Modals state
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [rejectingSubmission, setRejectingSubmission] = useState<AdminSubmissionItem | null>(null);
  const [isBatchReject, setIsBatchReject] = useState<boolean>(false);
  const [batchRejectIds, setBatchRejectIds] = useState<string[]>([]);

  const [shortcutsModalOpen, setShortcutsModalOpen] = useState<boolean>(false);
  const [auditLogModalOpen, setAuditLogModalOpen] = useState<boolean>(false);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Open single rejection modal
  const handleRequestReject = useCallback((submission: AdminSubmissionItem) => {
    setIsBatchReject(false);
    setRejectingSubmission(submission);
    setRejectModalOpen(true);
  }, []);

  // Open batch rejection modal
  const handleRequestBatchReject = (ids: string[]) => {
    if (ids.length === 0) return;
    setIsBatchReject(true);
    setBatchRejectIds(ids);
    const sample = submissions.find((s) => s.id === ids[0]) || submissions[0];
    setRejectingSubmission(sample);
    setRejectModalOpen(true);
  };

  // Confirm rejection
  const handleConfirmReject = async (
    id: string,
    reasonCode: RejectionReasonCode,
    reasonNote: string
  ) => {
    if (isBatchReject) {
      batchReject(batchRejectIds, reasonCode, reasonNote);
      showToast(UNSUPPORTED_MODERATION_ACTION);
      return;
    }
    await rejectSubmission(id, reasonCode, reasonNote);
    showToast('Submission rejected. The reason is stored for the creator.');
  };

  const handleApprove = useCallback(
    async (id: string) => {
      try {
        await approveSubmission(id);
        showToast('Submission approved.');
      } catch (error: unknown) {
        showToast(error instanceof Error ? error.message : 'Submission could not be approved');
      }
    },
    [approveSubmission]
  );

  const handleBatchApprove = (ids: string[]) => {
    if (ids.length === 0) return;
    batchApprove(ids);
    showToast(UNSUPPORTED_MODERATION_ACTION);
  };

  const handleToggleFlag = useCallback(
    (id: string) => {
      const target = submissions.find((item) => item.id === id);
      if (!target) return;
      if (target.isFlagged || target.status === 'FLAGGED') {
        unflagSubmission(id);
      } else {
        flagSubmission(id, '');
      }
      showToast(UNSUPPORTED_MODERATION_ACTION);
    },
    [submissions, flagSubmission, unflagSubmission]
  );

  // Keyboard Shortcuts Hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if modals are open or user is typing in form controls
      if (rejectModalOpen || shortcutsModalOpen || auditLogModalOpen) return;
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;

      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        if (selectedSubmission) {
          handleApprove(selectedSubmission.id);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (selectedSubmission) {
          handleRequestReject(selectedSubmission);
        }
      } else if (e.key === 'j' || e.key === 'J' || e.key === 'ArrowDown') {
        e.preventDefault();
        goToNextPending();
      } else if (e.key === 'k' || e.key === 'K' || e.key === 'ArrowUp') {
        e.preventDefault();
        goToPrevPending();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        if (selectedSubmission) {
          handleToggleFlag(selectedSubmission.id);
        }
      } else if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        setViewMode(viewMode === 'split' ? 'table' : 'split');
      } else if (e.key === '?') {
        e.preventDefault();
        setShortcutsModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    rejectModalOpen,
    shortcutsModalOpen,
    auditLogModalOpen,
    selectedSubmission,
    viewMode,
    goToNextPending,
    goToPrevPending,
    handleApprove,
    handleRequestReject,
    handleToggleFlag,
    setViewMode,
  ]);

  return (
    <RoleGuard route="/admin/moderation">
      <div className="relative flex min-h-screen w-full flex-col bg-background text-foreground antialiased selection:bg-primary/20">
        {/* UNIFIED GLOBAL APPLICATION HEADER */}
        <AppHeader />

        {/* FLOATING TENANT SWITCHER HUD */}
        <TenantSwitcherHUD />

        {/* TOAST FEEDBACK NOTIFICATION */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl border border-border bg-card/95 px-4 py-3 text-xs font-semibold text-foreground shadow-2xl backdrop-blur-md duration-200 animate-in fade-in slide-in-from-bottom-4">
            <Sparkles className="h-4 w-4 animate-pulse text-primary" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* DASHBOARD CONTENT CONTAINER */}
        <main className="mx-auto w-full max-w-7xl flex-1 space-y-4 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
                Moderation
              </h1>
              <p className="truncate text-xs text-muted-foreground">
                Review video submissions before they enter public voting.
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="flex items-center rounded-lg border border-border bg-muted/60 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('split')}
                  aria-pressed={viewMode === 'split'}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold transition-colors',
                    viewMode === 'split'
                      ? 'bg-card text-foreground ring-1 ring-border'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Inspect</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  aria-pressed={viewMode === 'table'}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold transition-colors',
                    viewMode === 'table'
                      ? 'bg-card text-foreground ring-1 ring-border'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Table className="h-3.5 w-3.5" />
                  <span>Table</span>
                </button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShortcutsModalOpen(true)}
                className="h-8 w-8 p-0"
                title="Keyboard shortcuts (?)"
                aria-label="Keyboard shortcuts"
              >
                <Keyboard className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  reloadAuditLogs();
                  setAuditLogModalOpen(true);
                }}
                className="h-8 w-8 p-0"
                title="Audit logs"
                aria-label="Audit logs"
              >
                <History className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  resetQueue();
                  showToast('Reloaded moderation queue.');
                }}
                className="h-8 w-8 p-0"
                title="Reload moderation queue"
                aria-label="Reload moderation queue"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <AdminTabsNav pendingModerationCount={statusCounts.PENDING_REVIEW} />

          {loadError && (
            <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-500">
              {loadError}
            </p>
          )}

          <ModerationMetrics
            metrics={metrics}
            activeFilter={filterStatus}
            onFilterSelect={setFilterStatus}
          />

          <section className="space-y-2">
            <ModerationFilterBar
              filterStatus={filterStatus}
              statusCounts={statusCounts}
              searchQuery={searchQuery}
              categoryFilter={categoryFilter}
              sortBy={sortBy}
              onFilterStatusChange={setFilterStatus}
              onSearchChange={setSearchQuery}
              onCategoryFilterChange={setCategoryFilter}
              onSortByChange={setSortBy}
            />
            <p className="px-1 text-[11px] text-muted-foreground">
              {!isHydrated
                ? 'Loading moderation queue…'
                : isActing
                  ? 'Saving moderation decision…'
                  : `Showing ${filteredSubmissions.length} of ${submissions.length} submissions`}
            </p>

            {viewMode === 'split' ? (
              <ModerationSplitViewer
                submission={selectedSubmission}
                currentIndex={selectedIndex}
                totalSubmissions={filteredSubmissions.length}
                allSubmissions={filteredSubmissions}
                onSelectSubmission={setSelectedSubmissionId}
                onApprove={handleApprove}
                onRequestReject={handleRequestReject}
                onToggleFlag={handleToggleFlag}
                onToggleCheck={toggleComplianceCheck}
                onNext={goToNextPending}
                onPrev={goToPrevPending}
                onOpenShortcuts={() => setShortcutsModalOpen(true)}
              />
            ) : (
              <ModerationTable
                submissions={filteredSubmissions}
                selectedBatchIds={selectedBatchIds}
                onToggleBatchSelect={toggleBatchSelect}
                onSelectAllBatch={selectAllBatch}
                onClearBatchSelection={clearBatchSelection}
                onInspectSubmission={(id) => {
                  setSelectedSubmissionId(id);
                  setViewMode('split');
                }}
                onApprove={handleApprove}
                onRequestReject={handleRequestReject}
                onToggleFlag={handleToggleFlag}
                onBatchApprove={handleBatchApprove}
                onRequestBatchReject={handleRequestBatchReject}
              />
            )}
          </section>
        </main>

        {/* REJECTION REASON MODAL */}
        <RejectReasonDialog
          open={rejectModalOpen}
          onOpenChange={setRejectModalOpen}
          submission={rejectingSubmission}
          onConfirmReject={handleConfirmReject}
        />

        {/* KEYBOARD SHORTCUTS MODAL */}
        <ModerationShortcutsModal open={shortcutsModalOpen} onOpenChange={setShortcutsModalOpen} />

        {/* AUDIT LOG MODAL */}
        <ModerationAuditLogModal
          open={auditLogModalOpen}
          onOpenChange={setAuditLogModalOpen}
          logs={auditLogs}
        />
      </div>
    </RoleGuard>
  );
}
