import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { TimerState, Skill } from '@tenk/shared';
import { supabase } from './supabase';
import { applyTheme } from './theme';
import { STORAGE_KEYS } from './constants';

/* ─── Session goals ────────────────────────────────────────────────────── */
export interface SessionGoal {
  id: string;
  text: string;
  done: boolean;
}

/* ─── Session-level timer config ────────────────────────────────────────
 * Timer mode + lengths are chosen at session start, not stored on the
 * skill — so today you can do 25×4 pomodoro on Calculus and tomorrow
 * a 90-minute countdown on the same skill without editing the skill. */
export type SessionTimerMode = 'pomodoro' | 'countdown' | 'stopwatch';

export interface SessionTimerConfig {
  mode:             SessionTimerMode;
  workMinutes:      number; // pomodoro
  breakMinutes:     number; // pomodoro
  sessions:         number; // pomodoro
  countdownMinutes: number; // countdown
}

export const DEFAULT_SESSION_TIMER_CONFIG: SessionTimerConfig = {
  mode:             'pomodoro',
  workMinutes:      25,
  breakMinutes:     5,
  sessions:         4,
  countdownMinutes: 60,
};

function loadSessionTimerConfig(): SessionTimerConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.sessionTimerConfig);
    if (!raw) return DEFAULT_SESSION_TIMER_CONFIG;
    return { ...DEFAULT_SESSION_TIMER_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SESSION_TIMER_CONFIG;
  }
}

interface AppState {
  // Theme
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;

  // Auth
  userId: string | null;
  setUserId: (id: string | null) => void;

  // Active skill selection
  activeSkillId: string | null;
  setActiveSkillId: (id: string | null) => void;

  // Skills list (for sidebar)
  skills: Skill[];
  setSkills: (skills: Skill[]) => void;

  // Timer state
  timer: TimerState;
  startTimer: (skillId: string, sessionId: string, totalSeconds: number, pomodoroSessions: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  tickTimer: () => void;
  nextPhase: (workMinutes: number, breakMinutes: number) => void;
  stopTimer: () => void;

  // Session goals (set before starting, cleared on next start)
  sessionGoals: SessionGoal[];
  setSessionGoals: (goals: SessionGoal[]) => void;
  toggleGoal: (id: string) => void;
  clearGoals: () => void;

  // Session timer config — chosen each time the user presses START
  sessionTimerConfig: SessionTimerConfig;
  setSessionTimerConfig: (cfg: SessionTimerConfig) => void;

  // Study-with-Me vibe ID (e.g. 'lofi' | 'forest'). Defaults to last-used.
  sessionVibeId: string;
  setSessionVibeId: (id: string) => void;

  // Focus mode — fullscreen, distraction-free view shown over the app
  // while a timer is running. Auto-opens on session start; user can exit
  // without stopping the timer.
  focusModeActive: boolean;
  setFocusModeActive: (active: boolean) => void;
}

const defaultTimerState: TimerState = {
  isRunning: false,
  isPaused: false,
  sessionId: null,
  skillId: null,
  phase: 'work',
  currentPomodoroSession: 1,
  secondsRemaining: 0,
  totalSeconds: 0,
  startedAt: null,
  phaseStartedAt: null,
  pausedAt: null,
  pausedAccumulatedMs: 0,
};

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
    theme: (localStorage.getItem(STORAGE_KEYS.theme) as 'dark' | 'light') ?? 'dark',
    setTheme: (theme) => {
      localStorage.setItem(STORAGE_KEYS.theme, theme);
      // Inject CSS variables as inline styles — highest possible specificity
      // so Tailwind utility classes (bg-bg-card etc.) update reliably.
      applyTheme(theme);
      set({ theme });
    },

    userId: null,
    setUserId: (id) => set({ userId: id }),

    activeSkillId: null,
    setActiveSkillId: (id) => set({ activeSkillId: id }),

    skills: [],
    setSkills: (skills) => set({ skills }),

    timer: defaultTimerState,

    startTimer: (skillId, sessionId, totalSeconds, _pomodoroSessions) => {
      /* Wall-clock anchors instead of decrement-per-tick:
       *  - phaseStartedAt is the absolute timestamp when the current
       *    phase began. Each tick computes secondsRemaining from
       *    (now - phaseStartedAt - pausedAccumulatedMs) so the UI
       *    stays correct even when the tab is backgrounded and the
       *    setInterval is throttled by the browser. */
      const now = Date.now();
      set({
        timer: {
          ...defaultTimerState,
          isRunning: true,
          isPaused: false,
          sessionId,
          skillId,
          phase: 'work',
          currentPomodoroSession: 1,
          secondsRemaining: totalSeconds,
          totalSeconds,
          startedAt: now,
          phaseStartedAt: now,
        },
        focusModeActive: true,
      });
    },

