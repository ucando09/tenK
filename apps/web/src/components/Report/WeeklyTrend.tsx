import type { WeekRow } from './types';

/** Last-9-weeks horizontal bar chart, scaled to the peak week. */
export function WeeklyTrend({ weeks }: { weeks: WeekRow[] }) {
  if (weeks.length === 0) {
    return (
      <div>
        <Title />
        <p className="text-text-dim text-sm">No data available.</p>
      </div>
    );
  }

  const maxH = Math.max(...weeks.map((w) => w.hours), 0.1);

  return (
    <div>
      <Title />
      <div className="space-y-2">
        {weeks.slice(-9).map((week) => (
          <div key={week.label} className="flex items-center gap-2">
            <span className="text-xs text-text-muted w-12 flex-shrink-0">{week.label}</span>
            <div className="flex-1 h-1.5 bg-bg-surface rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${(week.hours / maxH) * 100}%` }}
              />
            </div>
            <span className="text-xs text-text-secondary w-10 text-right tabular-nums">
              {week.hours.toFixed(1)}h
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Title() {
  return (
    <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
      Weekly Trend
    </h3>
  );
}
