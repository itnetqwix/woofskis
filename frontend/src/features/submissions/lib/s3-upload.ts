import { AppApiError } from '@/lib/axios';
import {
  completeSubmission,
  presignSubmission,
  type ApiSubmission,
  type CompleteSubmissionRequest,
  type PresignSubmissionResponse,
} from '@/services/submissions-api';
import { resolveVideoContentType } from './video-constraints';
import { captureVideoThumbnail } from './video-thumbnail';

export interface DirectS3UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export async function putFileToPresignedUrl(
  upload: Pick<PresignSubmissionResponse, 'method' | 'uploadUrl' | 'headers'>,
  file: Blob,
  onProgress?: (progress: DirectS3UploadProgress) => void,
  failureLabel = 'Video upload failed'
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(upload.method, upload.uploadUrl);
    Object.entries(upload.headers ?? {}).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress?.({
        loaded: event.loaded,
        total: event.total,
        percent: Math.round((event.loaded / event.total) * 100),
      });
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(new Error(`${failureLabel} (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error(failureLabel));
    xhr.onabort = () => reject(new Error('S3 upload cancelled'));
    xhr.send(file);
  });
}

export interface CreatorUploadInput {
  file: File;
  contestId: string;
  title: string;
  description?: string;
  durationSeconds: number;
  tags?: string[];
  thumbnailUrl?: string | null;
  categoryId?: string;
  otherCategoryLabel?: string;
}

export async function uploadCreatorSubmission(
  input: CreatorUploadInput,
  onProgress?: (progress: DirectS3UploadProgress) => void
): Promise<ApiSubmission> {
  const contentType = resolveVideoContentType(input.file);
  if (!contentType) {
    throw new Error('Unsupported video format. Please upload MP4/WebM/MOV.');
  }

  const presignEnvelope = await presignSubmission({
    contestId: input.contestId,
    contentType,
    fileSizeBytes: input.file.size,
    durationSeconds: input.durationSeconds,
  });
  if (!presignEnvelope.success || !presignEnvelope.data) {
    throw new Error(presignEnvelope.message || 'Could not create an upload URL');
  }

  await putFileToPresignedUrl(presignEnvelope.data, input.file, onProgress);

  const thumbnailUrl =
    input.thumbnailUrl ?? (await uploadCapturedThumbnail(input.file, presignEnvelope.data));

  const completeBody: CompleteSubmissionRequest = {
    contestId: input.contestId,
    objectKey: presignEnvelope.data.objectKey,
    title: input.title,
    description: input.description || null,
    durationSeconds: input.durationSeconds,
    tags: input.tags,
    thumbnailUrl,
    categoryId: input.categoryId,
    otherCategoryLabel: input.otherCategoryLabel,
  };

  const completeEnvelope = await completeSubmission(completeBody);
  if (!completeEnvelope.success || !completeEnvelope.data) {
    throw new Error(completeEnvelope.message || 'Could not register the submission');
  }
  return completeEnvelope.data;
}

/** Best effort. A failed capture or PUT never blocks the video submission. */
async function uploadCapturedThumbnail(
  file: File,
  presign: PresignSubmissionResponse
): Promise<string | null> {
  if (!presign.thumbnail) return null;
  try {
    const frame = await captureVideoThumbnail(file);
    if (!frame) return null;
    await putFileToPresignedUrl(presign.thumbnail, frame, undefined, 'Thumbnail upload failed');
    return presign.thumbnail.objectKey;
  } catch {
    return null;
  }
}

export function uploadFailureMessage(error: unknown): string {
  if (error instanceof AppApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return 'Upload failed. You can retry without selecting the file again.';
}
