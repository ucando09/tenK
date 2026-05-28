import { Users } from 'lucide-react';
import type { Group, GroupMember } from '@tenk/shared';

interface GroupCardProps {
  group: Group & { members: GroupMember[] };
  onClick: () => void;
}

export function GroupCard({ group, onClick }: GroupCardProps) {
  const memberCount = group.members?.length ?? 0;

  return (
    <button
      onClick={onClick}
      className="card w-full text-left p-5 hover:border-accent/40 transition-all duration-200 hover:shadow-accent-glow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1 pr-3">
          <h3 className="text-text-primary font-semibold truncate">{group.name}</h3>
          {group.description && (
            <p className="text-text-muted text-sm mt-0.5 line-clamp-1">{group.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-text-muted text-xs flex-shrink-0">
          <Users size={13} />
          <span>{memberCount}</span>
        </div>
      </div>

      {/* Member count badge — profiles aren't joined here, so we just show count */}
      <p className="text-xs text-text-dim">
        {memberCount} member{memberCount !== 1 ? 's' : ''}
      </p>
    </button>
  );
}
