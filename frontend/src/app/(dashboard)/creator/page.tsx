'use client';

import React, { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { BarChart3, Clapperboard, Plus, Trophy, Users } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { TenantSwitcherHUD } from '@/components/layout/tenant-switcher-hud';
import { RoleGuard } from '@/components/auth/role-guard';
import { CreatorMetricsCards } from '@/features/submissions/components/creator-metrics-cards';
import { CreatorContestBoard } from '@/features/submissions/components/creator-contest-board';
import { SubmissionsTable } from '@/features/submissions/components/submissions-table';
import {
  UploadModal,
  UploadModalInitialData,
} from '@/features/submissions/components/upload-modal';
import { VideoPreviewModal } from '@/features/submissions/components/video-preview-modal';
import { DeleteSubmissionDialog } from '@/features/submissions/components/delete-submission-dialog';
import {
  deletionErrorMessage,
  useCreatorSubmissions,
} from '@/features/submissions/hooks/use-creator-submissions';
import { CreatorSubmissionItem } from '@/types/creator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type CreatorStudioTab = 'metrics' | 'contests' | 'submissions';

const CREATOR_TABS: {
  id: CreatorStudioTab;
  label: string;
  icon: typeof BarChart3;
}[] = [
  { id: 'metrics', label: 'Performance Overview & Metrics', icon: BarChart3 },
  { id: 'contests', label: 'Contests', icon: Trophy },
  { id: 'submissions', label: 'Your Submissions', icon: Clapperboard },
];

export default function CreatorDashboardPage() {
  const {
    filteredSubmissions,
    filterStatus,
    statusCounts,
    searchQuery,
    categoryFilter,
    sortBy,
    metrics,
    contests,
    selectedContestId,
    activeContest,
    setFilterStatus,
    setSearchQuery,
    setCategoryFilter,
    setSortBy,
    setSelectedContestId,
    addSubmission,
    deleteSubmission,
    reloadSubmissions,
    resetToMockData,
    loadError,
  } = useCreatorSubmissions();

  // Modal states
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadModalInitialData, setUploadModalInitialData] =
    useState<UploadModalInitialData | null>(null);

  const uploadContests = useMemo(
    () =>
      contests
        .filter((contest) => contest.status === 'ACTIVE')
        .map((contest) => ({
          id: contest.id,
          title: contest.title,
          prizePool: contest.prizePool,
        })),
    [contests]
  );

  const [previewSubmission, setPreviewSubmission] = useState<CreatorSubmissionItem | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CreatorSubmissionItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [tab, setTab] = useState<CreatorStudioTab>('metrics');
  const [uploadContestOverride, setUploadContestOverride] = useState<string | null>(null);
  const tabRefs = useRef<Partial<Record<CreatorStudioTab, HTMLButtonElement | null>>>({});

  const preferredContestId =
    uploadContestOverride ?? (activeContest?.status === 'ACTIVE' ? activeContest.id : null);

  // Open fresh upload modal
  const handleOpenNewUpload = () => {
    setUploadContestOverride(null);
    setUploadModalInitialData(null);
    setUploadModalOpen(true);
  };

  const handleSubmitToContest = (contestId: string) => {
    setSelectedContestId(contestId);
    setUploadContestOverride(contestId);
    setUploadModalInitialData(null);
    setUploadModalOpen(true);
  };

  const selectTab = (next: CreatorStudioTab) => {
    setTab(next);
    tabRefs.current[next]?.focus();
  };

  const onTabKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).getAttribute('role') !== 'tab') return;
    const index = CREATOR_TABS.findIndex((item) => item.id === tab);
    if (index < 0) return;
    let nextIndex = index;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % CREATOR_TABS.length;
    else if (event.key === 'ArrowLeft') {
      nextIndex = (index - 1 + CREATOR_TABS.length) % CREATOR_TABS.length;
    } else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = CREATOR_TABS.length - 1;
    else return;
    event.preventDefault();
    selectTab(CREATOR_TABS[nextIndex].id);
  };

  // Open upload modal configured for resubmission
  const handleResubmit = (submission: CreatorSubmissionItem) => {
    setUploadContestOverride(null);
    setUploadModalInitialData({
      resubmitId: submission.id,
      title: submission.title,
      category: submission.category,
      tags: submission.tags,
      description: submission.description,
      contestId: submission.contestId,
    });
    setUploadModalOpen(true);
  };

  // Open preview modal
  const handlePreview = (submission: CreatorSubmissionItem) => {
    setPreviewSubmission(submission);
    setPreviewModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteSubmission(deleteTarget.id);
      if (previewSubmission?.id === deleteTarget.id) {
        setPreviewModalOpen(false);
        setPreviewSubmission(null);
      }
      setDeleteTarget(null);
    } catch (error: unknown) {
      setDeleteError(deletionErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  // Handle upload completion
  const handleUploadSuccess = (data: { submission: CreatorSubmissionItem }) => {
    addSubmission(data.submission);
    reloadSubmissions();
  };

  return (
    <RoleGuard route="/creator">
      <div className="relative flex min-h-screen w-full flex-col bg-background text-foreground antialiased selection:bg-primary/20">
        {/* TOP UNIFIED APPLICATION BAR */}
        <AppHeader onOpenUploadModal={handleOpenNewUpload} />

        {/* FLOATING TENANT SWITCHER HUD */}
        <TenantSwitcherHUD />

        {/* DASHBOARD CONTAINER */}
        <main className="mx-auto w-full max-w-7xl flex-1 space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {/* HERO TITLE & ACTION ROW */}
          <div className="flex flex-col justify-between gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                  Creator Studio
                </h1>
                <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                  PRO
                </span>
              </div>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Manage your competition short videos, monitor real-time community scores, and submit
                new contest entries.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button asChild variant="outline" className="gap-2 text-xs font-semibold sm:text-sm">
                <Link href="/creator/friends">
                  <Users className="h-4 w-4" />
                  <span>Friends</span>
                </Link>
              </Button>
              <Button
                onClick={handleOpenNewUpload}
                className="gap-2 bg-primary text-xs font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary-hover active:scale-[0.98] sm:text-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Submit New Entry</span>
              </Button>
            </div>
          </div>

          {loadError ? (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {loadError}
            </p>
          ) : null}

          <div
            role="tablist"
            aria-label="Creator studio sections"
            onKeyDown={onTabKeyDown}
            className="flex gap-1 overflow-x-auto rounded-xl border border-border/80 bg-muted/50 p-1"
          >
            {CREATOR_TABS.map((item) => {
              const selected = tab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  ref={(node) => {
                    tabRefs.current[item.id] = node;
                  }}
                  id={`creator-tab-${item.id}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`creator-panel-${item.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setTab(item.id)}
                  className={cn(
                    'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-all duration-200 sm:text-sm',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    selected
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-background/60 hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="whitespace-nowrap">{item.label}</span>
                  {item.id === 'submissions' ? (
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                        selected ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {statusCounts.ALL}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <section
            role="tabpanel"
            id="creator-panel-metrics"
            aria-labelledby="creator-tab-metrics"
            hidden={tab !== 'metrics'}
            className={cn(tab === 'metrics' && 'duration-200 animate-in fade-in')}
          >
            <CreatorMetricsCards
              metrics={metrics}
              onFilterStatusSelect={(status) => {
                setFilterStatus(status);
                setTab('submissions');
              }}
            />
          </section>

          <section
            role="tabpanel"
            id="creator-panel-contests"
            aria-labelledby="creator-tab-contests"
            hidden={tab !== 'contests'}
            className={cn(tab === 'contests' && 'duration-200 animate-in fade-in')}
          >
            <CreatorContestBoard
              contests={contests}
              selectedId={selectedContestId}
              onSelect={setSelectedContestId}
              onSubmitEntry={handleSubmitToContest}
            />
          </section>

          <section
            role="tabpanel"
            id="creator-panel-submissions"
            aria-labelledby="creator-tab-submissions"
            aria-label="Creator Submissions Table"
            hidden={tab !== 'submissions'}
            className={cn('space-y-4', tab === 'submissions' && 'duration-200 animate-in fade-in')}
          >
            <p className="text-xs text-muted-foreground">
              Track moderation review status, evaluator scores, and contest ranking.
            </p>

            <SubmissionsTable
              submissions={filteredSubmissions}
              filterStatus={filterStatus}
              statusCounts={statusCounts}
              searchQuery={searchQuery}
              categoryFilter={categoryFilter}
              sortBy={sortBy}
              onFilterStatusChange={setFilterStatus}
              onSearchChange={setSearchQuery}
              onCategoryFilterChange={setCategoryFilter}
              onSortByChange={setSortBy}
              onPreview={handlePreview}
              onResubmit={handleResubmit}
              onDelete={(item) => {
                setDeleteError(null);
                setDeleteTarget(item);
              }}
              onOpenUploadModal={handleOpenNewUpload}
              onResetMockData={resetToMockData}
            />
          </section>
        </main>

        {/* UPLOAD / RESUBMIT MODAL */}
        <UploadModal
          open={uploadModalOpen}
          onOpenChange={setUploadModalOpen}
          initialData={uploadModalInitialData}
          contests={uploadContests}
          preferredContestId={preferredContestId}
          onSubmitSuccess={handleUploadSuccess}
        />

        {/* VIDEO PREVIEW MODAL */}
        <VideoPreviewModal
          submission={previewSubmission}
          open={previewModalOpen}
          onOpenChange={setPreviewModalOpen}
          onResubmit={handleResubmit}
        />

        <DeleteSubmissionDialog
          title={deleteTarget?.title ?? null}
          open={deleteTarget !== null}
          deleting={deleting}
          error={deleteError}
          onOpenChange={(open) => {
            if (!open) {
              setDeleteTarget(null);
              setDeleteError(null);
            }
          }}
          onConfirm={() => {
            void handleConfirmDelete();
          }}
        />
      </div>
    </RoleGuard>
  );
}
