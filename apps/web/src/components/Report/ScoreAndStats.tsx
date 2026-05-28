import type { ReportData } from './types';

/** Hero row: large grade circle on the left, 6-tile stats grid on the right. */
export function ScoreAndStats({ data }: { data: ReportData }) {
  const stats = [
    { label: 'Total Study', value: `${data.totalHours.toFixed(1)}h`     },
    { label: 'Sessions',    value: `${data.totalSessions}`              },
    { label: 'Avg / Day',   value: `${data.avgDailyHours.toFixed(1)}h`  },
    { label: 'Consistency', value: `${data.consistencyPct}%`            },
    { label: 'Best Streak', value: `${data.longestStreak}d`             },
    { label: 'Avg Session', value: `${data.avgSessionMin}m`             },
  ];

  return (
    <div className="flex gap-4">
      {/* Score circle */}
      <div className="bg-bg-elevated border border-border rounded-xl px-6 py-5 flex flex-col items-center justify-center min-w-[120px]">
        <div className="text-5xl font-black leading-none" style={{ color: data.gradeColor }}>
          {data.focusScore}
        </div>
        <div className="text-base font-bold mt-1" style={{ color: data.gradeColor }}>
          Grade {data.focusGrade}
        </div>
        <div className="text-xs text-text-muted mt-1 uppercase tracking-wide">Focus Score</div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 flex-1">
        {stats.map((s) => (
          <div key={s.label} className="bg-bg-elevated border border-border rounded-lg px-3 py-3">
            <div className="text-xl font-bold text-text-primary">{s.value}</div>
            <div className="text-xs text-text-muted mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
