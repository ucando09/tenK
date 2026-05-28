import type { Group, GroupMember } from '@tenk/shared';

export interface GroupWithDetails extends Group {
  members: GroupMember[];
}

/** Member rows from Supabase optionally include a joined profiles row. */
export type GroupMemberWithProfile = GroupMember & {
  profile?: { id: string; display_name: string | null } | null;
};

export function displayName(m: GroupMember): string {
  return (m as GroupMemberWithProfile).profile?.display_name ?? 'Member';
}

export function displayInitial(m: GroupMember): string {
  const dn = displayName(m);
  return dn[0]?.toUpperCase() ?? '?';
}
