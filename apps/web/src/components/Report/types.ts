/**
 * Shared types for the Focus Report feature.
 */
import type { ReportPeriod } from '../../lib/constants';

export type { ReportPeriod };

export interface SessionRow {
  id: string;
  started_at: string;
  duration_seconds: number;
  skill: { id: string; name: string; color: string } | null;
}

export interface SkillBreakdown {
  id: string;
  name: string;
  color: string;
  seconds: number;
  pct: number;
}

export interface WeekRow {
  label: string;
  hours: number;
}

export interface MemberRow {
  userId: string;
  label: string;
  hours: number;
  isMe: boolean;
}

export interface ReportData {
  sessions:        SessionRow[];
  skillBreakdown:  SkillBreakdown[];
  focusScore:      number;
  focusGrade:      string;
  gradeColor:      string;
  totalHours:      number;
  totalSessions:   number;
  avgDailyHours:   number;
  consistencyPct:  number;
  longestStreak:   number;
  avgSessionMin:   number;
  weeklyTrend:     WeekRow[];
  groupComparison: MemberRow[];
}

/** Maps a focus grade letter (S/A/B/C/D) to a brand color. */
export function gradeColor(grade: string): string {
  return grade === 'S' ? '#28c840'
       : grade === 'A' ? '#7c6cf0'
       : grade === 'B' ? '#60a5fa'
       : grade === 'C' ? '#f0c060'
       :                  '#e05555';
}
