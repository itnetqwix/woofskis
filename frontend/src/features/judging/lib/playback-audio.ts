/**
 * Audible playback stays inside browser autoplay rules.
 * A rejected play() never flips the saved preference and never throws into the feed.
 */

export interface MuteTarget {
  muted: boolean;
  defaultMuted: boolean;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
}

export interface PlaybackRejection {
  preferenceMuted: boolean;
  elementMuted: boolean;
  showTapForSound: boolean;
}

export function applyMediaMuted(el: MuteTarget, muted: boolean): void {
  el.muted = muted;
  el.defaultMuted = muted;
  if (muted) el.setAttribute('muted', '');
  else el.removeAttribute('muted');
}

export function errorName(error: unknown): string {
  if (error instanceof DOMException) return error.name;
  if (error && typeof error === 'object' && 'name' in error && typeof error.name === 'string') {
    return error.name;
  }
  return '';
}

/** NotAllowedError while the user wants sound: play muted, keep the preference, show the affordance. */
export function playbackAfterRejection(preferenceMuted: boolean, name: string): PlaybackRejection {
  if (!preferenceMuted && name === 'NotAllowedError') {
    return { preferenceMuted: false, elementMuted: true, showTapForSound: true };
  }
  return { preferenceMuted, elementMuted: preferenceMuted, showTapForSound: false };
}

/** Speaker control: silent -> unmuted preference, audible -> muted preference. */
export function preferenceAfterSpeaker(currentlySilent: boolean): boolean {
  return !currentlySilent;
}

/** Advancing the feed does not change the saved mute preference. */
export function preferenceAfterAdvance(preferenceMuted: boolean): boolean {
  return preferenceMuted;
}
