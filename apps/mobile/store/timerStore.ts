import { create } from 'zustand';
import type { TimerState, Skill } from '@tenk/shared';
import { supabase } from '../lib/supabase';

interface TimerStore {
  timer: TimerState;
  activeSkill: Skill | null;
  syncIntervalId: ReturnType<typeof setInterval> | null;

  startTimer: (skill: Skill, sessionId: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  tick: () => void;
  nextPhase: () => void;
  stopTimer: () => void;
  setActiveSkill: (skill: Skill | null) => void;
}

const defaultTimer: TimerState = {
  isRunning: false,
  isPaused: false,
  sessionId: null,
  skillId: null,
  phase: 'work',
  currentPomodoroSession: 1,
  secondsRemaining: 0,
  totalSeconds: 0,
  startedAt: null,
};

export const useTimerStore = create<TimerStore>((set, get) => ({
  timer: defaultTimer,
  activeSkill: null,
  syncIntervalId: null,

  setActiveSkill: (skill) => set({ activeSkill: skill }),

  startTimer: (skill, sessionId) => {
    const workSeconds = skill.pomodoro_work_minutes * 60;
    set({
      timer: {
        isRunning: true,
        isPaused: false,
        sessionId,
        skillId: skill.id,
        phase: 'work',
        currentPomodoroSession: 1,
        secondsRemaining: workSeconds,
        totalSeconds: workSeconds,
        startedAt: Date.now(),
      },
    });

    // Start background sync every 60s
    const intervalId = setInterval(async () => {
      const { timer } = get();
      if (!timer.isRunning) {
        clearInterval(intervalId);
        return;
      }
      const elapsed = timer.startedAt ? Math.floor((Date.now() - timer.startedAt) / 1000) : 0;
      await supabase
        .from('sessions')
        .update({ duration_seconds: elapsed })
        .eq('id', sessionId);
    }, 60000);

    set({ syncIntervalId: intervalId });
  },

  pauseTimer: () => {
    set((s) => ({ timer: { ...s.timer, isRunning: false, isPaused: true } }));
  },

  resumeTimer: () => {
    set((s) => ({ timer: { ...s.timer, isRunning: true, isPaused: false } }));
  },

  tick: () => {
    const { timer } = get();
    if (!timer.isRunning || timer.isPaused || timer.secondsRemaining <= 0) return;
    set((s) => ({
      timer: { ...s.timer, secondsRemaining: s.timer.secondsRemaining - 1 },
    }));
  },

  nextPhase: () => {
    const { timer, activeSkill } = get();
    if (!activeSkill) return;

    if (timer.phase === 'work') {
      const breakSeconds = activeSkill.pomodoro_break_minutes * 60;
      set((s) => ({
        timer: {
          ...s.timer,
          phase: 'break',
          secondsRemaining: breakSeconds,
          totalSeconds: breakSeconds,
        },
      }));
    } else {
      const workSeconds = activeSkill.pomodoro_work_minutes * 60;
      set((s) => ({
        timer: {
          ...s.timer,
          phase: 'work',
          currentPomodoroSession: s.timer.currentPomodoroSession + 1,
          secondsRemaining: workSeconds,
          totalSeconds: workSeconds,
        },
      }));
    }
  },

  stopTimer: () => {
    const { syncIntervalId } = get();
    if (syncIntervalId) clearInterval(syncIntervalId);
    set({ timer: defaultTimer, syncIntervalId: null });
  },
}));
