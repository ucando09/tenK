/**
 * goalCarryOver — per-mastery localStorage stash for goals the user
 * didn't finish in their last session. When they start a new session
 * for the same mastery, GoalModal offers to load these back in.
 *
 * Why localStorage and not the DB?
 *  - It's per-device, per-user — exactly the scope where a "you forgot
 *    these from last time" prompt makes sense.
 *  - Survives page reloads but not signing out + back in on another
 *    device, which is the right level of magic.
 */

const PREFIX = 'tenk-carry-goals-';

export interface CarryGoal {
  text: string;
}

export function getCarriedGoals(skillId: string): CarryGoal[] {
  try {
    const raw = localStorage.getItem(PREFIX + skillId);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((g): g is CarryGoal => g && typeof g.text === 'string');
  } catch {
    return [];
  }
}

export function setCarriedGoals(skillId: string, goals: CarryGoal[]): void {
  try {
    if (goals.length === 0) {
      localStorage.removeItem(PREFIX + skillId);
    } else {
      localStorage.setItem(PREFIX + skillId, JSON.stringify(goals));
    }
  } catch {
    /* private mode etc. — silently no-op */
  }
}

export function clearCarriedGoals(skillId: string): void {
  setCarriedGoals(skillId, []);
}
