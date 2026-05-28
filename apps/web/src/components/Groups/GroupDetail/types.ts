import type { Group, GroupMember, GroupSkillShare } from '@tenk/shared';

export type GroupWithDetails = Group & {
  members:   GroupMember[];
  my_shares: GroupSkillShare[];
};

export interface MemberStats {
  userId:      string;
  displayName: string;
  avatarUrl:   string | null;
  characterId: string | null;
  totalHours:  number;
  weekHours:   number;
  skills:      Array<{ name: string; hours: number; color: string }>;
}
