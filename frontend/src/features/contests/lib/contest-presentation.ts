import { contestBannerSrc } from './contest-banner';
import { DEFAULT_CONTEST_TIMEZONE } from './contest-schedule';

export interface ContestPresentationData {
  id?: string;
  title: string;
  description?: string | null;
  tagline?: string | null;
  status?: string | null;
  bannerUrl?: string | null;
  submissionOpenAt?: string | null;
  submissionDeadlineAt?: string | null;
  votingClosesAt?: string | null;
  timezone?: string | null;
  categoryName?: string | null;
  prizeSummary?: string | null;
}

export function contestPresentationFromFields(
  input: ContestPresentationData
): ContestPresentationData & { bannerSrc: string; timezone: string } {
  return {
    ...input,
    title: input.title.trim() || 'Untitled contest',
    timezone: input.timezone?.trim() || DEFAULT_CONTEST_TIMEZONE,
    bannerSrc: contestBannerSrc(input.bannerUrl),
    votingClosesAt: input.votingClosesAt || null,
  };
}
