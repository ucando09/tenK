import { HeatmapCalendar } from '../../Calendar/HeatmapCalendar';
import { MEMBER_COLORS } from '../../../lib/constants';
import type { MemberStats } from './types';

interface GroupHeatmapsProps {
  stats:         MemberStats[];
  currentUserId: string | null;
}

/** One compact heatmap per group member, colored by their seat in the leaderboard. */
export function GroupHeatmaps({ stats, currentUserId }: GroupHeatmapsProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-text-secondary mb-3">Group Activity</h3>
      <div className="space-y-3">
        {stats.map((member, i) => {
          const color = MEMBER_COLORS[i % MEMBER_COLORS.length];
          const isMe  = member.userId === currentUserId;

          return (
            <div key={member.userId}>
              <div className="flex items-center gap-2 mb-1.5">
                {member.avatarUrl ? (
                  <img
                    src={member.avatarUrl}
                    alt={member.displayName}
                    className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                )}
                <span className="text-xs text-text-muted">
                  {member.displayName}
                  {isMe && <span className="ml-1 text-accent">(you)</span>}
                </span>
              </div>
              <HeatmapCalendar
                mode="all"
                userId={member.userId}
                compact
                userColor={color}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
