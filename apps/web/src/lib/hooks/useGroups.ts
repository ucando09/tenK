/**
 * useGroups — owns the loading state for the current user's groups
 * and exposes thin wrappers around lib/api/groups that refresh on success.
 *
 * All DB queries live in lib/api/groups.ts.
 */
import { useState, useEffect, useCallback } from 'react';
import * as GroupsApi from '../api/groups';
import type { GroupWithDetails } from '../api/groups';
import { extractErrorMessage } from '../utils';

export function useGroups() {
  const [groups,  setGroups]  = useState<GroupWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setGroups(await GroupsApi.listUserGroups());
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  /* All mutations refresh the group list on success. */
  const createGroup = useCallback(async (name: string, description: string) => {
    const g = await GroupsApi.createGroup(name, description);
    await fetchGroups();
    return g;
  }, [fetchGroups]);

  const joinGroup = useCallback(async (inviteCode: string) => {
    const g = await GroupsApi.joinGroup(inviteCode);
    await fetchGroups();
    return g;
  }, [fetchGroups]);

  const leaveGroup = useCallback(async (groupId: string) => {
    await GroupsApi.leaveGroup(groupId);
    await fetchGroups();
  }, [fetchGroups]);

  const updateGroup = useCallback(async (groupId: string, name: string, description: string) => {
    await GroupsApi.updateGroup(groupId, name, description);
    await fetchGroups();
  }, [fetchGroups]);

  const shareSkill = useCallback(async (groupId: string, skillId: string) => {
    await GroupsApi.shareSkill(groupId, skillId);
    await fetchGroups();
  }, [fetchGroups]);

  const unshareSkill = useCallback(async (groupId: string, skillId: string) => {
    await GroupsApi.unshareSkill(groupId, skillId);
    await fetchGroups();
  }, [fetchGroups]);

  return {
    groups,
    loading,
    error,
    fetchGroups,
    createGroup,
    joinGroup,
    leaveGroup,
    updateGroup,
    shareSkill,
    unshareSkill,
  };
}
