import { ModerationHotKeyInfo, RejectionPreset } from '@/types/admin';

/**
 * Rejection presets and moderation shortcut copy.
 * Submission rows and audit-log fixtures were removed in M11: the queue and
 * audit log come from the moderation API. Flag has no HTTP route, so the
 * flag shortcut remains UI copy only.
 */
export const REJECTION_REASON_PRESETS: RejectionPreset[] = [
  {
    code: 'WATERMARK',
    title: 'Prohibited Watermark or Logo',
    description:
      'Contains visible third-party creator tags, TikTok/CapCut/Reels watermarks, or unauthorized corporate brands.',
    defaultFeedback:
      'Submission contains prohibited third-party watermarks or platform branding. Please re-export raw camera footage without watermarks and resubmit.',
    badgeColor: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
    iconName: 'BadgeAlert',
  },
  {
    code: 'COPYRIGHT_AUDIO',
    title: 'Copyrighted / Unlicensed Audio',
    description:
      'Background audio contains commercial copyrighted music without cleared license stems.',
    defaultFeedback:
      'Audio track contains copyrighted music without a commercial license. Replace with platform-cleared royalty-free music or original stem recordings.',
    badgeColor: 'border-red-500/30 text-red-400 bg-red-500/10',
    iconName: 'Music2',
  },
  {
    code: 'DURATION_LIMIT',
    title: 'Exceeds Duration Limit (Max 60s)',
    description: 'Video runtime exceeds the 60-second competition maximum constraint.',
    defaultFeedback:
      'Video duration exceeds the maximum limit of 60 seconds. Trim your sequence to under 60s and resubmit.',
    badgeColor: 'border-orange-500/30 text-orange-400 bg-orange-500/10',
    iconName: 'Clock',
  },
  {
    code: 'COMMUNITY_GUIDELINES',
    title: 'Community Guideline Violation',
    description: 'Content contains unsafe stunts, harassment, offensive humor, or explicit themes.',
    defaultFeedback:
      'Submission violates platform community safety policies. Please review contest guidelines on respectful, safe creative content.',
    badgeColor: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
    iconName: 'ShieldAlert',
  },
  {
    code: 'LOW_QUALITY',
    title: 'Low Resolution / Invalid Aspect Ratio',
    description:
      'Video is below 1080x1920 or distorted, letterboxed, or stretched beyond 9:16 vertical standards.',
    defaultFeedback:
      'Video quality does not meet the minimum 1080x1920 vertical (9:16) format requirement. Ensure video fills frame without stretching.',
    badgeColor: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
    iconName: 'Tv2',
  },
  {
    code: 'OTHER',
    title: 'Custom Policy Exception',
    description: 'Specific violation noted by moderator in the custom field.',
    defaultFeedback:
      'Your entry requires modification before publication. Please review the moderator notes below for instructions.',
    badgeColor: 'border-slate-500/30 text-slate-400 bg-slate-500/10',
    iconName: 'FileText',
  },
];

export const MODERATION_HOTKEYS: ModerationHotKeyInfo[] = [
  {
    key: 'A',
    label: 'Approve',
    description: 'Instantly mark inspected entry as APPROVED and advance to next',
    action: 'Approve Video',
  },
  {
    key: 'R',
    label: 'Reject',
    description: 'Open structured Rejection Reason modal with preset reasons',
    action: 'Reject Video',
  },
  {
    key: 'Space',
    label: 'Play / Pause',
    description: 'Toggle video playback in vertical inspection viewport',
    action: 'Toggle Playback',
  },
  {
    key: 'J / ↓',
    label: 'Next Item',
    description: 'Select next submission in current queue index',
    action: 'Next Video',
  },
  {
    key: 'K / ↑',
    label: 'Prev Item',
    description: 'Select previous submission in current queue index',
    action: 'Previous Video',
  },
  {
    key: 'F',
    label: 'Flag / Unflag',
    description: 'Toggle suspicious review flag on active entry',
    action: 'Toggle Flag',
  },
  {
    key: 'V',
    label: 'View Mode',
    description: 'Toggle between Split Inspection Deck and Batch Table Mode',
    action: 'Toggle Mode',
  },
  {
    key: 'M',
    label: 'Mute / Unmute',
    description: 'Toggle audio track output during inspection',
    action: 'Toggle Audio',
  },
  {
    key: '?',
    label: 'Shortcuts HUD',
    description: 'Open keyboard shortcuts cheatsheet modal',
    action: 'Help Shortcuts',
  },
];
