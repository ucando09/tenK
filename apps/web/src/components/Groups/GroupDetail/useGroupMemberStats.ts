/**
 * useGroupMemberStats — fetches per-member display info + study hours
 * for the group detail view (leaderboard + heatmaps).
 *
 * Profile lookups go through `lib/api/profiles` and are graceful: a missing
 * profiles table or a single failed request never blocks the leaderboard.
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { getProfileLite } from '../../../lib/api/profiles';
import { getMemberSharedSkillIds } from '../../../lib/api/groups';
import type { GroupMember } from '@tenk/shared';
import type { MemberStats } from './types';

interface UseGroupMemberStatsResult {
  stats:   MemberStats[];
  loading: boolean;
}

export function useGroupMemberStats(
  groupId: string,
  members: GroupMember[],
): UseGroupMemberStatsResult {
  const [stats,   setStats]   = useState<MemberStats[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const all = await Promise.all(
        members.map((m) => fetchOne(groupId, m.user_id, oneWeekAgo)),
      );
      setStats(all.sort((a, b) => b.weekHours - a.weekHours));
    } catch {
      /* non-critical; an empty leaderboard is fine */
    } finally {
      setLoading(false);
    }
  }, [groupId, members]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return { stats, loading };
}

async function fetchOne(
  groupId:    string,
  memberId:   string,
  weekCutoff: Date,
): Promise<MemberStats> {
  const [{ displayName, avatarUrl, characterId }, sharedIds] = await Promise.all([
    getProfileLite(memberId),
    getMemberSharedSkillIds(groupId, memberId),
  ]);

  const name = displayName ?? 'Member';

  if (sharedIds.length === 0) {
    return { userId: memberId, displayName: name, avatarUrl, characterId, totalHours: 0, weekHours: 0, skills: [] };
  }

  /* Sessions still go directly to Supabase — this is the only caller and
   * a future api/sessions.ts can absorb it when there's a second caller. */
  const { data: sessions } = await supabase
    .from('sessions')
    .select('skill_id, duration_seconds, started_at, skill:skills(name, color)')
    .eq('user_id', memberId)
    .in('skill_id', sharedIds)
    .not('duration_seconds', 'is', null);

  const skillMap = new Map<string, { name: string; hours: number; color: string }>();
  let totalHours = 0;
  let weekHours  = 0;

  for (const s of sessions || []) {
    const h = (s.duration_seconds || 0) / 3600;
    totalHours += h;
    if (new Date(s.started_at) >= weekCutoff) weekHours += h;
    const sk = (s.skill as unknown) as { name: string; color: string } | null;
    if (sk) {
      const ex = skillMap.get(s.skill_id);
      if (ex) ex.hours += h;
      else skillMap.set(s.skill_id, { name: sk.name, hours: h, color: sk.color });
    }
  }

  return {
    userId:      memberId,
    displayName: name,
    avatarUrl,
    characterId,
    totalHours,
    weekHours,
    skills: Array.from(skillMap.values()).sort((a, b) => b.hours - a.hours),
  };
}
