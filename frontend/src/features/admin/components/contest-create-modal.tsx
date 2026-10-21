'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Layers,
  Sparkles,
  Calendar,
  DollarSign,
  Award,
  Crown,
  Medal,
  Settings,
  FileText,
  Video,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  Plus,
  Globe,
  Tag,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Upload,
  Trash2,
  Loader2,
} from 'lucide-react';
import {
  ContestConfigItem,
  TenantBrandConfig,
  ContestLifecycleStatus,
  PrizeDistributionItem,
  MediaConstraintsConfig,
} from '@/types/tenant';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ContestPresentation } from '@/features/contests/components/contest-presentation';
import {
  DEFAULT_CONTEST_BANNER_URL,
  resolveBannerContentType,
  validateBannerFile,
} from '@/features/contests/lib/contest-banner';
import { ContestBannerCropModal } from '@/features/contests/components/contest-banner-crop-modal';
import {
  contestTimeZoneOptions,
  defaultContestSchedule,
  detectContestTimeZone,
  utcToZonedWallTime,
  validateContestWallSchedule,
  zonedWallTimeToUtc,
} from '@/features/contests/lib/contest-schedule';
import { putFileToPresignedUrl, uploadFailureMessage } from '@/features/submissions/lib/s3-upload';
import { presignContestBanner } from '@/services/contests-api';

interface ContestCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brands: TenantBrandConfig[];
  activeBrandId?: string;
  editContest?: ContestConfigItem | null;
  onSaveContest: (
    contestData: Omit<
      ContestConfigItem,
      'id' | 'createdAt' | 'updatedAt' | 'entriesCount' | 'votesCount'
    >
  ) => void | Promise<{ ok: boolean; message?: string } | void>;
  onUpdateContest?: (
    contestId: string,
    updates: Partial<ContestConfigItem>
  ) => void | Promise<{ ok: boolean; message?: string } | void>;
}

