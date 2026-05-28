/**
 * useTimer — coordinates the running timer for a single skill.
 *
 * Timer length / mode / sessions come from `sessionTimerConfig` in the
 * store (chosen by the user in GoalModal right before pressing Start),
 * NOT from the skill itself.
 */
import { useEffect, useCallback } from 'react';
import { useAppStore, startSyncInterval } from '../store';
import { supabase } from '../supabase';
import type { Skill } from '@tenk/shared';

export function useTimer(skill: Skill | null) {
  const {
    timer, sessionTimerConfig,
    startTimer, pauseTimer, resumeTimer, tickTimer, nextPhase, stopTimer,
  } = useAppStore();

  /* Per-second tick. The tick itself reads wall-clock anchors from the
   *  store, so even if `setInterval` is throttled while the tab is
   *  backgrounded the next tick yields the correct value. */
  useEffect(() => {
    if (!timer.isRunning || timer.isPaused) return;
    const id = setInterval(() => tickTimer(), 1000);
    return () => clearInterval(id);
  }, [timer.isRunning, timer.isPaused, tickTimer]);

  /* When the user returns to a backgrounded tab, force one immediate
   *  tick so the UI updates before the next setInterval fire. */
  useEffect(() => {
    if (!timer.isRunning || timer.isPaused) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') tickTimer();
    };
    document.addEventListener('visibilitychange', onVisible);
    /* Also tick on window focus — covers cases where the page is in a
     *  visible window that lost focus (less throttling, but still useful). */
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [timer.isRunning, timer.isPaused, tickTimer]);

  /** Initial number of seconds for the first phase of a new session. */
  const initialSeconds = (): number => {
    switch (sessionTimerConfig.mode) {
      case 'pomodoro':  return sessionTimerConfig.workMinutes * 60;
      case 'countdown': return sessionTimerConfig.countdownMinutes * 60;
      case 'stopwatch': return 0; // stopwatch counts up from 0 (UI uses elapsed time instead)
    }
  };

  const handleStart = useCallback(async () => {
    if (!skill) return null;
    try {
      const { data: session, error } = await supabase
        .from('sessions')
        .insert({
          skill_id:   skill.id,
          user_id:    (await supabase.auth.getUser()).data.user?.id,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error || !session) return null;

      startTimer(skill.id, session.id, initialSeconds(), sessionTimerConfig.sessions);
      startSyncInterval(session.id);
      return session.id;
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skill, startTimer, sessionTimerConfig]);

  const handlePause  = useCallback(() => pauseTimer(),  [pauseTimer]);
  const handleResume = useCallback(() => resumeTimer(), [resumeTimer]);

  const handleSkip = useCallback(() => {
    if (!skill) return;
    /* Only pomodoro mode has skippable phases. Skipping in countdown/
     * stopwatch just ends the session. */
    if (sessionTimerConfig.mode === 'pomodoro') {
      nextPhase(sessionTimerConfig.workMinutes, sessionTimerConfig.breakMinutes);
    }
  }, [skill, nextPhase, sessionTimerConfig]);

  const handleStop = useCallback(async (): Promise<string | null> => {
    if (!timer.sessionId) {
      stopTimer();
      return null;
    }
    const sessionId = timer.sessionId;
    const elapsed   = timer.startedAt
      ? Math.floor((Date.now() - timer.startedAt) / 1000)
      : 0;

    try {
      await supabase
        .from('sessions')
        .update({ ended_at: new Date().toISOString(), duration_seconds: elapsed })
        .eq('id', sessionId);
    } catch {
      /* non-fatal */
    }

    stopTimer();
    return sessionId;
  }, [timer.sessionId, timer.startedAt, stopTimer]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return {
    timer,
    handleStart,
    handlePause,
    handleResume,
    handleSkip,
    handleStop,
    formatTime,
  };
}
