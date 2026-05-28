/**
 * History page — chronological list of completed sessions.
 *
 * Sessions of the SAME mastery on the SAME day are merged into a single
 * card so the user doesn't see a separate row every time they paused to
 * grab a coffee. The merged card shows total time + session count, plus
 * a compact list of goals (with done/not-done check marks) parsed out of
 * the associated memos.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Download, Calendar as CalendarIcon, Clock, BarChart2, Check } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../lib/store';
import { ReportModal } from '../components/Report/ReportModal';
import { useT } from '../i18n';

interface SessionRow {
  id: string;
  started_at: string;
  duration_seconds: number;
  skill: { id: string; name: string; color: string } | null;
  memos: { content: string }[];
}

interface ParsedGoal { text: string; done: boolean }

interface MergedEntry {
  key:           string;             // dateKey + skillId
  date:          string;              // 'yyyy-MM-dd'
  skillId:       string;
  skillName:     string;
  skillColor:    string;
  totalSeconds:  number;
  count:         number;
  earliestStart: string;             // ISO; for "9:42 AM" display
  goals:         ParsedGoal[];        // de-duped across the merged sessions
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

/** Extract `☑ text` / `☐ text` lines from a memo's content. */
function parseGoalsFromMemo(content: string): ParsedGoal[] {
  const out: ParsedGoal[] = [];
  for (const raw of content.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('☑ ')) out.push({ text: line.slice(2).trim(), done: true });
    else if (line.startsWith('☐ ')) out.push({ text: line.slice(2).trim(), done: false });
  }
  return out;
}

/** Merge a group's goals: same text wins "done" status from any session. */
function mergeGoals(rows: SessionRow[]): ParsedGoal[] {
  const seen = new Map<string, ParsedGoal>();
  for (const r of rows) {
    for (const memo of r.memos ?? []) {
      for (const g of parseGoalsFromMemo(memo.content)) {
        const existing = seen.get(g.text);
        if (!existing) seen.set(g.text, { ...g });
        else if (g.done) existing.done = true;
      }
    }
  }
  return Array.from(seen.values());
}

