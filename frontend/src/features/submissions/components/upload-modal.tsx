'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  UploadCloud,
  X,
  Play,
  Pause,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  FileVideo,
  Clock,
} from 'lucide-react';
import { useActiveVideoCategories } from '@/features/categories/hooks/use-active-video-categories';
import { OTHER_VIDEO_CATEGORY } from '@/services/video-categories-api';
import { loadDeploymentActiveContests } from '@/features/deployment/load-deployment-contests';
import { isUuid } from '@/lib/is-uuid';
import { CreatorSubmissionItem } from '@/types/creator';
import { cn } from '@/lib/utils';
import {
  MAX_VIDEO_DURATION_SECONDS,
  MAX_VIDEO_FILE_SIZE_BYTES,
  resolveVideoContentType,
  validateVideoDuration,
  validateVideoFile,
} from '@/features/submissions/lib/video-constraints';
import {
  uploadCreatorSubmission,
  uploadFailureMessage,
} from '@/features/submissions/lib/s3-upload';
import { mapApiSubmission } from '@/features/submissions/lib/map-submission';

export interface AvailableContestOption {
  id: string;
  title: string;
  prizePool: string;
}

const EMPTY_DEMO_CONTESTS: AvailableContestOption[] = [];

export interface UploadModalInitialData {
  resubmitId?: string;
  title?: string;
  category?: string;
  tags?: string[];
  description?: string;
  contestId?: string;
}

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: UploadModalInitialData | null;
  contests?: AvailableContestOption[];
  preferredContestId?: string | null;
  onSubmitSuccess: (data: {
    resubmitId?: string;
    submission: CreatorSubmissionItem;
    title: string;
    contestId: string;
    contestName: string;
    category: string;
    videoUrl: string;
    thumbnailUrl?: string;
    durationSeconds: number;
    description?: string;
    tags?: string[];
    fileSizeMb?: number;
    aspectRatio?: string;
  }) => void;
}

type UploadStage = 'form' | 'uploading' | 'processing' | 'registering' | 'success';

const MAX_FILE_SIZE_MB = MAX_VIDEO_FILE_SIZE_BYTES / (1024 * 1024);
const SUGGESTED_TAGS = [
  '#ViralComedy',
  '#VFXSkit',
  '#StandupComedy',
  '#ShortSkit',
  '#StreetComedy',
  '#UnrealEngine5',
  '#KineticEdit',
  '#Woofskis2026',
];

