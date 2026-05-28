import { CharacterAvatar } from '../../Character/CharacterAvatar';
import type { MemberStats } from './types';

interface GroupLeaderboardProps {
  stats:        MemberStats[];
  loading:      boolean;
  currentUserId: string | null;
}

/** Weekly hours leaderboard. Current user's row is highlighted. */
export function GroupLeaderboard({ stats, loading, currentUserId }: GroupLeaderboardProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-text-secondary mb-3">
        Leaderboard · This Week
      </h3>

      {loading ? (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {stats.map((member, i) => {
            const isMe = member.userId === currentUserId;

            return (
              <div
                key={member.userId}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  isMe ? 'bg-accent/5 border-accent/20' : 'bg-bg-elevated border-border'
                }`}
              >
                <span className="text-sm text-text-muted w-5 text-center">{i + 1}</span>

                <CharacterAvatar
                  characterId={member.characterId}
                  size={32}
                  ring
                />

                <div className="flex-1 min-w-0">
                  <p className="text-text-primary text-sm font-medium">
                    {member.displayName}
                    {isMe && <span className="ml-1.5 text-xs text-accent font-normal">(you)</span>}
                  </p>
                  <div className="flex gap-2 mt-0.5 flex-wrap">
                    {member.skills.slice(0, 3).map((s, si) => (
                      <span key={si} className="text-xs text-text-muted">
                        {s.name}: {s.hours.toFixed(1)}h
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-text-primary text-sm font-bold">{member.weekHours.toFixed(1)}h</p>
                  <p className="text-text-muted text-xs">this week</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