export function CalendarPage() {
  const t = useT();
  const { userId } = useAppStore();
  const [sessions,   setSessions]   = useState<SessionRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [reportOpen, setReportOpen] = useState(false);

  const fetchSessions = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from('sessions')
      .select('id, started_at, duration_seconds, skill:skills(id, name, color), memos(content)')
      .eq('user_id', userId)
      .not('duration_seconds', 'is', null)
      .order('started_at', { ascending: false })
      .limit(400);
    setSessions((data as unknown as SessionRow[]) || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  /* iCal export — flat (no merging) so each session retains its real
   * start/end times in the user's calendar app. */
  const exportICS = () => {
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//tenK//Study Sessions//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];
    const fmtDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    for (const s of sessions) {
      const start = parseISO(s.started_at);
      const end   = new Date(start.getTime() + s.duration_seconds * 1000);
      lines.push(
        'BEGIN:VEVENT',
        `UID:tenk-${s.id}@tenk`,
        `DTSTART:${fmtDate(start)}`,
        `DTEND:${fmtDate(end)}`,
        `SUMMARY:${s.skill?.name ?? 'Study session'}`,
        `DESCRIPTION:${Math.round(s.duration_seconds / 60)} min session logged in tenK`,
        'END:VEVENT',
      );
    }
    lines.push('END:VCALENDAR');
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'tenk-sessions.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  /* Merge sessions of the same mastery on the same day. */
  const groupedByDate = useMemo(() => {
    /* First bucket by (date, skillId) — combine. Then bucket by date. */
    const byKey = new Map<string, SessionRow[]>();
    for (const s of sessions) {
      if (!s.skill) continue;
      const dateKey = format(parseISO(s.started_at), 'yyyy-MM-dd');
      const k       = `${dateKey}__${s.skill.id}`;
      const arr     = byKey.get(k) ?? [];
      arr.push(s);
      byKey.set(k, arr);
    }

    const merged: MergedEntry[] = Array.from(byKey.entries()).map(([k, rows]) => {
      const [date, skillId] = k.split('__');
      const sorted = [...rows].sort((a, b) =>
        new Date(a.started_at).getTime() - new Date(b.started_at).getTime()); // earliest first
      return {
        key:           k,
        date,
        skillId,
        skillName:     sorted[0].skill?.name  ?? t('history.unknownMastery'),
        skillColor:    sorted[0].skill?.color ?? '#7c6cf0',
        totalSeconds:  sorted.reduce((sum, s) => sum + s.duration_seconds, 0),
        count:         sorted.length,
        earliestStart: sorted[0].started_at,
        goals:         mergeGoals(sorted),
      };
    });

    /* Sort merged entries by earliest start desc (newest first) */
    merged.sort((a, b) =>
      new Date(b.earliestStart).getTime() - new Date(a.earliestStart).getTime());

    /* Now bucket by date for the section headers */
    const byDate = new Map<string, MergedEntry[]>();
    for (const m of merged) {
      const arr = byDate.get(m.date) ?? [];
      arr.push(m);
      byDate.set(m.date, arr);
    }
    return byDate;
  }, [sessions, t]);

  const totalHours = sessions.reduce((sum, s) => sum + s.duration_seconds, 0) / 3600;

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-2xl mx-auto px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-text-primary font-bold text-2xl">{t('history.title')}</h1>
            <p className="text-text-muted text-sm mt-1">
              {sessions.length} · {totalHours.toFixed(1)} h
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setReportOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-light text-white text-sm font-medium transition-colors"
            >
              <BarChart2 size={14} />
              {t('history.report')}
            </button>
            {sessions.length > 0 && (
              <button
                onClick={exportICS}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-bg-elevated hover:bg-border text-sm text-text-secondary transition-colors"
              >
                <Download size={14} />
                {t('history.exportIcal')}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="card p-12 text-center mt-6">
            <CalendarIcon size={36} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary font-medium">{t('history.empty')}</p>
          </div>
        ) : (
          <div className="space-y-6 mt-6">
            {Array.from(groupedByDate.entries()).map(([date, entries]) => {
              const dayTotalSeconds = entries.reduce((sum, e) => sum + e.totalSeconds, 0);
              return (
                <div key={date}>
                  {/* Date header */}
                  <div className="flex items-center justify-between mb-2 px-1">
                    <h2 className="text-sm font-semibold text-text-secondary">
                      {format(new Date(date + 'T00:00:00'), 'EEEE, MMMM d')}
                    </h2>
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <Clock size={11} />
                      {formatDuration(dayTotalSeconds)}
                    </span>
                  </div>

                  {/* Merged entries — one per mastery */}
                  <div className="space-y-1.5">
                    {entries.map((entry) => (
                      <div key={entry.key} className="card px-4 py-3">
                        {/* Main row */}
                        <div className="flex items-center gap-3">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: entry.skillColor }}
                          />
                          <span className="flex-1 text-sm text-text-primary truncate">
                            {entry.skillName}
                          </span>
                          {entry.count > 1 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-bg-elevated border border-border text-text-muted">
                              {t('history.sessions', { n: entry.count })}
                            </span>
                          )}
                          <span className="text-sm text-text-secondary font-medium tabular-nums">
                            {formatDuration(entry.totalSeconds)}
                          </span>
                          <span className="text-xs text-text-dim tabular-nums w-14 text-right">
                            {format(parseISO(entry.earliestStart), 'h:mm a')}
                          </span>
                        </div>

                        {/* Goals — only if any were parsed out of memos */}
                        {entry.goals.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-border/60 flex flex-wrap gap-x-3 gap-y-1">
                            {entry.goals.map((g, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-1.5 text-[11px]"
                                style={{ color: g.done ? '#7aa57a' : 'var(--text-muted)' }}
                              >
                                <span
                                  className="w-3 h-3 rounded-sm border flex items-center justify-center flex-shrink-0"
                                  style={{
                                    borderColor:     g.done ? entry.skillColor : 'var(--text-dim)',
                                    backgroundColor: g.done ? entry.skillColor : 'transparent',
                                  }}
                                >
                                  {g.done && <Check size={8} color="white" strokeWidth={3} />}
                                </span>
                                <span
                                  className={g.done ? 'line-through' : ''}
                                  style={{ textDecorationColor: 'var(--text-dim)' }}
                                >
                                  {g.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  );
}
