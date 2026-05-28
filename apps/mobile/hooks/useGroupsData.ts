/**
 * useGroupsData — loads the user's groups + members for the Groups tab.
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { GroupWithDetails } from '../components/Groups/types';

interface UseGroupsDataResult {
  groups:     GroupWithDetails[];
  loading:    boolean;
  refreshing: boolean;
  refresh:    () => Promise<void>;
}

export function useGroupsData(): UseGroupsDataResult {
  const [groups,     setGroups]     = useState<GroupWithDetails[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data: memberData } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      const groupIds = (memberData ?? []).map((m) => m.group_id);
      if (groupIds.length === 0) {
        setGroups([]);
        return;
      }

      const [{ data: groupsData }, { data: membersData }] = await Promise.all([
        supabase.from('groups').select('*').in('id', groupIds),
        supabase
          .from('group_members')
          .select('*, profile:profiles(id, display_name)')
          .in('group_id', groupIds),
      ]);

      const enriched: GroupWithDetails[] = (groupsData ?? []).map((g) => ({
        ...g,
        members: (membersData ?? []).filter((m) => m.group_id === g.id),
      }));

      setGroups(enriched);
    } catch {
      /* empty-state UI handles failures */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return {
    groups,
    loading,
    refreshing,
    refresh: () => load(true),
  };
}
