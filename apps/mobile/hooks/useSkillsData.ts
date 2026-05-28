/**
 * useSkillsData — loads domains + skills (with hours) for the Skills tab.
 * Exposes a refresh function used by pull-to-refresh and post-mutation refresh.
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Domain } from '@tenk/shared';
import type { SkillWithDomain } from '../components/Skills/types';

interface UseSkillsDataResult {
  domains:    Domain[];
  skills:     SkillWithDomain[];
  loading:    boolean;
  refreshing: boolean;
  refresh:    () => Promise<void>;
}

export function useSkillsData(): UseSkillsDataResult {
  const [domains,    setDomains]    = useState<Domain[]>([]);
  const [skills,     setSkills]     = useState<SkillWithDomain[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [{ data: domainsData }, { data: skillsData }] = await Promise.all([
        supabase.from('domains').select('*').order('created_at'),
        supabase.from('skills').select('*').order('created_at'),
      ]);

      const withHours: SkillWithDomain[] = await Promise.all(
        (skillsData ?? []).map(async (skill) => {
          const { data: hours } = await supabase.rpc('get_skill_hours', { skill_uuid: skill.id });
          return {
            ...skill,
            logged_hours: Number(hours) || 0,
            domain: (domainsData ?? []).find((d) => d.id === skill.domain_id),
          };
        }),
      );

      setDomains(domainsData ?? []);
      setSkills(withHours);
    } catch {
      /* empty-state UI handles failures */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  return {
    domains,
    skills,
    loading,
    refreshing,
    refresh: () => loadData(true),
  };
}