export function ContestCreateModal({
  open,
  onOpenChange,
  brands,
  activeBrandId,
  editContest,
  onSaveContest,
  onUpdateContest,
}: ContestCreateModalProps) {
  // Active Wizard Step (1: Identity, 2: Schedule, 3: Constraints & Rules, 4: Prize Pool, 5: Review & Publish)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form Fields State
  const [tenantId, setTenantId] = useState<string>(activeBrandId || brands[0]?.id || 'woofskis');
  const [title, setTitle] = useState<string>('');
  const [tagline, setTagline] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [bannerObjectKey, setBannerObjectKey] = useState<string | null>(null);
  const [legacyBannerUrl, setLegacyBannerUrl] = useState<string | null>(null);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null);
  const [bannerUploadError, setBannerUploadError] = useState<string | null>(null);
  const [bannerUploadPercent, setBannerUploadPercent] = useState<number | null>(null);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [pendingCropFile, setPendingCropFile] = useState<File | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const bannerPreviewRef = useRef<string | null>(null);
  const formSession = useRef<string | null>(null);

  // Schedule. Wall-clock values are interpreted in timeZone.
  const [timeZone, setTimeZone] = useState<string>(() => detectContestTimeZone());
  const [startDate, setStartDate] = useState<string>('');
  const [deadlineDate, setDeadlineDate] = useState<string>('');
  const [votingCloseDate, setVotingCloseDate] = useState<string>('');

  // Categories & Constraints
  const [categories, setCategories] = useState<string[]>([]);
  const [rules, setRules] = useState<string>('');
  const [maxDurationSeconds, setMaxDurationSeconds] = useState<number>(60);
  const [minDurationSeconds, setMinDurationSeconds] = useState<number>(5);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1' | 'all'>('9:16');
  const [maxFileSizeMb, setMaxFileSizeMb] = useState<number>(100);

  // Prize Pool
  const [totalPrizePool, setTotalPrizePool] = useState<number>(25000);
  const [currency, setCurrency] = useState<string>('USD');
  const [p1Percentage, setP1Percentage] = useState<number>(50);
  const [p2Percentage, setP2Percentage] = useState<number>(25);
  const [p3Percentage, setP3Percentage] = useState<number>(15);
  const [pCommunityPercentage, setPCommunityPercentage] = useState<number>(10);

  // Lifecycle Status Choice
  const [status, setStatus] = useState<ContestLifecycleStatus>('DRAFT');

  const replaceBannerPreview = (next: string | null) => {
    if (bannerPreviewRef.current) URL.revokeObjectURL(bannerPreviewRef.current);
    bannerPreviewRef.current = next;
    setBannerPreviewUrl(next);
  };

  useEffect(() => {
    return () => {
      if (bannerPreviewRef.current) URL.revokeObjectURL(bannerPreviewRef.current);
    };
  }, []);

  // Initialize once per open session. Later brand-list refreshes must not
  // wipe a date or banner the admin has already chosen.
  useEffect(() => {
    if (!open) {
      formSession.current = null;
      return;
    }
    const session = editContest?.id ?? 'new';
    if (formSession.current === session) return;
    formSession.current = session;
    replaceBannerPreview(null);
    setBannerUploadError(null);
    setBannerUploadPercent(null);
    setPendingCropFile(null);
    setIsCropModalOpen(false);

    if (editContest) {
      const zone = editContest.timezone || detectContestTimeZone();
      const wall = (value: string) =>
        value ? utcToZonedWallTime(new Date(value), zone) || '' : '';
      setTenantId(editContest.tenantId);
      setTitle(editContest.title);
      setTagline(editContest.tagline || '');
      setDescription(editContest.description);
      setBannerObjectKey(editContest.bannerObjectKey ?? null);
      setLegacyBannerUrl(editContest.bannerObjectKey ? null : editContest.bannerUrl || null);
      setThumbnailUrl(editContest.thumbnailUrl || '');
      setTimeZone(zone);
      setStartDate(wall(editContest.startDate));
      setDeadlineDate(wall(editContest.deadlineDate));
      setVotingCloseDate(wall(editContest.votingCloseDate));
      setCategories(editContest.categories || []);
      setRules(editContest.rules || '');
      setMaxDurationSeconds(editContest.mediaConstraints?.maxDurationSeconds || 60);
      setMinDurationSeconds(editContest.mediaConstraints?.minDurationSeconds || 5);
      setAspectRatio(editContest.mediaConstraints?.aspectRatio || '9:16');
      setMaxFileSizeMb(editContest.mediaConstraints?.maxFileSizeMb || 100);
      setTotalPrizePool(editContest.prizePool.total);
      setCurrency(editContest.prizePool.currency);
      setStatus(editContest.status);

      const d = editContest.prizePool.distribution;
      if (d && d.length >= 3) {
        setP1Percentage(d[0]?.percentage || 50);
        setP2Percentage(d[1]?.percentage || 25);
        setP3Percentage(d[2]?.percentage || 15);
        setPCommunityPercentage(d[3]?.percentage || 10);
      }
      setCurrentStep(1);
    } else {
      const defaultTenant = activeBrandId || brands[0]?.id || 'woofskis';
      const zone = detectContestTimeZone();
      const schedule = defaultContestSchedule(zone);
      setTenantId(defaultTenant);
      setTitle('');
      setTagline('');
      setDescription('');
      setBannerObjectKey(null);
      setLegacyBannerUrl(null);
      setThumbnailUrl('');
      setTimeZone(zone);
      setStartDate(schedule.startDate);
      setDeadlineDate(schedule.deadlineDate);
      setVotingCloseDate(schedule.votingCloseDate);
      setCategories([]);
      setRules('');
      setMaxDurationSeconds(60);
      setMinDurationSeconds(5);
      setAspectRatio('9:16');
      setMaxFileSizeMb(100);
      setTotalPrizePool(25000);
      setCurrency('USD');
      setP1Percentage(50);
      setP2Percentage(25);
      setP3Percentage(15);
      setPCommunityPercentage(10);
      setStatus('DRAFT');
      setCurrentStep(1);
    }
  }, [editContest, open, activeBrandId, brands]);

  // Selected brand object
  const selectedBrand = brands.find((b) => b.id === tenantId) || brands[0];


  // Calculated prize values
  const p1Amount = Math.round((totalPrizePool * p1Percentage) / 100);
  const p2Amount = Math.round((totalPrizePool * p2Percentage) / 100);
  const p3Amount = Math.round((totalPrizePool * p3Percentage) / 100);
  const pCommunityAmount = Math.round((totalPrizePool * pCommunityPercentage) / 100);
  const totalPercentage = p1Percentage + p2Percentage + p3Percentage + pCommunityPercentage;

  const scheduleErrors = validateContestWallSchedule(
    {
      timeZone,
      submissionOpen: startDate,
      submissionDeadline: deadlineDate,
      votingClosure: votingCloseDate,
    },
    { checkSubmissionOpenAgainstNow: true }
  );
  const scheduleInvalid = Object.values(scheduleErrors).some(Boolean);

  const uploadBanner = async (file: File) => {
    const validation = validateBannerFile(file);
    if (validation) {
      setBannerUploadError(validation);
      return;
    }
    const contentType = resolveBannerContentType(file);
    if (!contentType) {
      setBannerUploadError('Choose a JPEG, PNG, WebP, or GIF image.');
      return;
    }
    setBannerUploadError(null);
    setBannerUploading(true);
    setBannerUploadPercent(0);
    const localPreview = URL.createObjectURL(file);
    replaceBannerPreview(localPreview);
    try {
      const envelope = await presignContestBanner({
        contentType,
        fileSizeBytes: file.size,
      });
      if (!envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Could not prepare the banner upload');
      }
      await putFileToPresignedUrl(
        envelope.data,
        file,
        (progress) => setBannerUploadPercent(progress.percent),
        'Contest banner upload failed'
      );
      setBannerObjectKey(envelope.data.objectKey);
      setLegacyBannerUrl(null);
      setBannerUploadPercent(100);
    } catch (error) {
      replaceBannerPreview(null);
      setBannerObjectKey(null);
      setBannerUploadError(uploadFailureMessage(error));
      setBannerUploadPercent(null);
    } finally {
      setBannerUploading(false);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  };

  const removeBanner = () => {
    replaceBannerPreview(null);
    setBannerObjectKey(null);
    setLegacyBannerUrl(null);
    setBannerUploadError(null);
    setBannerUploadPercent(null);
    setPendingCropFile(null);
    setIsCropModalOpen(false);
  };

  const handleSelectBannerFile = (file: File) => {
    const validation = validateBannerFile(file);
    if (validation) {
      setBannerUploadError(validation);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
      return;
    }
    setBannerUploadError(null);
    setPendingCropFile(file);
    setIsCropModalOpen(true);
  };

  const handleApplyCrop = async (croppedFile: File) => {
    setIsCropModalOpen(false);
    setPendingCropFile(null);
    await uploadBanner(croppedFile);
  };

  const handleCancelCrop = () => {
    setIsCropModalOpen(false);
    setPendingCropFile(null);
    if (bannerInputRef.current) bannerInputRef.current.value = '';
  };

  // Final submit
  const hasValidBanner = Boolean(bannerObjectKey || legacyBannerUrl);

  // Final submit
  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('Please enter a contest title.');
      setCurrentStep(1);
      return;
    }
    if (!hasValidBanner) {
      setBannerUploadError('A custom banner upload is mandatory before publishing.');
      alert('A custom banner upload is mandatory before publishing.');
      setCurrentStep(1);
      return;
    }
    if (bannerUploading) {
      setBannerUploadError('Wait for the banner upload to finish.');
      setCurrentStep(1);
      return;
    }
    if (scheduleErrors.submissionOpen) {
      alert(scheduleErrors.submissionOpen);
      setCurrentStep(2);
      return;
    }
    if (scheduleInvalid) {
      setCurrentStep(2);
      return;
    }

    const locked =
      editContest &&
      (editContest.status === 'ACTIVE' ||
        editContest.status === 'JUDGING' ||
        editContest.status === 'COMPLETED' ||
        editContest.status === 'ARCHIVED');
    if (locked) {
      alert(
        'Contest settings cannot be modified once the contest is ACTIVE. Use the lifecycle action to move status forward.'
      );
      return;
    }

    const prizeDistribution: PrizeDistributionItem[] = [
      {
        id: 'rank_1',
        rank: '1st Place',
        label: 'Grand Champion (Gold)',
        percentage: p1Percentage,
        amount: p1Amount,
        badgeColor: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
        iconName: 'Crown',
      },
      {
        id: 'rank_2',
        rank: '2nd Place',
        label: 'Runner-Up (Silver)',
        percentage: p2Percentage,
        amount: p2Amount,
        badgeColor: 'text-slate-300 bg-slate-400/15 border-slate-400/30',
        iconName: 'Medal',
      },
      {
        id: 'rank_3',
        rank: '3rd Place',
        label: 'Podium Finalist (Bronze)',
        percentage: p3Percentage,
        amount: p3Amount,
        badgeColor: 'text-orange-400 bg-orange-500/15 border-orange-500/30',
        iconName: 'Medal',
      },
    ];

    if (pCommunityPercentage > 0) {
      prizeDistribution.push({
        id: 'rank_community',
        rank: 'Top 4-10',
        label: 'Community Mention Pool',
        percentage: pCommunityPercentage,
        amount: pCommunityAmount,
        badgeColor: 'text-primary bg-primary/15 border-primary/30',
        iconName: 'Sparkles',
      });
    }

    const mediaConstraints: MediaConstraintsConfig = {
      maxDurationSeconds,
      minDurationSeconds,
      aspectRatio,
      maxFileSizeMb,
      allowedFormats: ['mp4', 'mov', 'webm'],
      resolutionRecommendation:
        aspectRatio === '9:16'
          ? '1080x1920 (9:16 Vertical Full HD)'
          : '1920x1080 (16:9 Widescreen)',
    };

    const selectedOrganizationId = brands.find(
      (brand) => brand.id === tenantId || brand.slug === tenantId
    )?.organizationId;

    const submissionOpenAt = zonedWallTimeToUtc(startDate, timeZone);
    const submissionDeadlineAt = zonedWallTimeToUtc(deadlineDate, timeZone);
    const votingClosesAt = zonedWallTimeToUtc(votingCloseDate, timeZone);
    if (!submissionOpenAt || !submissionDeadlineAt || !votingClosesAt) {
      setCurrentStep(2);
      return;
    }

    const contestPayload = {
      tenantId,
      organizationId: selectedOrganizationId,
      title: title.trim(),
      tagline: tagline.trim() || undefined,
      description:
        description.trim() || `Official ${title} challenge on ${selectedBrand?.name || 'COS'}.`,
      bannerUrl: bannerObjectKey ? null : legacyBannerUrl,
      bannerObjectKey,
      thumbnailUrl,
      timezone: timeZone,
      categories,
      rules: rules.trim(),
      startDate: submissionOpenAt.toISOString(),
      deadlineDate: submissionDeadlineAt.toISOString(),
      votingCloseDate: votingClosesAt.toISOString(),
      mediaConstraints,
      prizePool: {
        total: totalPrizePool,
        currency,
        distribution: prizeDistribution,
      },
      status: 'DRAFT' as ContestLifecycleStatus,
      featured: true,
    };

    const outcome =
      editContest && onUpdateContest
        ? await onUpdateContest(editContest.id, contestPayload)
        : await onSaveContest(contestPayload);

    if (outcome && outcome.ok === false) {
      alert(outcome.message || 'Contest request failed');
      return;
    }

    onOpenChange(false);
  };

  const timeZoneChoices = useMemo(() => contestTimeZoneOptions(timeZone), [timeZone]);
  const displayedBanner =
    bannerPreviewUrl ||
    (bannerObjectKey ? editContest?.bannerUrl : legacyBannerUrl) ||
    null;
  const usingCustomBanner = Boolean(displayedBanner);
  const submissionOpenAt = zonedWallTimeToUtc(startDate, timeZone);
  const submissionDeadlineAt = zonedWallTimeToUtc(deadlineDate, timeZone);
  const votingClosesAt = zonedWallTimeToUtc(votingCloseDate, timeZone);
  const previewContest = {
    title: title.trim() || 'Untitled contest',
    description:
      description.trim() ||
      `Official ${title || 'contest'} challenge on ${selectedBrand?.name || 'Woofskis'}.`,
    tagline,
    status: status || 'DRAFT',
    bannerUrl: displayedBanner,
    submissionOpenAt: submissionOpenAt?.toISOString() ?? null,
    submissionDeadlineAt: submissionDeadlineAt?.toISOString() ?? null,
    votingClosesAt: votingClosesAt?.toISOString() ?? null,
    timezone: timeZone,
    categoryName: categories[0],
    prizeSummary: `${totalPrizePool} ${currency}`,
  };

  const goToStep = (next: number) => {
    if (next > 1 && !hasValidBanner) {
      setBannerUploadError('A custom banner upload is mandatory before proceeding.');
      alert('A custom banner upload is mandatory before proceeding.');
      setCurrentStep(1);
      return;
    }
    if (next > 1 && bannerUploading) {
      setBannerUploadError('Wait for the banner upload to finish.');
      setCurrentStep(1);
      return;
    }
    if (currentStep === 2 && next > currentStep) {
      if (scheduleErrors.submissionOpen) {
        alert(scheduleErrors.submissionOpen);
        return;
      }
      if (scheduleInvalid) return;
    }
    if (next > 2 && scheduleInvalid) {
      if (scheduleErrors.submissionOpen) {
        alert(scheduleErrors.submissionOpen);
      }
      setCurrentStep(2);
      return;
    }
    setCurrentStep(next);
  };

  const steps = [
    { num: 1, label: 'Identity & Brand', icon: Globe },
    { num: 2, label: 'Timeline & Dates', icon: Calendar },
    { num: 3, label: 'Rules & Media', icon: Video },
    { num: 4, label: 'Prize Pool', icon: DollarSign },
    { num: 5, label: 'Review & Publish', icon: Award },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-[calc(100vw-0.5rem)] max-w-3xl flex-col overflow-hidden bg-card p-0 text-foreground sm:h-auto sm:max-h-[92dvh] sm:w-full [&_input]:max-w-full [&_select]:max-w-full [&_textarea]:max-w-full">
        {/* MODAL HEADER */}
        <DialogHeader className="shrink-0 border-b border-border/60 bg-muted/20 px-4 pb-3 pr-12 pt-4 sm:px-6 sm:pb-4 sm:pt-5">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent/40 bg-primary text-white shadow-md shadow-primary/20">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-black tracking-tight text-foreground sm:text-lg">
                  {editContest
                    ? 'Edit Contest Lifecycle Settings'
                    : 'Create & Schedule New Contest'}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Configure brand association, submission constraints, prize distribution, and
                  lifecycle state.
                </DialogDescription>
              </div>
            </div>

            {/* Target Brand Pill */}
            {selectedBrand && (
              <span
                className="shadow-xs hidden items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold sm:inline-flex"
                style={{
                  backgroundColor: `${selectedBrand.colors.primary}15`,
                  color: selectedBrand.colors.primary,
                  borderColor: `${selectedBrand.colors.primary}30`,
                }}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: selectedBrand.colors.primary }}
                />
                <span>{selectedBrand.name}</span>
              </span>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
                Step {currentStep} of {steps.length}
              </p>
              <p className="truncate text-xs font-semibold text-foreground">
                {steps[currentStep - 1]?.label}
              </p>
            </div>
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={steps.length}
              aria-valuenow={currentStep}
              aria-label={`Step ${currentStep} of ${steps.length}`}
            >
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(currentStep / steps.length) * 100}%` }}
              />
            </div>
            <ol className="hidden items-center gap-2 md:flex">
              {steps.map((step, index) => {
                const isCurrent = currentStep === step.num;
                const isPast = currentStep > step.num;
                return (
                  <li key={step.num} className="flex min-w-0 flex-1 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => goToStep(step.num)}
                      className="flex min-w-0 items-center gap-2 text-left"
                    >
                      <span
                        className={cn(
                          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                          isCurrent && 'bg-primary text-primary-foreground',
                          isPast && 'bg-accent text-accent-foreground',
                          !isCurrent && !isPast && 'bg-muted text-muted-foreground'
                        )}
                      >
                        {isPast ? <Check className="h-3.5 w-3.5" /> : step.num}
                      </span>
                      <span
                        className={cn(
                          'truncate text-[11px] font-semibold',
                          isCurrent ? 'text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {step.label}
                      </span>
                    </button>
                    {index < steps.length - 1 ? (
                      <span
                        className={cn('h-px min-w-3 flex-1', isPast ? 'bg-primary' : 'bg-border')}
                      />
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </div>
        </DialogHeader>

        {/* MODAL BODY (STEP CONTENT) */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4 text-sm sm:px-6 sm:py-5">
          {/* STEP 1: BRAND IDENTITY & DETAILS */}
          {currentStep === 1 && (
            <div className="space-y-4 duration-200 animate-in fade-in">
              {/* Title & Tagline */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Contest Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="e.g. Season 01: Comedy & Short Entertainment Challenge"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Tagline / Hook</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. Submit your funniest 60-second skit or standup punchline"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Detailed Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the challenge theme, submission requirements, and judging evaluation..."
                    className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-foreground">Contest Banner *</label>
                  <span className="text-[11px] font-semibold text-amber-500">Custom Upload Required</span>
                </div>
                <div
                  className={cn(
                    'relative flex h-36 w-full flex-col items-center justify-center overflow-hidden rounded-xl border sm:h-44',
                    displayedBanner
                      ? 'border-border bg-muted/30'
                      : 'border-dashed border-amber-500/50 bg-amber-500/5 p-4 text-center'
                  )}
                >
                  {displayedBanner ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={displayedBanner}
                      alt="Contest banner preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                        <Upload className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Custom Banner Required</p>
                        <p className="text-[11px] text-muted-foreground">
                          Upload a custom banner image. Progression and publishing are blocked until uploaded.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleSelectBannerFile(file);
                  }}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={bannerUploading}
                    onClick={() => bannerInputRef.current?.click()}
                    className="gap-1.5 text-xs font-bold"
                  >
                    {bannerUploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    <span>{displayedBanner ? 'Replace banner' : 'Upload banner (Mandatory)'}</span>
                  </Button>
                  {displayedBanner ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={bannerUploading}
                      onClick={removeBanner}
                      className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove</span>
                    </Button>
                  ) : (
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      A custom banner upload is mandatory before proceeding.
                    </span>
                  )}
                </div>
                {bannerUploadPercent !== null && bannerUploading ? (
                  <p className="text-xs font-semibold text-foreground">
                    Uploading {bannerUploadPercent}%
                  </p>
                ) : null}
                {bannerUploadError ? (
                  <p className="text-xs font-semibold text-destructive">{bannerUploadError}</p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    JPEG, PNG, WebP, or GIF. Maximum size 100MB. Progression is blocked until a valid banner is uploaded.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: SCHEDULE & TIMELINE */}
          {currentStep === 2 && (
            <div className="space-y-5 duration-200 animate-in fade-in">
              <div className="flex items-center gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-foreground">
                <Clock className="h-4 w-4 shrink-0 text-primary" />
                <span>
                  Configure the 3 critical lifecycle phases: <strong>Submission Window</strong>,{' '}
                  <strong>Voting & Consensus Window</strong>, and{' '}
                  <strong>Final Winner Announcement</strong>.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground" htmlFor="contest-timezone">
                  Contest timezone
                </label>
                <select
                  id="contest-timezone"
                  value={timeZone}
                  onChange={(event) => setTimeZone(event.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  {timeZoneChoices.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Submission opening, the submission deadline, and voting closure are entered in{' '}
                  {timeZone}. They are stored as absolute timestamps.
                </p>
                {scheduleErrors.timeZone ? (
                  <p className="text-xs font-semibold text-destructive">
                    {scheduleErrors.timeZone}
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* 1. Start Date */}
                <div className="space-y-2 rounded-xl border border-border bg-background/80 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Submissions Open</span>
                  </div>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    aria-invalid={Boolean(scheduleErrors.submissionOpen)}
                    className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                  <span className="block text-[10px] text-muted-foreground">
                    Creators can begin submitting 9:16 entries. Defaults to today in {timeZone}.
                  </span>
                  {scheduleErrors.submissionOpen ? (
                    <p className="text-xs font-semibold text-destructive">
                      {scheduleErrors.submissionOpen}
                    </p>
                  ) : null}
                </div>

                {/* 2. Submission Deadline */}
                <div className="space-y-2 rounded-xl border border-border bg-background/80 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    <span>Submission Deadline</span>
                  </div>
                  <input
                    type="datetime-local"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    aria-invalid={Boolean(scheduleErrors.submissionDeadline)}
                    className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                  <span className="block text-[10px] text-muted-foreground">
                    Intake locks; voting stays active.
                  </span>
                  {scheduleErrors.submissionDeadline ? (
                    <p className="text-xs font-semibold text-destructive">
                      {scheduleErrors.submissionDeadline}
                    </p>
                  ) : null}
                </div>

                {/* 3. Voting Closure */}
                <div className="space-y-2 rounded-xl border border-border bg-background/80 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Award className="h-3.5 w-3.5 text-primary" />
                    <span>Voting Closure</span>
                  </div>
                  <input
                    type="datetime-local"
                    value={votingCloseDate}
                    onChange={(e) => setVotingCloseDate(e.target.value)}
                    aria-invalid={Boolean(scheduleErrors.votingClosure)}
                    className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                  <span className="block text-[10px] text-muted-foreground">
                    Scores sealed and prizes ready for payout.
                  </span>
                  {scheduleErrors.votingClosure ? (
                    <p className="text-xs font-semibold text-destructive">
                      {scheduleErrors.votingClosure}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Calculated Duration Summary */}
              <div className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-muted/30 p-3.5 text-xs sm:grid-cols-2">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Submission Window Duration
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {submissionOpenAt && submissionDeadlineAt
                      ? `${Math.max(
                          0,
                          Math.round(
                            (submissionDeadlineAt.getTime() - submissionOpenAt.getTime()) /
                              (1000 * 60 * 60 * 24)
                          )
                        )} Days Intake`
                      : '—'}
                  </span>
                </div>

                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Voting Consensus Phase
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {submissionDeadlineAt && votingClosesAt
                      ? `${Math.max(
                          0,
                          Math.round(
                            (votingClosesAt.getTime() - submissionDeadlineAt.getTime()) /
                              (1000 * 60 * 60 * 24)
                          )
                        )} Days Final Review`
                      : '—'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: RULES & MEDIA CONSTRAINTS */}
          {currentStep === 3 && (
            <div className="space-y-5 duration-200 animate-in fade-in">
              {/* Video Constraints */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1.5 rounded-xl border border-border bg-background/80 p-3">
                  <label className="font-bold text-foreground">Max Duration</label>
                  <select
                    value={maxDurationSeconds}
                    onChange={(e) => setMaxDurationSeconds(parseInt(e.target.value))}
                    className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value={15}>15 Seconds</option>
                    <option value={30}>30 Seconds</option>
                    <option value={60}>60 Seconds (Standard)</option>
                    <option value={90}>90 Seconds</option>
                    <option value={120}>120 Seconds (2 min)</option>
                  </select>
                </div>

                <div className="space-y-1.5 rounded-xl border border-border bg-background/80 p-3">
                  <label className="font-bold text-foreground">Aspect Ratio</label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as any)}
                    className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="9:16">9:16 Vertical (TikTok/Reels/Shorts)</option>
                    <option value="16:9">16:9 Landscape (Widescreen)</option>
                    <option value="1:1">1:1 Square</option>
                    <option value="all">Any Aspect Ratio</option>
                  </select>
                </div>

                <div className="space-y-1.5 rounded-xl border border-border bg-background/80 p-3">
                  <label className="font-bold text-foreground">Max Upload Size</label>
                  <select
                    value={maxFileSizeMb}
                    onChange={(e) => setMaxFileSizeMb(parseInt(e.target.value))}
                    className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value={50}>50 MB</option>
                    <option value={100}>100 MB (Recommended)</option>
                    <option value={200}>200 MB (High Bitrate)</option>
                    <option value={500}>500 MB (4K Raw)</option>
                  </select>
                </div>
              </div>

              {/* Rules Markdown Editor */}
              <div className="space-y-1.5">
                <label className="font-bold text-foreground">
                  Contest Rules & Submission Guidelines
                </label>
                <textarea
                  rows={6}
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                  placeholder="Enter official contest rules, guidelines, and evaluation criteria for creators..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {/* STEP 4: PRIZE POOL & REWARDS */}
          {currentStep === 4 && (
            <div className="space-y-5 duration-200 animate-in fade-in">
              {/* Total Pool Input */}
              <div className="space-y-3 rounded-xl border border-border bg-card p-4">
                <div className="flex flex-col justify-between gap-3 border-b border-border/60 pb-3 sm:flex-row sm:items-center">
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <DollarSign className="h-4 w-4 text-emerald-500" />
                      Total Guaranteed Prize Purse
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Funds allocated to top rank finishers upon voting consensus closure
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CAD">CAD ($)</option>
                    </select>

                    <div className="relative">
                      <input
                        type="number"
                        min="100"
                        step="500"
                        value={totalPrizePool}
                        onChange={(e) =>
                          setTotalPrizePool(Math.max(0, parseInt(e.target.value) || 0))
                        }
                        className="w-36 rounded-xl border border-border bg-background px-3 py-1.5 font-mono text-sm font-black text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Rank Split Breakdown with Interactive Sliders */}
                <div className="space-y-3 pt-1">
                  {/* 1st Place */}
                  <div className="space-y-1.5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-amber-500" />
                        <span className="font-bold text-foreground">1st Place (Gold Champion)</span>
                      </div>
                      <div className="font-mono font-bold text-amber-500">
                        {p1Percentage}% • ${p1Amount.toLocaleString()} {currency}
                      </div>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="90"
                      value={p1Percentage}
                      onChange={(e) => setP1Percentage(parseInt(e.target.value))}
                      className="h-1.5 w-full accent-amber-500"
                    />
                  </div>

                  {/* 2nd Place */}
                  <div className="space-y-1.5 rounded-xl border border-slate-400/30 bg-slate-400/5 p-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Medal className="h-4 w-4 text-slate-300" />
                        <span className="font-bold text-foreground">
                          2nd Place (Silver Finalist)
                        </span>
                      </div>
                      <div className="font-mono font-bold text-slate-300">
                        {p2Percentage}% • ${p2Amount.toLocaleString()} {currency}
                      </div>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      value={p2Percentage}
                      onChange={(e) => setP2Percentage(parseInt(e.target.value))}
                      className="h-1.5 w-full accent-slate-400"
                    />
                  </div>

                  {/* 3rd Place */}
                  <div className="space-y-1.5 rounded-xl border border-orange-500/30 bg-orange-500/5 p-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Medal className="h-4 w-4 text-orange-400" />
                        <span className="font-bold text-foreground">
                          3rd Place (Bronze Finalist)
                        </span>
                      </div>
                      <div className="font-mono font-bold text-orange-400">
                        {p3Percentage}% • ${p3Amount.toLocaleString()} {currency}
                      </div>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="30"
                      value={p3Percentage}
                      onChange={(e) => setP3Percentage(parseInt(e.target.value))}
                      className="h-1.5 w-full accent-orange-500"
                    />
                  </div>

                  {/* Community Mention Pool */}
                  <div className="space-y-1.5 rounded-xl border border-primary/30 bg-primary/5 p-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="font-bold text-foreground">
                          Community Mentions (Top 4-10)
                        </span>
                      </div>
                      <div className="font-mono font-bold text-primary">
                        {pCommunityPercentage}% • ${pCommunityAmount.toLocaleString()} {currency}
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={pCommunityPercentage}
                      onChange={(e) => setPCommunityPercentage(parseInt(e.target.value))}
                      className="h-1.5 w-full accent-primary"
                    />
                  </div>
                </div>

                {/* Balance validation */}
                <div
                  className={cn(
                    'flex items-center justify-between rounded-xl border p-2.5 font-mono text-xs font-bold',
                    totalPercentage === 100
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                      : 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                  )}
                >
                  <span>Allocation Total: {totalPercentage}%</span>
                  <span>
                    ${(p1Amount + p2Amount + p3Amount + pCommunityAmount).toLocaleString()}{' '}
                    {currency}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & PUBLISH */}
          {currentStep === 5 && (
            <div className="space-y-5 duration-200 animate-in fade-in">
              <ContestPresentation contest={previewContest} />

              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <span className="block text-xs font-bold text-foreground">Lifecycle</span>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  New contests are created as DRAFT. Move DRAFT to SCHEDULED, then ACTIVE, JUDGING,
                  COMPLETED, and ARCHIVED from the contest list. Settings lock once the contest is
                  ACTIVE.
                </p>
                {editContest && (
                  <p className="mt-2 font-mono text-[10px] font-bold text-foreground">
                    Current status: {status}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER & STEPPER ACTIONS */}
        <DialogFooter className="flex w-full shrink-0 flex-row items-center justify-between gap-2 border-t border-border/60 bg-muted/30 px-4 py-3 sm:justify-between sm:px-6 sm:py-3.5">
          <div>
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="gap-1 text-xs font-semibold"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs text-muted-foreground"
            >
              Cancel
            </Button>

            {currentStep < 5 ? (
              <Button
                type="button"
                size="sm"
                disabled={currentStep === 1 && (!hasValidBanner || bannerUploading)}
                onClick={() => goToStep(currentStep + 1)}
                className="gap-1 bg-primary text-xs font-bold text-primary-foreground shadow-md shadow-primary/25 disabled:opacity-50"
              >
                <span>Continue</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={handleSubmit}
                className="gap-1.5 bg-primary text-xs font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary-hover"
              >
                <Check className="h-4 w-4" />
                <span>{editContest ? 'Save Changes' : 'Publish Contest'}</span>
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>

      <ContestBannerCropModal
        open={isCropModalOpen}
        file={pendingCropFile}
        onApplyCrop={handleApplyCrop}
        onCancel={handleCancelCrop}
      />
    </Dialog>
  );
}
