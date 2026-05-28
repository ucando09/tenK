/**
 * Mobile-app constants. Mirrors the relevant subset of the web app's
 * `apps/web/src/lib/constants.ts` — kept in sync manually for now
 * (move to `@tenk/shared` if drift becomes a problem).
 */

export const POMODORO_DEFAULTS = {
  workMinutes:  25,
  breakMinutes: 5,
  sessions:     4,
} as const;

/** Cycled by index to differentiate members in group views. */
export const MEMBER_COLORS = ['#7c6cf0', '#f0906c', '#4cdf90', '#60b8f0', '#f0c060'];
