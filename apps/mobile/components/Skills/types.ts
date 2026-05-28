import type { Domain, Skill } from '@tenk/shared';

export interface SkillWithDomain extends Skill {
  domain?:       Domain;
  logged_hours?: number;
}

/** Color palette used for inline domain creation + skill swatches. */
export const SKILL_COLORS = ['#7c6cf0', '#f0906c', '#4cdf90', '#60b8f0', '#f0c060'];
