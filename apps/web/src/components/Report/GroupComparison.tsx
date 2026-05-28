import type { MemberRow } from './types';

/** Group leaderboard — current user's row is highlighted. */
export function GroupComparison({ members }: { members: MemberRow[] }) {
  if (members.length === 0) return null;
  const maxH = Math.max(...members.map((m) => m.hours), 0.1);

  return (
    <div>
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
        Group Comparison
      </h3>
      <div className="space-y-1.5">
        {members.map((member, i) => (
          <div
            key={member.userId}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
              member.isMe
                ? 'bg-accent/10 border border-accent/20'
                : 'bg-bg-elevated'
            }`}
          >
            <span className="text-xs text-text-dim w-5">#{i + 1}</span>
            <span className={`text-sm flex-1 font-medium ${member.isMe ? 'text-accent' : 'text-text-secondary'}`}>
              {member.label}
            </span>
            <div className="w-24 h-1.5 bg-bg-surface rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(member.hours / maxH) * 100}%`,
                  backgroundColor: member.isMe ? '#7c6cf0' : '#555',
                }}
              />
            </div>
            <span className="text-sm text-text-secondary tabular-nums w-12 text-right font-medium">
              {member.hours.toFixed(1)}h
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
