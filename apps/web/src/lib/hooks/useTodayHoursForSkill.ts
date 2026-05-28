/**
 * useTodayHoursForSkill — total hours the user has logged for ONE skill
 * since local-midnight today. Used by the exam-mode daily countdown so
 * the IdleCard can show "2h left to do today" not "X total hours till
 * exam".
 *
 * Cheap: a single Supabase query for that user × skill × today, cached
 * per skillId. Re-runs whenever the timer stops (so logged hours
 * updates after a session ends).
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { useAppStore } from '../store';
import { startOfDay } from 'date-fns';

export function useTodayHoursForSkill(skillId: string | null): number {
  const [hours, setHours] = useState(0);
  const isRunning = useAppStore((s) => s.timer.isRunning);
  const sessionId = useAppStore((s) => s.timer.sessionId);

  const fetchHours = useCallback(async () => {
    if (!skillId) {
      setHours(0);
      return;
    }
    const sinceISO = startOfDay(new Date()).toISOString();
    const { data } = await supabase
      .from('sessions')
      .select('duration_seconds')
      .eq('skill_id', skillId)
      .gte('started_at', sinceISO)
      .not('duration_seconds', 'is', null);

    const total = (data ?? []).reduce(
      (acc, s) => acc + (s.duration_seconds ?? 0),
      0,
    );
    setHours(total / 3600);
  }, [skillId]);

  /* Re-fetch on mount + whenever a session ends (sessionId becomes null
   * while the user was just running it). */
  useEffect(() => {
    void fetchHours();
  }, [fetchHours, isRunning, sessionId]);

  return hours;
}
