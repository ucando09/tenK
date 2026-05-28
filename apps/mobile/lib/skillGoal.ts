/**
 * Mobile mirror of `apps/web/src/lib/skillGoal.ts`. Computes the effective
 * goal for a skill, unifying 'hours' and 'exam' goal types behind one shape.
 *
 * Kept in sync manually for now (move to @tenk/shared if drift becomes an issue).
 */
import { differenceInCalendarDays } from 'date-fns';
import type { Skill, WeeklySchedule } from '@tenk/shared';

export interface SkillGoalInfo {
  goalHours:      number;
  hoursRemaining: number;
  progress:       number;
  daysToExam?:    number;
  weeklyHours?:   number;
  examPassed?:    boolean;
  examIncomplete?: boolean;
}

const WEEKDAY_KEYS: (keyof WeeklySchedule)[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function sumWeeklySchedule(s: WeeklySchedule | null | undefined): number {
  if (!s) return 0;
  return WEEKDAY_KEYS.reduce((acc, k) => acc + (s[k] ?? 0), 0);
}

export function computeSkillGoal(skill: Skill): SkillGoalInfo {
  const logged = skill.logged_hours ?? 0;

  if (skill.goal_type === 'exam') {
    const weeklyHours = sumWeeklySchedule(skill.weekly_schedule);

    if (!skill.exam_date || weeklyHours === 0) {
      return {
        goalHours:      0,
        hoursRemaining: 0,
        progress:       0,
        weeklyHours,
        examIncomplete: true,
      };
    }

    const exam       = new Date(skill.exam_date + 'T23:59:59');
    const today      = new Date();
    const daysToExam = Math.max(0, differenceInCalendarDays(exam, today));
    const projected  = weeklyHours * (daysToExam / 7);
    const goalHours  = Math.max(0, projected);
    const hoursRemaining = Math.max(0, goalHours - logged);
    const progress = goalHours > 0 ? Math.min(1, logged / goalHours) : 0;

    return {
      goalHours,
      hoursRemaining,
      progress,
      daysToExam,
      weeklyHours,
      examPassed: daysToExam === 0 && new Date() > exam,
    };
  }

  const goalHours      = skill.goal_hours;
  const hoursRemaining = Math.max(0, goalHours - logged);
  const progress       = goalHours > 0 ? Math.min(1, logged / goalHours) : 0;
  return { goalHours, hoursRemaining, progress };
}
