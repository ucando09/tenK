import { Users, ChevronRight } from 'lucide-react';
import type { Group, GroupMember, GroupSkillShare } from '@tenk/shared';

type GroupWithDetails = Group & {
  members:   GroupMember[];
  my_shares: GroupSkillShare[];
};

interface GroupRowProps {
  group:   GroupWithDetails;
  onClick: () => void;
}

/** Compact group preview row used in the Timer-page sidebar. */
export function GroupRow({ group, onClick }: GroupRowProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-bg-elevated hover:bg-border transition-colors text-left group"
    >
      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
        <Users size={13} className="text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{group.name}</p>
        <p className="text-xs text-text-muted">
          {group.members.length} member{group.members.length !== 1 ? 's' : ''}
        </p>
      </div>
      <ChevronRight size={14} className="text-text-dim group-hover:text-text-muted transition-colors flex-shrink-0" />
    </button>
  );
}
