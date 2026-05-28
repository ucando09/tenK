/**
 * useSkills / useSkillMemos — hooks for the skills feature.
 *
 * `useSkills` is now a thin wrapper around `useSkillsStore` so every
 * caller (AppLayout, SkillsPage, anything new) sees the same data and
 * a mutation in one place propagates everywhere immediately.
 */
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabase';
import { useSkillsStore } from '../stores/skillsStore';
import { useAppStore } from '../store';
import type { Memo, MemoMedia } from '@tenk/shared';

export function useSkills() {
  const { userId } = useAppStore();
  const {
    domains, skills, loading, error, hydrated,
    fetchAll, createDomain, deleteDomain, createSkill, updateSkill, deleteSkill,
  } = useSkillsStore();

  /* Trigger the initial fetch once auth resolves. Subsequent
   * `useSkills()` calls in other components see the same hydrated
   * store and don't re-fetch. */
  useEffect(() => {
    if (userId && !hydrated && !loading) {
      void fetchAll();
    }
  }, [userId, hydrated, loading, fetchAll]);

  return {
    domains,
    skills,
    loading: loading && !hydrated, // don't show spinner once we have *any* data
    error,
    fetchAll,
    createDomain,
    deleteDomain,
    createSkill,
    updateSkill,
    deleteSkill,
  };
}

/* ── Memos are per-skill so they stay as their own local hook ─────── */
export function useSkillMemos(skillId: string | null) {
  const [memos,   setMemos]   = useState<Memo[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMemos = useCallback(async () => {
    if (!skillId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('memos')
        .select('*, media:memo_media(*)')
        .eq('skill_id', skillId)
        .order('date', { ascending: false });
      if (error) throw new Error(error.message);
      setMemos((data as Memo[]) ?? []);
    } catch {
      /* non-critical */
    } finally {
      setLoading(false);
    }
  }, [skillId]);

  useEffect(() => { fetchMemos(); }, [fetchMemos]);

  const addMemo = useCallback(
    async (content: string, date: string, sessionId?: string) => {
      if (!skillId) return null;
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('memos')
        .insert({
          skill_id:   skillId,
          user_id:    user.id,
          content,
          date,
          session_id: sessionId ?? null,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      await fetchMemos();
      return data;
    },
    [skillId, fetchMemos],
  );

  const uploadMedia = useCallback(async (memoId: string, file: File): Promise<MemoMedia | null> => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');

    const ext  = file.name.split('.').pop() ?? 'jpg';
    const path = `${user.id}/${memoId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('evidence')
      .upload(path, file, { upsert: false });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from('evidence').getPublicUrl(path);
    const mediaType = file.type.startsWith('video/') ? 'video' : 'image';

    const { data, error } = await supabase
      .from('memo_media')
      .insert({
        memo_id:      memoId,
        storage_path: path,
        url:          urlData.publicUrl,
        media_type:   mediaType,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    await fetchMemos();
    return data as MemoMedia;
  }, [fetchMemos]);

  return { memos, loading, fetchMemos, addMemo, uploadMedia };
}
