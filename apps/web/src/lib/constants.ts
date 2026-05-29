/**
 * Centralized constants. Anything that's hardcoded in two places
 * or that a designer might tweak should live here.
 */

/* ── Color palette used to differentiate group members in leaderboards,
 *    heatmaps, and member rows. Cycled by index. ──────────────────── */
export const MEMBER_COLORS = [
  '#7c6cf0', // accent purple
  '#f0906c', // peach
  '#4cdf90', // mint
  '#60b8f0', // sky
  '#f0c060', // amber
  '#e05555', // coral
  '#a0cf60', // lime
] as const;

/* ── Pomodoro defaults applied to new skills ────────────────────────── */
export const POMODORO_DEFAULTS = {
  workMinutes:  25,
  breakMinutes: 5,
  sessions:     4,
} as const;

/* ── Report time-window options ─────────────────────────────────────── */
export const REPORT_PERIODS = [
  { value: '7d',  label: 'Last 7 days',  days: 7   },
  { value: '30d', label: 'Last 30 days', days: 30  },
  { value: '90d', label: 'Last 90 days', days: 90  },
  { value: '1y',  label: 'Last year',    days: 365 },
] as const;

export type ReportPeriod = (typeof REPORT_PERIODS)[number]['value'];

/* ── Distribution / release ──────────────────────────────────────────
 * Edit this when the repo moves. Used by the DownloadPage to fetch
 * the latest desktop installers from GitHub Releases. */
export const GITHUB_REPO = 'ucando09/tenK';

/* ── localStorage keys (so typos can't drift apart) ─────────────────── */
export const STORAGE_KEYS = {
  theme:                    'tenk-theme',
  sidebarCollapsed:         'tenk-sidebar-collapsed',
  appDownloadHintDismissed: 'tenk-app-hint-dismissed',
  lastVibeId:               'tenk-last-vibe',
  sessionTimerConfig:       'tenk-session-timer',
  visualStyle:              'tenk-visual-style',
} as const;

const AUDIO_BASE = 'https://pub-572c6473885a4e6480b41de56d9ebd93.r2.dev';

/* ── Study-with-Me vibes ─────────────────────────────────────────────
 * Each vibe pairs:
 *   - one or more audio file paths served from Cloudflare R2
 *   - a CSS-only "scene" used as the focus-mode background
 *
 * `audioSrc` accepts either a single path (one track on loop) OR an
 * array of paths (multiple tracks; the player picks a random one each
 * time the previous track ends, so the same vibe never sounds stale).
 *
 * Audio is streamed via HTML5 `<audio>` so even 10-hour files don't
 * load fully into memory; the browser fetches as it plays. */
export interface StudyVibe {
  id:       string;
  label:    string;
  icon:     string;   // single emoji
  /** Short tagline shown under the vibe name when selected. */
  blurb:    string;
  /** Accent color used for swatch chip + ambient lighting in focus mode. */
  swatch:   string;
  /** Single track path OR array of paths under public/. */
  audioSrc?: string | string[];
  /** Scene identifier used by FocusMode to render the right background. */
  scene:    SceneId;
}

export type SceneId =
  | 'darkroom'      // pitch-black room, candle glow
  | 'fireplace'     // warm flickering fire
  | 'library'       // amber lamp + wood
  | 'forest'        // moonlit woods
  | 'cafe'          // dim coffee shop window
  | 'rain'          // rain-streaked window at night
  | 'lofi-night'    // purple/blue city night
  | 'minecraft'     // pixel night sky, blocky moon
  | 'interstellar'; // deep space, Gargantua black hole

export const STUDY_VIBES: StudyVibe[] = [
  /* No audio for silence — pure focus. */
  { id: 'silent',    label: 'Silence',     icon: '🤫', blurb: 'No audio — pure focus.',              swatch: '#2e2e52', scene: 'darkroom',   audioSrc: undefined },

  /* Single-track vibes (one MP3, looped). Drop the file at the given
   * path under `public/`. To add multiple tracks for a vibe, swap the
   * string for an array — see the lo-fi entry below for the shape. */
  { id: 'fireplace', label: 'Fireplace',   icon: '🔥', blurb: 'Crackling fire, warm glow.',          swatch: '#f0906c', scene: 'fireplace',  audioSrc: `${AUDIO_BASE}/fireplace.mp3` },
  { id: 'forest',    label: 'Forest',      icon: '🌲', blurb: 'Wind through pines, distant birds.', swatch: '#4cdf90', scene: 'forest',     audioSrc: `${AUDIO_BASE}/forest.mp3` },
  { id: 'library',   label: 'Library',     icon: '📚', blurb: 'Pages turning, distant footsteps.',  swatch: '#a0cf60', scene: 'library',    audioSrc: `${AUDIO_BASE}/library.mp3` },
  { id: 'cafe',      label: 'Coffee Shop', icon: '☕', blurb: 'Cup clinks, gentle chatter.',        swatch: '#f0906c', scene: 'cafe',       audioSrc: `${AUDIO_BASE}/cafe.mp3` },
  { id: 'rain',      label: 'Rainfall',    icon: '🌧️', blurb: 'Soft rain on a window.',             swatch: '#60b8f0', scene: 'rain',       audioSrc: `${AUDIO_BASE}/rain.mp3` },

  { id: 'lofi',      label: 'Lo-Fi Beats', icon: '🎧', blurb: 'Mellow hip-hop study mix.',           swatch: '#7c6cf0', scene: 'lofi-night',
    audioSrc: `${AUDIO_BASE}/lofi-1.mp3`,
  },

  { id: 'minecraft',    label: 'Minecraft',    icon: '⛏️', blurb: 'Calm night in the overworld.',        swatch: '#55aa33', scene: 'minecraft',
    audioSrc: `${AUDIO_BASE}/minecraft.mp3`,
  },

  { id: 'interstellar', label: 'Interstellar', icon: '🌌', blurb: 'Vast silence between the stars.',      swatch: '#c87941', scene: 'interstellar',
    audioSrc: `${AUDIO_BASE}/interstellar.mp3`,
  },
];

export function getVibe(id: string | null | undefined): StudyVibe {
  if (!id) return STUDY_VIBES[0];
  return STUDY_VIBES.find((v) => v.id === id) ?? STUDY_VIBES[0];
}
