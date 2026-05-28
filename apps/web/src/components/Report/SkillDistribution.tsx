import type { SkillBreakdown } from './types';

/** Horizontal bar chart of hours per skill, top 7 only. */
export function SkillDistribution({ skills }: { skills: SkillBreakdown[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
        Mastery Distribution
      </h3>
      {skills.length === 0 ? (
        <p className="text-text-dim text-sm">No sessions in this period.</p>
      ) : (
        <div className="space-y-3">
          {skills.slice(0, 7).map((skill) => (
            <div key={skill.id}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-text-secondary font-medium truncate">{skill.name}</span>
                <span className="text-text-muted ml-2 flex-shrink-0">
                  {(skill.seconds / 3600).toFixed(1)}h · {skill.pct.toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 bg-bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${skill.pct}%`, backgroundColor: skill.color }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
