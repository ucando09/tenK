/**
 * HeatmapCalendar — monthly grid view with navigation and insight messages.
 *
 * compact=true  → current month mini-grid (no nav, used in TimerPage sidebar)
 * compact=false → full month with prev/next navigation and a motivational blurb
 */
import { useState, useMemo } from 'react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  subMonths, addMonths, isSameMonth, parseISO, differenceInCalendarDays,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useHeatmap } from '../../lib/hooks/useHeatmap';
import type { HeatmapMode, HeatmapDay } from '@tenk/shared';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/* ─── Props ─────────────────────────────────────────────────────────────── */
interface HeatmapCalendarProps {
  mode?:      HeatmapMode;
  skillId?:   string;
  domainId?:  string;
  userId?:    string;
  compact?:   boolean;
  userColor?: string;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/* ─── Helper: hex → rgb string for rgba() ─────────────────────────────── */
function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

/* ─── Motivational message ──────────────────────────────────────────────── */
function buildInsightMessage(
  currentHours:  number,
  prevHours:     number,
  activeDays:    number,
  totalDays:     number,
  topSkillName:  string | null,
  allTimeHours:  number,
): string {
  const monthName = format(new Date(), 'MMMM');

  // Brand-new user
  if (allTimeHours < 2) {
    return `Welcome to tenK! Your journey to mastery starts today. 🌱`;
  }

  // Nothing logged this month
  if (currentHours === 0) {
    return `${monthName} is a blank slate — your first session is one click away. ✨`;
  }

  const avgPerDay = (currentHours / totalDays).toFixed(1);

  // Significant improvement vs last month
  if (prevHours > 0 && currentHours >= prevHours * 1.3) {
    const pct = Math.round(((currentHours - prevHours) / prevHours) * 100);
    return `You're up ${pct}% vs last month${topSkillName ? ` in ${topSkillName}` : ''}. Keep the momentum! 🔥`;
  }

  // Slight improvement
  if (prevHours > 0 && currentHours > prevHours) {
    return `Solid progress — ${currentHours.toFixed(1)}h logged so far this month, more than last month. 📈`;
  }

  // Slight dip but still active
  if (prevHours > 0 && currentHours < prevHours * 0.7 && activeDays > 0) {
    return `Slower month, but you've shown up ${activeDays} day${activeDays !== 1 ? 's' : ''}. Consistency is everything. 💪`;
  }

  // First month with data, or equal to last
  if (activeDays >= 15) {
    return `${activeDays} active days in ${monthName} — averaging ${avgPerDay}h/day. Impressive dedication! 🏆`;
  }

  if (topSkillName) {
    return `You've put ${currentHours.toFixed(1)}h into ${topSkillName} this month. Every hour counts. 📚`;
  }

  return `${currentHours.toFixed(1)}h logged this month — you're building a great habit! ⚡`;
}

/* ─── Main component ────────────────────────────────────────────────────── */
export function HeatmapCalendar({
  mode      = 'all',
  skillId,
  domainId,
  userId,
  compact   = false,
  userColor,
}: HeatmapCalendarProps) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(today);
  const [tooltip, setTooltip]   = useState<{ x: number; y: number; day: string } | null>(null);

  const { heatmapData, loading } = useHeatmap({ mode, skillId, domainId, userId });

  /* ── Days in current viewed month ── */
  const monthDays = useMemo(() => {
    const start = startOfMonth(viewDate);
    const end   = endOfMonth(viewDate);
    return eachDayOfInterval({ start, end });
  }, [viewDate]);

  /* ── Leading blank cells so Mon aligns correctly ── */
  const leadingBlanks = useMemo(() => {
    const dow = (monthDays[0].getDay() + 6) % 7; // 0 = Mon
    return dow;
  }, [monthDays]);

