/**
 * skillGoal — computes the effective goal & remaining hours for a mastery,
 * unifying the two goal types ('hours' and 'exam') behind one shape.
 *
 * For exam mode, also computes TODAY's quota — so the timer can show a
 * meaningful "2h left to do today" countdown instead of just the
 * theoretical total hours till the exam.
 */
import { differenceInCalendarDays } from 'date-fns';
import type { Skill, WeeklySchedule } from '@tenk/shared';

export interface SkillGoalInfo {
  /** Effective goal in hours (computed for exam mode, raw for hours mode). */
  goalHours:     number;
  /** Hours still to log to hit the goal. Never negative. */
  hoursRemaining: number;
  /** 0–1 progress fraction (logged ÷ goal). Clamped. */
  progress:      number;
  /** Days until the exam date (exam mode only). */
  daysToExam?:   number;
  /** Sum of planned weekly hours (exam mode only). */
  weeklyHours?:  number;
  /** True if exam mode is set but the date has already passed. */
  examPassed?:   boolean;
  /** True when goal_type='exam' but the user hasn't finished
   *  configuring it (missing date or empty weekly schedule). */
  examIncomplete?: boolean;

  /* ── Daily quota (exam mode only) ─────────────────────────────────
   * The user planned `todayPlannedHours` for today's weekday. They've
   * logged `todayLoggedHours` so far today. `todayRemainingHours` is
   * the difference (never negative). UI uses this for "X hours left
   * to do today" countdowns. */
  todayPlannedHours?:   number;
  todayLoggedHours?:    number;
  todayRemainingHours?: number;
}

const WEEKDAY_KEYS: (keyof WeeklySchedule)[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function sumWeeklySchedule(s: WeeklySchedule | null | undefined): number {
  if (!s) return 0;
  return WEEKDAY_KEYS.reduce((acc, k) => acc + (s[k] ?? 0), 0);
}

/** Returns the WeeklySchedule key for today's weekday in the local timezone. */
export function todayScheduleKey(now: Date = new Date()): keyof WeeklySchedule {
  return WEEKDAY_KEYS[now.getDay()];
}

interface ComputeOptions {
  /** Hours already logged for this skill today (any timezone, decimal hours).
   *  If provided AND the skill is in exam mode, the result will include
   *  `todayPlannedHours` / `todayLoggedHours` / `todayRemainingHours`. */
  todayLoggedHours?: number;
}

export function computeSkillGoal(skill: Skill, opts: ComputeOptions = {}): SkillGoalInfo {
  const logged = skill.logged_hours ?? 0;

  /* ── Exam mode ──────────────────────────────────────────────── */
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

    /* Pro-rate by remaining days rather than whole weeks so the
     * countdown shrinks daily instead of in week-sized jumps. */
    const projected      = weeklyHours * (daysToExam / 7);
    const goalHours      = Math.max(0, projected);
    const hoursRemaining = Math.max(0, goalHours - logged);
    const progress       = goalHours > 0 ? Math.min(1, logged / goalHours) : 0;

    /* Today's quota — how many hours the user planned for THIS weekday */
    const todayKey            = todayScheduleKey(today);
    const todayPlannedHours   = skill.weekly_schedule?.[todayKey] ?? 0;
    const todayLoggedHours    = opts.todayLoggedHours ?? 0;
    const todayRemainingHours = Math.max(0, todayPlannedHours - todayLoggedHours);

    return {
      goalHours,
      hoursRemaining,
      progress,
      daysToExam,
      weeklyHours,
      examPassed: daysToExam === 0 && new Date() > exam,
      todayPlannedHours,
      todayLoggedHours,
      todayRemainingHours,
    };
  }

  /* ── Standard "total hours" mode ───────────────────────────── */
  const goalHours      = skill.goal_hours;
  const hoursRemaining = Math.max(0, goalHours - logged);
  const progress       = goalHours > 0 ? Math.min(1, logged / goalHours) : 0;
  return { goalHours, hoursRemaining, progress };
}
