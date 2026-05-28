/**
 * Groups API — all Supabase calls related to groups, membership, and
 * skill-sharing inside groups.
 *
 * Components and hooks should call these instead of `supabase` directly.
 */
import { supabase } from '../supabase';
import type { Group, GroupMember, GroupSkillShare } from '@tenk/shared';

export type GroupWithDetails = Group & {
  members:   GroupMember[];
  my_shares: GroupSkillShare[];
};

const UNIQUE_VIOLATION = '23505'; // PostgreSQL — row already exists

async function requireUserId(): Promise<string> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

/** All groups the current user is a member of, with members + their own shares. */
export async function listUserGroups(): Promise<GroupWithDetails[]> {
  const userId = await requireUserId();

  const { data: memberData, error: memberErr } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId);
  if (memberErr) throw memberErr;

  const groupIds = (memberData ?? []).map((m) => m.group_id);
  if (groupIds.length === 0) return [];

  const [
    { data: groupsData,  error: groupsErr  },
    { data: membersData, error: membersErr },
    { data: sharesData,  error: sharesErr  },
  ] = await Promise.all([
    supabase.from('groups').select('*').in('id', groupIds),
    /* Intentionally no `profile:profiles(...)` join — the profiles table
     * may not exist yet. Display names are fetched per-member by GroupDetail. */
    supabase.from('group_members').select('*').in('group_id', groupIds),
    supabase.from('group_skill_shares').select('*').in('group_id', groupIds).eq('user_id', userId),
  ]);

  if (groupsErr)  throw groupsErr;
  if (membersErr) throw membersErr;
  if (sharesErr)  throw sharesErr;

  return (groupsData ?? []).map((group) => ({
    ...group,
    members:   (membersData ?? []).filter((m) => m.group_id === group.id),
    my_shares: (sharesData  ?? []).filter((s) => s.group_id === group.id),
  }));
}

/** Create a new group and auto-join the creator as admin. */
export async function createGroup(name: string, description: string): Promise<Group> {
  const userId = await requireUserId();

  const { data: group, error: groupErr } = await supabase
    .from('groups')
    .insert({ name, description, created_by: userId })
    .select()
    .single();
  if (groupErr) throw groupErr;

  const { error: memberErr } = await supabase.from('group_members').insert({
    group_id: group.id,
    user_id:  userId,
    role:     'admin',
  });
  if (memberErr) throw memberErr;

  return group as Group;
}

/** Join an existing group by invite code. Idempotent — re-joining is a no-op. */
export async function joinGroup(inviteCode: string): Promise<Group> {
  const userId = await requireUserId();

  const { data: group, error: groupErr } = await supabase
    .from('groups')
    .select('*')
    .eq('invite_code', inviteCode)
    .single();
  if (groupErr) throw new Error('Invalid invite code');

  const { error: memberErr } = await supabase.from('group_members').insert({
    group_id: group.id,
    user_id:  userId,
    role:     'member',
  });
  if (memberErr && memberErr.code !== UNIQUE_VIOLATION) throw memberErr;

  return group as Group;
}

/** Remove the current user from a group. */
export async function leaveGroup(groupId: string): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);
  if (error) throw error;
}

/** Update a group's name + description (admin only — enforced by RLS). */
export async function updateGroup(
  groupId: string,
  name: string,
  description: string,
): Promise<void> {
  const { error } = await supabase
    .from('groups')
    .update({ name: name.trim(), description: description.trim() })
    .eq('id', groupId);
  if (error) throw error;
}

/** Share one of your skills with a group. Idempotent. */
export async function shareSkill(groupId: string, skillId: string): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase.from('group_skill_shares').insert({
    group_id:   groupId,
    user_id:    userId,
    skill_id:   skillId,
    share_type: 'skill',
  });
  if (error && error.code !== UNIQUE_VIOLATION) throw error;
}

export async function unshareSkill(groupId: string, skillId: string): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from('group_skill_shares')
    .delete()
    .eq('group_id', groupId)
    .eq('skill_id', skillId)
    .eq('user_id', userId);
  if (error) throw error;
}

/** Which skills a specific member has shared with a specific group. */
export async function getMemberSharedSkillIds(
  groupId: string,
  memberId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from('group_skill_shares')
    .select('skill_id, share_type')
    .eq('group_id', groupId)
    .eq('user_id', memberId);
  if (!data) return [];
  return data.filter((s) => s.skill_id).map((s) => s.skill_id as string);
}