  /* ── Month summary stats ── */
  const {
    currentHours, prevHours, activeDays, topSkillName, allTimeHours,
    bestDayHours, bestDayLabel, bestWeekday, currentStreak,
  } = useMemo(() => {
    const prevStart = format(startOfMonth(subMonths(viewDate, 1)), 'yyyy-MM-dd');
    const prevEnd   = format(endOfMonth(subMonths(viewDate, 1)),   'yyyy-MM-dd');
    const curStart  = format(startOfMonth(viewDate), 'yyyy-MM-dd');
    const curEnd    = format(endOfMonth(viewDate),   'yyyy-MM-dd');

    let currentHours = 0;
    let prevHours    = 0;
    let activeDays   = 0;
    let allTimeHours = 0;
    let bestDayHours = 0;
    let bestDayLabel: string | null = null;
    const skillHours:   Record<string, number> = {};
    const weekdayHours: number[] = [0, 0, 0, 0, 0, 0, 0]; // Sun..Sat
    const weekdayCount: number[] = [0, 0, 0, 0, 0, 0, 0];

    heatmapData.forEach((day: HeatmapDay, dateStr) => {
      allTimeHours += day.hours;
      if (dateStr >= prevStart && dateStr <= prevEnd) prevHours += day.hours;
      if (dateStr >= curStart  && dateStr <= curEnd) {
        currentHours += day.hours;
        activeDays++;
        if (day.hours > bestDayHours) {
          bestDayHours = day.hours;
          bestDayLabel = format(parseISO(dateStr), 'MMM d');
        }
        const wd = parseISO(dateStr).getDay();
        weekdayHours[wd] += day.hours;
        weekdayCount[wd]++;

        day.skills.forEach((s) => {
          skillHours[s.name] = (skillHours[s.name] ?? 0) + s.hours;
        });
      }
    });

    /* Most productive weekday by AVERAGE hours per occurrence */
    let bestWeekday: string | null = null;
    let bestWeekdayAvg = 0;
    for (let i = 0; i < 7; i++) {
      if (weekdayCount[i] === 0) continue;
      const avg = weekdayHours[i] / weekdayCount[i];
      if (avg > bestWeekdayAvg) {
        bestWeekdayAvg = avg;
        bestWeekday = WEEKDAY_LABELS[i];
      }
    }

    /* Current streak: consecutive days ending today (or yesterday if no
     * session yet today). Counts only when day has > 0 logged hours. */
    let currentStreak = 0;
    const todayStr = format(today, 'yyyy-MM-dd');
    const startCursor = heatmapData.get(todayStr) ? today : new Date(today.getTime() - 86_400_000);
    for (let cursor = startCursor;; cursor = new Date(cursor.getTime() - 86_400_000)) {
      const key = format(cursor, 'yyyy-MM-dd');
      if (heatmapData.get(key)) {
        currentStreak++;
        // Guard against runaway loop on broken data
        if (differenceInCalendarDays(today, cursor) > 365) break;
      } else {
        break;
      }
    }

    const topSkillName = Object.keys(skillHours).sort((a, b) => skillHours[b] - skillHours[a])[0] ?? null;

    return {
      currentHours, prevHours, activeDays, topSkillName, allTimeHours,
      bestDayHours, bestDayLabel, bestWeekday, currentStreak,
    };
  }, [heatmapData, viewDate, today]);

  const insightMsg = useMemo(() =>
    buildInsightMessage(
      currentHours, prevHours, activeDays, monthDays.length, topSkillName, allTimeHours,
    ),
    [currentHours, prevHours, activeDays, monthDays.length, topSkillName, allTimeHours],
  );

  /* ── Cell size depends on compact vs full ── */
  const cellCls = compact ? 'h-6 rounded' : 'h-10 rounded-lg';