    pauseTimer: () => {
      set((state) => ({
        timer: {
          ...state.timer,
          isPaused: true,
          isRunning: false,
          pausedAt:  Date.now(),
        },
      }));
    },

    resumeTimer: () => {
      set((state) => {
        const pausedFor = state.timer.pausedAt
          ? Date.now() - state.timer.pausedAt
          : 0;
        return {
          timer: {
            ...state.timer,
            isPaused: false,
            isRunning: true,
            pausedAt: null,
            pausedAccumulatedMs: state.timer.pausedAccumulatedMs + pausedFor,
          },
        };
      });
    },

    tickTimer: () => {
      const { timer, sessionTimerConfig } = get();
      if (!timer.isRunning || timer.isPaused || !timer.phaseStartedAt) return;

      const now = Date.now();
      const phaseElapsedMs = now - timer.phaseStartedAt - timer.pausedAccumulatedMs;
      const phaseElapsedSec = Math.max(0, Math.floor(phaseElapsedMs / 1000));

      /* For stopwatch the displayed value counts UP; for pomodoro / countdown
       * it counts DOWN. We overload `secondsRemaining` as "the number to show"
       * in both cases so the UI doesn't need to branch. */
      const next = sessionTimerConfig.mode === 'stopwatch'
        ? phaseElapsedSec
        : Math.max(0, timer.totalSeconds - phaseElapsedSec);

      if (next !== timer.secondsRemaining) {
        set((state) => ({
          timer: { ...state.timer, secondsRemaining: next },
        }));
      }
    },

    nextPhase: (workMinutes, breakMinutes) => {
      const { timer } = get();
      const now = Date.now();
      if (timer.phase === 'work') {
        set((state) => ({
          timer: {
            ...state.timer,
            phase: 'break',
            secondsRemaining: breakMinutes * 60,
            totalSeconds: breakMinutes * 60,
            /* Phase anchors reset so each phase counts from itself, not
             *  from session start. */
            phaseStartedAt:     now,
            pausedAt:           null,
            pausedAccumulatedMs: 0,
          },
        }));
      } else {
        const nextSession = timer.currentPomodoroSession + 1;
        set((state) => ({
          timer: {
            ...state.timer,
            phase: 'work',
            currentPomodoroSession: nextSession,
            secondsRemaining: workMinutes * 60,
            totalSeconds: workMinutes * 60,
            phaseStartedAt:     now,
            pausedAt:           null,
            pausedAccumulatedMs: 0,
          },
        }));
      }
    },

    stopTimer: () => {
      stopSyncInterval();
      set({ timer: defaultTimerState, focusModeActive: false });
    },

    // Goals
    sessionGoals: [],
    setSessionGoals: (goals) => set({ sessionGoals: goals }),
    toggleGoal: (id) =>
      set((state) => ({
        sessionGoals: state.sessionGoals.map((g) =>
          g.id === id ? { ...g, done: !g.done } : g,
        ),
      })),
    clearGoals: () => set({ sessionGoals: [] }),

    // Session timer config (persisted — last choice becomes next default)
    sessionTimerConfig: loadSessionTimerConfig(),
    setSessionTimerConfig: (cfg) => {
      localStorage.setItem(STORAGE_KEYS.sessionTimerConfig, JSON.stringify(cfg));
      set({ sessionTimerConfig: cfg });
    },

    // Study-with-Me vibe (persisted so the user's last choice sticks)
    sessionVibeId: localStorage.getItem(STORAGE_KEYS.lastVibeId) ?? 'silent',
    setSessionVibeId: (id) => {
      localStorage.setItem(STORAGE_KEYS.lastVibeId, id);
      set({ sessionVibeId: id });
    },

    // Focus mode
    focusModeActive: false,
    setFocusModeActive: (active) => set({ focusModeActive: active }),
  })),
);

/* ───── Background sync interval ─────────────────────────────────────────
 * Module-local rather than store state — no component renders it, and
 * keeping it out of the store means stopTimer doesn't trigger unrelated
 * subscribers. */

let syncIntervalId: ReturnType<typeof setInterval> | null = null;

export function stopSyncInterval(): void {
  if (syncIntervalId !== null) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
}

/** Update sessions.duration_seconds every 60s while the timer runs. */
export function startSyncInterval(sessionId: string): void {
  stopSyncInterval();
  syncIntervalId = setInterval(async () => {
    const { timer } = useAppStore.getState();
    if (!timer.isRunning || timer.sessionId !== sessionId) {
      stopSyncInterval();
      return;
    }
    const elapsed = timer.startedAt
      ? Math.floor((Date.now() - timer.startedAt) / 1000)
      : 0;
    await supabase
      .from('sessions')
      .update({ duration_seconds: elapsed })
      .eq('id', sessionId);
  }, 60_000);
}
