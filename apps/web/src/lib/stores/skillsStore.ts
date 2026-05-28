/**
 * skillsStore — single source of truth for the user's domains + skills.
 *
 * Why a Zustand store instead of per-component useState?
 * Previously `useSkills()` was called in both AppLayout AND SkillsPage,
 * each instance holding its own copy of `skills`. When the user created
 * a skill on SkillsPage, only SkillsPage's instance re-fetched — the
 * Sidebar and Timer tab kept showing the stale list until a full reload.
 * Hoisting to a store fixes the "create a skill, it doesn't show up
 * anywhere else" bug.
 */
import { create } from 'zustand';
import { supabase } from '../supabase';
import type { Domain, Skill } from '@tenk/shared';

/* Domains every brand-new user gets pre-populated so they don't land on
 * an empty Skills page and have to invent the concept of a "domain"
 * from scratch. Names + colors picked to cover the most common life
 * categories without overwhelming. */
const DEFAULT_DOMAINS: { name: string; color: string; icon: string }[] = [
  { name: 'Academic',          color: '#7c6cf0', icon: 'BookOpen'  }, // purple
  { name: 'Music',             color: '#f0906c', icon: 'Music'     }, // peach
  { name: 'Physical Training', color: '#4cdf90', icon: 'Dumbbell'  }, // mint
  { name: 'Creative',          color: '#60b8f0', icon: 'Palette'   }, // sky
  { name: 'Languages',         color: '#f0c060', icon: 'Languages' }, // amber
];

/* Module-level guard so seeding is attempted at most once per app load
 * even if multiple components call fetchAll concurrently. */
let didAttemptSeed = false;

interface SkillsState {
  domains:    Domain[];
  skills:     Skill[];
  loading:    boolean;
  error:      string | null;
  /** Set to true after the very first fetch resolves. */
  hydrated:   boolean;

  fetchAll:     () => Promise<void>;
  createDomain: (name: string, color: string, icon?: string) => Promise<Domain>;
  /** Fails if the domain still has any skills attached. */
  deleteDomain: (domainId: string) => Promise<void>;
  createSkill:  (params: Omit<Skill, 'id' | 'user_id' | 'created_at' | 'domain' | 'logged_hours'>) => Promise<Skill>;
  updateSkill:  (skillId: string, updates: Partial<Skill>) => Promise<void>;
  deleteSkill:  (skillId: string) => Promise<void>;
}

export const useSkillsStore = create<SkillsState>((set, get) => ({
  domains:  [],
  skills:   [],
  /* Starts false — the consuming `useSkills()` hook kicks off the
   * first fetch from a useEffect, which then sets this to true.
   * Previously this was `true`, which caused the fetch guard
   * (`!hydrated && !loading`) to be false on mount → fetchAll never
   * ran → AppLayout's spinner never resolved → all tabs stuck. */
  loading:  false,
  error:    null,
  hydrated: false,

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      let [{ data: domainsData, error: domErr }, { data: skillsData, error: skillErr }] =
        await Promise.all([
          supabase.from('domains').select('*').order('created_at', { ascending: true }),
          supabase.from('skills').select('*').order('created_at', { ascending: true }),
        ]);

      if (domErr)   throw domErr;
      if (skillErr) throw skillErr;

      /* First-load seeding done in-flight: brand-new users get the default
       * domain set BEFORE we flip loading=false, so they never see the
       * "no domains" empty state flash between the fetch and the seed. */
      if (
        !didAttemptSeed
        && (domainsData ?? []).length === 0
        && (skillsData  ?? []).length === 0
      ) {
        didAttemptSeed = true;
        await seedDefaultDomains();
        const reFetched = await supabase
          .from('domains')
          .select('*')
          .order('created_at', { ascending: true });
        domainsData = reFetched.data;
      }

      const skillsWithHours: Skill[] = await Promise.all(
        (skillsData ?? []).map(async (skill) => {
          const { data } = await supabase.rpc('get_skill_hours', { skill_uuid: skill.id });
          return {
            ...skill,
            logged_hours: Number(data) || 0,
            domain: (domainsData ?? []).find((d) => d.id === skill.domain_id),
          };
        }),
      );

      set({
        domains: domainsData ?? [],
        skills:  skillsWithHours,
        loading: false,
        hydrated: true,
      });
    } catch (err) {
      set({
        loading:  false,
        hydrated: true,
        error:    err instanceof Error ? err.message : 'Failed to load skills',
      });
    }
  },

  createDomain: async (name, color, icon) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('domains')
      .insert({ user_id: user.id, name, color, icon: icon ?? null })
      .select()
      .single();

    if (error) throw new Error(error.message);
    await get().fetchAll();
    return data as Domain;
  },

  deleteDomain: async (domainId) => {
    /* Refuse client-side if there are still skills inside — the DB may
     * have a FK constraint that would fail anyway, but a clean error
     * message here is friendlier. */
    const skillsInDomain = get().skills.filter((s) => s.domain_id === domainId);
    if (skillsInDomain.length > 0) {
      throw new Error(
        `Delete or move the ${skillsInDomain.length} ${skillsInDomain.length === 1 ? 'mastery' : 'masteries'} inside this domain first.`,
      );
    }
    const { error } = await supabase.from('domains').delete().eq('id', domainId);
    if (error) throw new Error(error.message);
    await get().fetchAll();
  },

  createSkill: async (params) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('skills')
      .insert({ ...params, user_id: user.id })
      .select()
      .single();

    if (error) throw new Error(error.message);
    await get().fetchAll();
    return data as Skill;
  },

  updateSkill: async (skillId, updates) => {
    const { error } = await supabase.from('skills').update(updates).eq('id', skillId);
    if (error) throw new Error(error.message);
    await get().fetchAll();
  },

  deleteSkill: async (skillId) => {
    const { error } = await supabase.from('skills').delete().eq('id', skillId);
    if (error) throw new Error(error.message);
    await get().fetchAll();
  },
}));

/* Kick off the initial fetch once a userId is present. Callers (e.g.
 * AppLayout) should invoke this from a useEffect tied to userId. */
export async function loadSkillsIfNeeded(): Promise<void> {
  const state = useSkillsStore.getState();
  if (!state.hydrated && !state.loading) {
    await state.fetchAll();
  } else if (!state.hydrated) {
    /* already loading — nothing to do */
  }
}

/* Insert the default domain set for the current user. Safe to call only
 * when we already know they have zero rows — the caller (fetchAll) does
 * that check + uses didAttemptSeed to avoid races. */
async function seedDefaultDomains(): Promise<void> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return;

  const rows = DEFAULT_DOMAINS.map((d) => ({
    user_id: user.id,
    name:    d.name,
    color:   d.color,
    icon:    d.icon,
  }));

  /* Best-effort: a failure here just means the user sees an empty list
   * for one extra moment until they create their own. */
  await supabase.from('domains').insert(rows);
}
