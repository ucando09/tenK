/**
 * useReportData — fetches and aggregates everything the Focus Report needs.
 *
 * Returns: { data, loading } where `data` is null until the first fetch
 * resolves. Re-fetches whenever userId or period changes.
 */
import { useState, useEffect, useCallback } from 'react';
import { format, subDays, parseISO, addDays, eachWeekOfInterval } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { REPORT_PERIODS } from '../../lib/constants';
import { useAppStore } from '../../lib/store';
import { gradeColor } from './types';
import type {
  ReportPeriod, ReportData, SessionRow, SkillBreakdown, WeekRow, MemberRow,
} from './types';

function diffDays(d2: Date, d1: Date): number {
  return Math.round((d2.getTime() - d1.getTime()) / 86_400_000);
}

interface UseReportDataResult {
  data:    ReportData | null;
  loading: boolean;
}

export function useReportData(period: ReportPeriod, enabled: boolean): UseReportDataResult {
  const { userId } = useAppStore();
  const [data,    setData]    = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    if (!userId || !enabled) return;
    setLoading(true);

    const periodDef = REPORT_PERIODS.find((p) => p.value === period)!;
    const now    = new Date();
    const cutoff = subDays(now, periodDef.days);

    /* 1. Sessions in period */
    const { data: rawSessions } = await supabase
      .from('sessions')
      .select('id, started_at, duration_seconds, skill:skills(id, name, color)')
      .eq('user_id', userId)
      .gte('started_at', cutoff.toISOString())
      .not('duration_seconds', 'is', null)
      .order('started_at', { ascending: true });

    const rows = (rawSessions as unknown as SessionRow[]) ?? [];

    /* 2. Skill breakdown */
    const skillMap = new Map<string, SkillBreakdown>();
    for (const s of rows) {
      if (!s.skill) continue;
      const k = s.skill.id;
      if (!skillMap.has(k)) {
        skillMap.set(k, { id: k, name: s.skill.name, color: s.skill.color, seconds: 0, pct: 0 });
      }
      skillMap.get(k)!.seconds += s.duration_seconds;
    }
    const totalSecs  = rows.reduce((a, s) => a + s.duration_seconds, 0);
    const totalHours = totalSecs / 3600;
    const skillBreakdown = Array.from(skillMap.values())
      .sort((a, b) => b.seconds - a.seconds)
      .map((s) => ({ ...s, pct: totalSecs > 0 ? (s.seconds / totalSecs) * 100 : 0 }));

    /* 3. Consistency + streak */
    const daySet = new Set<string>();
    for (const s of rows) daySet.add(format(parseISO(s.started_at), 'yyyy-MM-dd'));
    const consistencyPct = Math.round((daySet.size / periodDef.days) * 100);

    const sortedDays = Array.from(daySet).sort();
    let longestStreak = 0;
    let curStreak = 0;
    let prevDay: Date | null = null;
    for (const d of sortedDays) {
      const curr = parseISO(d);
      curStreak = prevDay && diffDays(curr, prevDay) === 1 ? curStreak + 1 : 1;
      longestStreak = Math.max(longestStreak, curStreak);
      prevDay = curr;
    }

    /* 4. Focus score (0-100) */
    const volumeScore = Math.min(totalHours / (periodDef.days * 0.5), 1) * 40;
    const focusScore  = Math.min(100, Math.round(consistencyPct * 0.6 + volumeScore));
    const focusGrade  = focusScore >= 90 ? 'S'
                      : focusScore >= 75 ? 'A'
                      : focusScore >= 60 ? 'B'
                      : focusScore >= 40 ? 'C' : 'D';

    /* 5. Weekly trend */
    const weeks = eachWeekOfInterval({ start: cutoff, end: now }, { weekStartsOn: 1 });
    const weeklyTrend: WeekRow[] = weeks.map((weekStart) => {
      const weekEnd = addDays(weekStart, 7);
      const secs = rows
        .filter((s) => {
          const d = parseISO(s.started_at);
          return d >= weekStart && d < weekEnd;
        })
        .reduce((a, s) => a + s.duration_seconds, 0);
      return { label: format(weekStart, 'MMM d'), hours: secs / 3600 };
    });

    /* 6. Group comparison (best-effort — silent on failure) */
    const groupComparison: MemberRow[] = await fetchGroupComparison(userId, cutoff).catch(() => []);

    setData({
      sessions: rows,
      skillBreakdown,
      focusScore,
      focusGrade,
      gradeColor: gradeColor(focusGrade),
      totalHours,
      totalSessions: rows.length,
      avgDailyHours: totalHours / periodDef.days,
      consistencyPct,
      longestStreak,
      avgSessionMin: rows.length > 0 ? Math.round((totalHours / rows.length) * 60) : 0,
      weeklyTrend,
      groupComparison,
    });
    setLoading(false);
  }, [userId, enabled, period]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  return { data, loading };
}

/* ── Group comparison: leaderboard of the user's first group ────────── */
async function fetchGroupComparison(userId: string, cutoff: Date): Promise<MemberRow[]> {
  const { data: myGroups } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId)
    .limit(1);

  if (!myGroups || myGroups.length === 0) return [];

  const groupId = myGroups[0].group_id;
  const { data: members } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId);

  if (!members || members.length === 0) return [];

  const ids = members.map((m: { user_id: string }) => m.user_id);
  const { data: mSessions } = await supabase
    .from('sessions')
    .select('user_id, duration_seconds')
    .in('user_id', ids)
    .gte('started_at', cutoff.toISOString())
    .not('duration_seconds', 'is', null);

  const hoursMap = new Map<string, number>();
  for (const id of ids) hoursMap.set(id, 0);
  for (const s of mSessions ?? []) {
    hoursMap.set(s.user_id, (hoursMap.get(s.user_id) ?? 0) + s.duration_seconds / 3600);
  }

  return Array.from(hoursMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([uid, hours], i) => ({
      userId: uid,
      label:  uid === userId ? 'You' : `Member ${i + 1}`,
      hours,
      isMe:   uid === userId,
    }));
}
