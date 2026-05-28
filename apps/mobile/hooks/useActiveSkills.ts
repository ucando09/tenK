/**
 * useActiveSkills — fetches the user's active skills with domains + logged hours.
 * Used by the Timer tab carousel.
 */
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Domain } from '@tenk/shared';
import type { SkillWithDomain } from '../components/Timer/SkillTimerCard';

interface UseActiveSkillsResult {
  skills:  SkillWithDomain[];
  loading: boolean;
}

export function useActiveSkills(): UseActiveSkillsResult {
  const [skills,  setSkills]  = useState<SkillWithDomain[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [{ data: domainsData }, { data: skillsData }] = await Promise.all([
          supabase.from('domains').select('*'),
          supabase
            .from('skills')
            .select('*')
            .eq('status', 'active')
            .order('created_at'),
        ]);

        const withHours: SkillWithDomain[] = await Promise.all(
          (skillsData ?? []).map(async (skill) => {
            const { data: hours } = await supabase.rpc('get_skill_hours', { skill_uuid: skill.id });
            return {
              ...skill,
              logged_hours: Number(hours) || 0,
              domain: (domainsData as Domain[] | null ?? []).find((d) => d.id === skill.domain_id),
            };
          }),
        );

        setSkills(withHours);
      } catch {
        /* surface as empty list — the screen has an empty state */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { skills, loading };
}