export function UploadModal({
  open,
  onOpenChange,
  initialData,
  contests,
  preferredContestId,
  onSubmitSuccess,
}: UploadModalProps) {
  const [deploymentContests, setDeploymentContests] = useState<AvailableContestOption[] | null>(
    null
  );

  useEffect(() => {
    if (!open || contests !== undefined) return;
    let cancelled = false;
    void loadDeploymentActiveContests().then((loaded) => {
      if (cancelled) return;
      setDeploymentContests(
        loaded.map((contest) => ({
          id: contest.id,
          title: contest.title,
          prizePool: contest.prizeSummary || '',
        }))
      );
    });
    return () => {
      cancelled = true;
    };
  }, [open, contests]);

  const availableContests: AvailableContestOption[] =
    contests ?? deploymentContests ?? EMPTY_DEMO_CONTESTS;

  // Form fields
  const [title, setTitle] = useState('');
  const [contestId, setContestId] = useState('');
  const [categoryChoice, setCategoryChoice] = useState('');
  const [otherCategoryLabel, setOtherCategoryLabel] = useState('');
  const {
    categories: categoryOptions,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useActiveVideoCategories(open);
  const [tags, setTags] = useState<string[]>(['#ViralComedy', '#Woofskis2026']);
  const [tagInput, setTagInput] = useState('');
  const [description, setDescription] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Video file state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(15);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number } | null>(
    null
  );
  const [aspectRatioNotice, setAspectRatioNotice] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Video preview player state
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewSoundBlocked, setPreviewSoundBlocked] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Upload Progress & Stage state machine
  const [stage, setStage] = useState<UploadStage>('form');
  const [progress, setProgress] = useState(0);
  const [createdItemSummary, setCreatedItemSummary] = useState<{
    title: string;
    category: string;
    durationSeconds: number;
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevOpenRef = useRef(false);
  const prevInitialDataRef = useRef<UploadModalInitialData | null | undefined>(undefined);

  // Populate initial data when editing/resubmitting or when freshly opened
  useEffect(() => {
    if (open) {
      const isNewlyOpened = !prevOpenRef.current;
      const hasInitialDataChanged = initialData !== prevInitialDataRef.current;

      if (isNewlyOpened || hasInitialDataChanged) {
        prevOpenRef.current = true;
        prevInitialDataRef.current = initialData;

        const preferred = availableContests.find((contest) => contest.id === preferredContestId);
        const defaultContestId =
          initialData?.contestId || preferred?.id || availableContests[0]?.id || '';

        if (initialData) {
          setTitle(initialData.title || '');
          setCategoryChoice('');
          setOtherCategoryLabel(
            initialData.category?.startsWith('Other:')
              ? initialData.category.slice('Other:'.length).trim()
              : ''
          );
          if (initialData.category?.startsWith('Other:')) {
            setCategoryChoice(OTHER_VIDEO_CATEGORY);
          }
          setTags(
            initialData.tags && initialData.tags.length > 0 ? initialData.tags : ['#Woofskis2026']
          );
          setDescription(initialData.description || '');
          setContestId(initialData.contestId || defaultContestId);
        } else {
          // Reset defaults
          setTitle('');
          setCategoryChoice('');
          setOtherCategoryLabel('');
          setTags(['#ViralComedy', '#Woofskis2026']);
          setDescription('');
          setContestId(defaultContestId);
        }
        setTagInput('');
        setSelectedFile(null);
        setPreviewUrl(null);
        setIsPlayingPreview(false);
        setPreviewSoundBlocked(false);
        setVideoDimensions(null);
        setAspectRatioNotice(null);
        setFileError(null);
        setFormErrors({});
        setAgreeTerms(false);
        setStage('form');
        setProgress(0);
        setCreatedItemSummary(null);
        setUploadError(null);
      }
    } else {
      prevOpenRef.current = false;
      prevInitialDataRef.current = undefined;
    }
  }, [open, initialData, availableContests, preferredContestId]);

  useEffect(() => {
    if (!open || !initialData?.category || initialData.category.startsWith('Other:')) return;
    const match = categoryOptions.find((item) => item.name === initialData.category);
    if (match) setCategoryChoice(match.id);
  }, [open, initialData, categoryOptions]);

  // Synchronize contestId if availableContests populates while open, without overwriting existing user selection
  useEffect(() => {
    if (!open || availableContests.length === 0) return;

    setContestId((currentContestId) => {
      // If user has already selected a valid contest in availableContests, preserve it
      if (
        currentContestId &&
        availableContests.some((contest) => contest.id === currentContestId)
      ) {
        return currentContestId;
      }
      // If preferred contest is in availableContests, use it
      const preferred = availableContests.find((contest) => contest.id === preferredContestId);
      if (preferred) return preferred.id;
      // Otherwise default to first available contest
      return availableContests[0]?.id || '';
    });
  }, [open, availableContests, preferredContestId]);

  // Clean up preview URL when unmounting or changing
  useEffect(() => {
    const timer = progressTimerRef.current;
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [previewUrl]);

  // Handle File Selection
  const handleFile = useCallback((file: File) => {
    setFileError(null);

    const validationError = validateVideoFile(file);
    if (validationError) {
      setFileError(validationError);
      return;
    }

    setSelectedFile(file);
    setIsPlayingPreview(false);
    setPreviewSoundBlocked(false);

    // Create object URL for local instant preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, []);

  // Handle video metadata loaded
  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      const duration = Math.round(videoRef.current.duration) || 0;
      const width = videoRef.current.videoWidth;
      const height = videoRef.current.videoHeight;
      setVideoDuration(duration);
      setVideoDimensions({ width, height });
      const durationError = validateVideoDuration(duration);
      if (durationError) {
        setFileError(durationError);
      }

      // Aspect ratio check
      if (width && height) {
        const ratio = width / height;
        if (ratio <= 0.75) {
          setAspectRatioNotice('Vertical 9:16 Short format verified');
        } else if (ratio >= 1.3) {
          setAspectRatioNotice(
            'Notice: Landscape format detected. 9:16 is recommended for best mobile judging score.'
          );
        } else {
          setAspectRatioNotice('Square/standard format');
        }
      }
    }
  };

  // Dropzone drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = () => {
    setIsDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Tag Pill Management
  const handleAddTag = (tagToAdd: string) => {
    const formatted = tagToAdd.startsWith('#') ? tagToAdd : `#${tagToAdd}`;
    if (formatted.length > 1 && !tags.includes(formatted)) {
      setTags((prev) => [...prev, formatted]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (tagInput.trim()) {
        handleAddTag(tagInput.trim());
      }
    }
  };

  // Form Validation & Submission
  const selectedCategoryName =
    categoryChoice === OTHER_VIDEO_CATEGORY
      ? `Other: ${otherCategoryLabel.trim()}`
      : categoryOptions.find((item) => item.id === categoryChoice)?.name || '';

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!title.trim() || title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters.';
    }
    if (!categoryChoice) {
      errors.category = categoriesLoading
        ? 'Categories are still loading.'
        : 'Select a category.';
    } else if (categoryChoice === OTHER_VIDEO_CATEGORY && !otherCategoryLabel.trim()) {
      errors.otherCategoryLabel = 'Please specify your video category.';
    } else if (
      categoryChoice !== OTHER_VIDEO_CATEGORY &&
      !categoryOptions.some((item) => item.id === categoryChoice && item.isActive)
    ) {
      errors.category = 'Select an active category.';
    }
    if (!isUuid(contestId)) {
      errors.contest =
        'An active contest id is required. Creator contest discovery is not available from the API.';
    }
    if (!selectedFile) {
      errors.video = 'Please upload an MP4/WebM/MOV video file.';
    }
    const durationError = validateVideoDuration(videoDuration);
    if (durationError) {
      errors.video = durationError;
    }
    if (!agreeTerms) {
      errors.agreeTerms = 'You must confirm originality and accept contest rules.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const runUpload = async () => {
    if (!selectedFile) {
      setFileError('Please upload an MP4/WebM/MOV video file.');
      return;
    }

    const activeContestObj = availableContests.find((c) => c.id === contestId);
    if (!activeContestObj || !isUuid(activeContestObj.id)) {
      setFileError('An active contest id is required.');
      return;
    }

    setUploadError(null);
    setStage('uploading');
    setProgress(5);

    try {
      const created = await uploadCreatorSubmission(
        {
          file: selectedFile,
          contestId: activeContestObj.id,
          title: title.trim(),
          description: description.trim(),
          durationSeconds: videoDuration,
          tags,
          categoryId: categoryChoice === OTHER_VIDEO_CATEGORY ? undefined : categoryChoice,
          otherCategoryLabel:
            categoryChoice === OTHER_VIDEO_CATEGORY ? otherCategoryLabel.trim() : undefined,
        },
        (event) => {
          setStage('uploading');
          setProgress(Math.max(5, Math.min(80, event.percent)));
        }
      );

      setStage('registering');
      setProgress(95);

      const mapped = mapApiSubmission(created);
      setProgress(100);
      setStage('success');
      setCreatedItemSummary({
        title: mapped.title,
        category: mapped.category || selectedCategoryName,
        durationSeconds: mapped.durationSeconds,
      });

      onSubmitSuccess({
        resubmitId: initialData?.resubmitId,
        submission: mapped,
        title: mapped.title,
        contestId: mapped.contestId,
        contestName: mapped.contestName,
        category: mapped.category || selectedCategoryName,
        videoUrl: mapped.videoUrl,
        thumbnailUrl: mapped.thumbnailUrl,
        durationSeconds: mapped.durationSeconds,
        description: mapped.description,
        tags: mapped.tags,
        fileSizeMb: +(selectedFile.size / (1024 * 1024)).toFixed(1),
        aspectRatio:
          videoDimensions && videoDimensions.width / videoDimensions.height <= 0.75
            ? '9:16'
            : '9:16',
      });
    } catch (error) {
      setStage('form');
      setProgress(0);
      setUploadError(uploadFailureMessage(error));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    void runUpload();
  };

  const handleClose = () => {
    if (stage !== 'uploading' && stage !== 'processing' && stage !== 'registering') {
      onOpenChange(false);
    }
  };

  const togglePreviewPlay = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (!video.paused) {
      video.pause();
      setIsPlayingPreview(false);
      return;
    }
    video.muted = false;
    video.volume = 1;
    try {
      await video.play();
      setIsPlayingPreview(true);
      setPreviewSoundBlocked(false);
    } catch {
      setIsPlayingPreview(false);
      setPreviewSoundBlocked(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden border border-border/80 bg-card p-0 text-card-foreground shadow-2xl sm:h-auto sm:max-h-[90dvh] sm:w-[calc(100vw-2rem)] sm:rounded-2xl">
        {/* Header */}
        <DialogHeader className="shrink-0 border-b border-border/60 bg-muted/20 px-5 py-4 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                {initialData?.resubmitId ? 'Resubmit Contest Entry' : 'Submit Video to Contest'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {initialData?.resubmitId
                  ? 'Replace media or update metadata for your resubmission.'
                  : 'Upload your short video entry for AI moderation & community voting.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* CONTENT STATES */}
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-5 sm:p-6 sm:pt-4">
          {/* STAGE: SUCCESS CELEBRATION */}
          {stage === 'success' && createdItemSummary ? (
            <div className="flex flex-col items-center justify-center space-y-5 py-6 text-center duration-300 animate-in fade-in zoom-in-95 sm:py-8">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-9 w-9 text-emerald-500" />
                <div className="absolute -inset-1 -z-10 animate-ping rounded-full bg-emerald-500/20" />
              </div>

              <div className="max-w-md space-y-2">
                <h3 className="text-xl font-bold text-foreground">Video uploaded successfully</h3>
                <p className="text-sm text-muted-foreground">
                  &quot;
                  <span className="font-semibold text-foreground">{createdItemSummary.title}</span>
                  &quot; was submitted and is waiting for review.
                </p>
              </div>

              {/* Summary Card */}
              <div className="w-full max-w-md space-y-2 rounded-xl border border-border bg-muted/40 p-4 text-left text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Status:</span>
                  <span className="flex items-center gap-1 font-semibold text-amber-500">
                    <Clock className="h-3 w-3" /> Waiting for review
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Category:</span>
                  <span className="font-semibold text-foreground">
                    {createdItemSummary.category}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Review time:</span>
                  <span className="font-semibold text-foreground">Unavailable</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={() => onOpenChange(false)}
                  className="gap-2 bg-primary px-6 font-semibold shadow-md shadow-primary/20"
                >
                  <span>Go to Creator Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : stage === 'uploading' || stage === 'processing' || stage === 'registering' ? (
            /* STAGE: ACTIVE UPLOAD & PIPELINE PROGRESS */
            <div className="flex flex-col items-center justify-center space-y-6 py-10 text-center duration-300 animate-in fade-in">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
                <RefreshCw className="h-9 w-9 animate-spin text-primary" />
              </div>

              <div className="max-w-md space-y-2">
                <h3 className="text-lg font-bold text-foreground">
                  {stage === 'uploading' && `Uploading video... ${progress}%`}
                  {stage === 'processing' && 'Checking your video...'}
                  {stage === 'registering' && 'Saving your submission...'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {stage === 'uploading' && 'Keep this window open until the upload finishes.'}
                  {stage === 'processing' && 'Making sure the video is ready.'}
                  {stage === 'registering' && 'Your entry will be waiting for review.'}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-md space-y-2">
                <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                  <span>Progress</span>
                  <span className="font-mono text-primary">{progress}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-150"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Stage Checklist */}
              <div className="w-full max-w-md space-y-2 text-left text-xs">
                <div
                  className={cn(
                    'flex items-center gap-2 rounded-lg border p-2 transition-colors',
                    progress >= 60
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                      : 'border-border bg-muted/30 text-muted-foreground'
                  )}
                >
                  <CheckCircle2
                    className={cn(
                      'h-4 w-4',
                      progress >= 60 ? 'text-emerald-500' : 'text-muted-foreground'
                    )}
                  />
                  <span>1. Video upload</span>
                </div>
                <div
                  className={cn(
                    'flex items-center gap-2 rounded-lg border p-2 transition-colors',
                    progress >= 90
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                      : stage === 'processing'
                        ? 'border-primary/30 bg-primary/10 text-primary'
                        : 'border-border bg-muted/30 text-muted-foreground'
                  )}
                >
                  <CheckCircle2
                    className={cn(
                      'h-4 w-4',
                      progress >= 90 ? 'text-emerald-500' : 'text-muted-foreground'
                    )}
                  />
                  <span>2. Upload finished</span>
                </div>
                <div
                  className={cn(
                    'flex items-center gap-2 rounded-lg border p-2 transition-colors',
                    progress >= 100
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                      : stage === 'registering'
                        ? 'border-primary/30 bg-primary/10 text-primary'
                        : 'border-border bg-muted/30 text-muted-foreground'
                  )}
                >
                  <CheckCircle2
                    className={cn(
                      'h-4 w-4',
                      progress >= 100 ? 'text-emerald-500' : 'text-muted-foreground'
                    )}
                  />
                  <span>3. Submission created</span>
                </div>
              </div>
            </div>
          ) : (
            /* STAGE: FORM ENTRY */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* VIDEO DROPZONE / PREVIEW AREA */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Video File (Max {MAX_FILE_SIZE_MB}MB · MP4/WebM/MOV · {MAX_VIDEO_DURATION_SECONDS}
                  s)
                </label>

                {!previewUrl ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all',
                      isDragOver
                        ? 'scale-[0.99] border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted/30',
                      formErrors.video && 'border-destructive/80 bg-destructive/5'
                    )}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFile(e.target.files[0]);
                        }
                      }}
                    />

                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <UploadCloud className="h-6 w-6" />
                    </div>

                    <p className="text-sm font-semibold text-foreground">
                      Drag and drop your video here, or{' '}
                      <span className="text-primary underline">browse</span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      MP4/WebM/MOV · Maximum 100MB · Maximum {MAX_VIDEO_DURATION_SECONDS} seconds
                    </p>
                  </div>
                ) : (
                  /* Instant Local Video Preview */
                  <div className="relative overflow-hidden rounded-xl border border-border bg-black/40 p-3">
                    <div className="flex flex-col items-center gap-4 sm:flex-row">
                      {/* 9:16 Mini Player Viewport */}
                      <div className="relative flex h-44 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black shadow-md">
                        <video
                          key={previewUrl}
                          ref={videoRef}
                          className="h-full w-full bg-black object-cover"
                          playsInline
                          loop
                          preload="metadata"
                          onLoadedMetadata={handleVideoLoadedMetadata}
                          onPlay={() => {
                            setIsPlayingPreview(true);
                            setPreviewSoundBlocked(false);
                          }}
                          onPause={() => setIsPlayingPreview(false)}
                        >
                          <source
                            src={previewUrl}
                            type={
                              (selectedFile && resolveVideoContentType(selectedFile)) ||
                              selectedFile?.type ||
                              'video/mp4'
                            }
                          />
                        </video>
                        {!isPlayingPreview ? (
                          <button
                            type="button"
                            onClick={() => void togglePreviewPlay()}
                            className="absolute inset-0 flex items-center justify-center bg-black/35"
                            aria-label="Play preview with sound"
                          >
                            <span className="flex items-center gap-1 rounded-full bg-black/75 px-2.5 py-1 text-[10px] font-semibold text-white">
                              <Play className="h-3 w-3 fill-white" />
                              Play
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void togglePreviewPlay()}
                            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1 py-1 text-left text-[10px] font-semibold text-white"
                            aria-label="Pause preview"
                          >
                            <Pause className="h-3 w-3" />
                          </button>
                        )}
                        <div className="pointer-events-none absolute right-1 top-1 rounded bg-black/70 px-1 py-0.5 font-mono text-[10px] text-white">
                          {videoDuration}s
                        </div>
                      </div>

                      {/* Video File Meta & Aspect Ratio Info */}
                      <div className="w-full flex-1 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 font-semibold text-foreground">
                            <FileVideo className="h-4 w-4 text-primary" />
                            {selectedFile ? selectedFile.name : 'Selected Demo Clip'}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setPreviewUrl(null);
                              setSelectedFile(null);
                              setVideoDimensions(null);
                              setAspectRatioNotice(null);
                            }}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        {selectedFile && (
                          <p className="text-muted-foreground">
                            Size: {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                          </p>
                        )}

                        {aspectRatioNotice && (
                          <div className="flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-500">
                            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                            <span className="line-clamp-1">{aspectRatioNotice}</span>
                          </div>
                        )}

                        <p className="text-[11px] text-muted-foreground">
                          {previewSoundBlocked
                            ? 'Your browser blocked sound. Press Play to hear this video.'
                            : 'Press play to preview this video with audio.'}
                        </p>

                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="h-7 text-xs"
                          >
                            Change File
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={togglePreviewPlay}
                            className="h-7 gap-1 text-xs"
                          >
                            {isPlayingPreview ? (
                              <Pause className="h-3 w-3" />
                            ) : (
                              <Play className="h-3 w-3" />
                            )}
                            {isPlayingPreview ? 'Pause' : 'Play Preview'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* File Error Notice */}
                {fileError && (
                  <p className="flex items-center gap-1 text-xs font-medium text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {fileError}
                  </p>
                )}
                {formErrors.video && !fileError && (
                  <p className="flex items-center gap-1 text-xs font-medium text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {formErrors.video}
                  </p>
                )}
                {uploadError && (
                  <div className="flex items-start justify-between gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    <span className="flex items-start gap-1">
                      <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                      {uploadError}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void runUpload()}
                      className="h-7 shrink-0 text-xs"
                    >
                      Retry upload
                    </Button>
                  </div>
                )}
              </div>

              {/* TITLE */}
              <div className="space-y-1.5">
                <label htmlFor="submission-title" className="text-xs font-semibold text-foreground">
                  Video Title <span className="text-primary">*</span>
                </label>
                <input
                  id="submission-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Midnight Quantum Drift // Shibuya VFX Skit"
                  maxLength={100}
                  className={cn(
                    'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary',
                    formErrors.title && 'border-destructive'
                  )}
                />
                {formErrors.title && (
                  <p className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {formErrors.title}
                  </p>
                )}
              </div>

              {/* CONTEST & CATEGORY ROW */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Contest Selection */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="submission-contest"
                    className="text-xs font-semibold text-foreground"
                  >
                    Target Contest
                  </label>
                  <select
                    id="submission-contest"
                    value={contestId}
                    onChange={(e) => setContestId(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {availableContests.length === 0 && <option value="">No active contest</option>}
                    {availableContests.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                        {c.prizePool ? ` (${c.prizePool})` : ''}
                      </option>
                    ))}
                  </select>
                  {formErrors.contest && (
                    <p className="flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.contest}
                    </p>
                  )}
                </div>

                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="submission-category"
                    className="text-xs font-semibold text-foreground"
                  >
                    Category <span className="text-primary">*</span>
                  </label>
                  <select
                    id="submission-category"
                    value={categoryChoice}
                    onChange={(e) => setCategoryChoice(e.target.value)}
                    disabled={categoriesLoading}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                  >
                    <option value="">
                      {categoriesLoading ? 'Loading categories…' : 'Select a category'}
                    </option>
                    {categoryOptions.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                    <option value={OTHER_VIDEO_CATEGORY}>Other</option>
                  </select>
                  {categoriesError && (
                    <p className="text-xs text-destructive">{categoriesError}</p>
                  )}
                  {!categoriesLoading && categoryOptions.length === 0 && !categoriesError && (
                    <p className="text-xs text-muted-foreground">
                      No official categories yet. Choose Other and describe the video.
                    </p>
                  )}
                  {formErrors.category && (
                    <p className="flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.category}
                    </p>
                  )}
                  {categoryChoice === OTHER_VIDEO_CATEGORY && (
                    <div className="space-y-1">
                      <label htmlFor="submission-other-category" className="text-xs font-semibold">
                        Which category best describes this video?
                      </label>
                      <input
                        id="submission-other-category"
                        value={otherCategoryLabel}
                        onChange={(event) => setOtherCategoryLabel(event.target.value)}
                        maxLength={80}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Please specify your video category.
                      </p>
                      {formErrors.otherCategoryLabel && (
                        <p className="text-xs text-destructive">{formErrors.otherCategoryLabel}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* TAGS PILL INPUT */}
              <div className="space-y-1.5">
                <label className="flex items-center justify-between text-xs font-semibold text-foreground">
                  <span>Tags & Keywords</span>
                  <span className="text-[10px] font-normal text-muted-foreground">
                    Press Enter or comma to add
                  </span>
                </label>
                <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-input bg-background p-2 focus-within:ring-2 focus-within:ring-primary">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-primary/70 hover:text-primary"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder={tags.length === 0 ? 'Type tag and hit Enter...' : ''}
                    className="min-w-[120px] flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>

                {/* Suggested quick tags */}
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  <span className="text-[10px] text-muted-foreground">Quick suggestions:</span>
                  {SUGGESTED_TAGS.slice(0, 4).map((suggested) => (
                    <button
                      key={suggested}
                      type="button"
                      onClick={() => handleAddTag(suggested)}
                      className="rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      +{suggested}
                    </button>
                  ))}
                </div>
              </div>

              {/* DESCRIPTION (OPTIONAL) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="submission-desc" className="font-semibold text-foreground">
                    Description / Concept Notes (Optional)
                  </label>
                  <span className="text-[10px] text-muted-foreground">
                    {description.length}/500
                  </span>
                </div>
                <textarea
                  id="submission-desc"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                  placeholder="Share software used, audio stems, punchline context, or creative methodology..."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* TERMS CHECKBOX */}
              <div className="space-y-1 pt-1">
                <label className="flex cursor-pointer select-none items-start gap-2">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-xs text-muted-foreground">
                    I confirm that I own or have licensed all video, visual effects, and audio
                    assets in this submission, and adhere to Woofskis COS authenticity rules.
                  </span>
                </label>
                {formErrors.agreeTerms && (
                  <p className="flex items-center gap-1 pl-6 text-xs text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {formErrors.agreeTerms}
                  </p>
                )}
              </div>

              {/* ACTIONS */}
              <div className="sticky bottom-0 z-10 -mx-5 -mb-5 mt-4 flex items-center justify-end gap-3 border-t border-border/60 bg-card/95 px-5 py-3 backdrop-blur sm:-mx-6 sm:-mb-6 sm:px-6 sm:py-3.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="gap-2 bg-primary text-xs font-semibold text-white shadow-md shadow-primary/20 hover:bg-primary-hover"
                >
                  <UploadCloud className="h-4 w-4" />
                  <span>
                    {initialData?.resubmitId ? 'Submit Revised Version' : 'Submit Entry to Contest'}
                  </span>
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