  /* ── Colour for a cell ── */
  function cellBg(day: HeatmapDay | undefined, isFuture: boolean): string {
    if (isFuture || !day) return 'var(--bg-elevated)';
    if (userColor) return `rgba(${hexToRgb(userColor)},${Math.min(day.hours / 4, 0.9) + 0.1})`;
    return day.color;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-24">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isFutureMonth = viewDate > today && !isSameMonth(viewDate, today);

  return (
    <div className="relative select-none">

      {/* ── Month navigation (shown in both modes) ── */}
      <div className={`flex items-center justify-between mb-3 ${compact ? '' : 'mb-4'}`}>
        <button
          onClick={() => setViewDate((d) => subMonths(d, 1))}
          className="p-1 rounded-md text-text-muted hover:text-text-secondary hover:bg-bg-elevated transition-colors"
        >
          <ChevronLeft size={compact ? 14 : 16} />
        </button>

        <span className={`font-semibold text-text-secondary ${compact ? 'text-xs' : 'text-sm'}`}>
          {format(viewDate, compact ? 'MMM yyyy' : 'MMMM yyyy')}
        </span>

        <button
          onClick={() => setViewDate((d) => addMonths(d, 1))}
          disabled={isSameMonth(viewDate, today)}
          className="p-1 rounded-md text-text-muted hover:text-text-secondary hover:bg-bg-elevated transition-colors disabled:opacity-30"
        >
          <ChevronRight size={compact ? 14 : 16} />
        </button>
      </div>

      {/* ── Day-of-week headers ── */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {(compact ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : DAY_LABELS).map((d, i) => (
          <div
            key={i}
            className={`text-center text-text-dim ${compact ? 'text-[9px]' : 'text-xs'}`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* ── Calendar grid ── */}
      <div className="grid grid-cols-7 gap-1">
        {/* Leading blanks */}
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} className={cellCls} />
        ))}

        {/* Day cells */}
        {monthDays.map((day) => {
          const dateStr  = format(day, 'yyyy-MM-dd');
          const dayData  = heatmapData.get(dateStr);
          const isFuture = day > today;
          const isToday  = dateStr === format(today, 'yyyy-MM-dd');
          const bg       = cellBg(dayData, isFuture);

          return (
            <div
              key={dateStr}
              className={`${cellCls} flex items-center justify-center relative cursor-pointer transition-all hover:ring-1 hover:ring-accent/40 ${
                isToday ? 'ring-1 ring-accent' : ''
              }`}
              style={{ backgroundColor: bg }}
              onMouseEnter={(e) => { if (dayData) setTooltip({ x: e.clientX, y: e.clientY, day: dateStr }); }}
              onMouseLeave={() => setTooltip(null)}
            >
              {!compact && (
                <span
                  className={`text-xs font-medium ${
                    dayData ? 'text-white' : isFuture ? 'text-text-dim' : 'text-text-dim'
                  }`}
                >
                  {day.getDate()}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Monthly stats row (compact only — minimal) ── */}
      {compact && currentHours > 0 && (
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-text-dim">{activeDays} days active</span>
          <span className="text-[10px] text-text-dim font-medium">{currentHours.toFixed(1)}h this month</span>
        </div>
      )}

      {/* ── Insight message + metrics grid (non-compact only) ── */}
      {!compact && (
        <div className="mt-4 px-3 py-2.5 rounded-xl bg-bg-elevated border border-border">
          <p className="text-text-secondary text-xs leading-relaxed">{insightMsg}</p>

          {/* Primary stats row */}
          <div className="grid grid-cols-4 gap-3 mt-2 pt-2 border-t border-border">
            <Stat label="This month"  value={`${currentHours.toFixed(1)}h`} />
            <Stat label="Active days" value={`${activeDays}`} />
            <Stat
              label="Current streak"
              value={currentStreak > 0 ? `${currentStreak}d` : '—'}
              accent={currentStreak >= 7 ? '#28c840' : undefined}
            />
            {prevHours > 0 ? (
              <Stat
                label="vs last month"
                value={`${currentHours >= prevHours ? '+' : ''}${(currentHours - prevHours).toFixed(1)}h`}
                accent={currentHours >= prevHours ? '#28c840' : '#f0c060'}
              />
            ) : (
              <Stat label="Avg/active day" value={activeDays > 0 ? `${(currentHours / activeDays).toFixed(1)}h` : '—'} />
            )}
          </div>

          {/* Secondary "insights" row — only when there's enough signal */}
          {currentHours > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-2 pt-2 border-t border-border">
              <Stat
                label="Best day"
                value={bestDayLabel ? `${bestDayHours.toFixed(1)}h` : '—'}
                hint={bestDayLabel ?? undefined}
              />
              <Stat
                label="Top weekday"
                value={bestWeekday ?? '—'}
              />
              <Stat
                label="Top mastery"
                value={topSkillName ?? '—'}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Tooltip ── */}
      {tooltip && heatmapData.get(tooltip.day) && (
        <div
          className="fixed z-50 bg-bg-elevated border border-border rounded-lg p-2.5 shadow-xl pointer-events-none text-xs"
          style={{ left: tooltip.x + 14, top: tooltip.y - 16 }}
        >
          <p className="text-text-secondary font-medium mb-1">
            {format(new Date(tooltip.day + 'T00:00:00'), 'MMMM d, yyyy')}
          </p>
          {heatmapData.get(tooltip.day)?.skills.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-text-muted">{s.name}:</span>
              <span className="text-text-secondary">{s.hours.toFixed(1)}h</span>
            </div>
          ))}
          <p className="text-text-muted mt-1 pt-1 border-t border-border">
            Total: {heatmapData.get(tooltip.day)?.hours.toFixed(1)}h
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Tiny stat tile used inside the metrics grid ─────────────────────── */
function Stat({
  label, value, hint, accent,
}: {
  label:   string;
  value:   string;
  hint?:   string;
  accent?: string;
}) {
  return (
    <div className="text-center min-w-0">
      <div
        className="text-sm font-bold truncate"
        style={{ color: accent ?? 'var(--text-primary)' }}
        title={hint ?? value}
      >
        {value}
      </div>
      <div className="text-[10px] text-text-dim mt-0.5">{label}</div>
    </div>
  );
}
