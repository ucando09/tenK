-- ────────────────────────────────────────────────────────────────────────────
-- 004_skill_goal_types.sql
--
-- Adds support for an "exam prep" goal type on skills:
--   - goal_type       : 'hours' (default — total hours like 10,000) | 'exam'
--   - exam_date       : DATE when the user is being assessed on this skill
--   - weekly_schedule : JSONB mapping weekday → planned hours/day
--                       e.g. { "mon": 4, "tue": 4, "wed": 0, "thu": 0,
--                              "fri": 2, "sat": 0, "sun": 0 }
--
-- For 'exam' skills the effective goal is computed client-side as
--   sum(weekly_schedule) * remaining_weeks_until_exam
-- so we don't need to denormalise it into goal_hours.
--
-- Idempotent — safe to re-run.
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.skills
  ADD COLUMN IF NOT EXISTS goal_type       TEXT  DEFAULT 'hours',
  ADD COLUMN IF NOT EXISTS exam_date       DATE,
  ADD COLUMN IF NOT EXISTS weekly_schedule JSONB DEFAULT '{}'::jsonb;

-- Constrain goal_type to known values (drop-then-add so script is re-runnable)
ALTER TABLE public.skills DROP CONSTRAINT IF EXISTS skills_goal_type_check;
ALTER TABLE public.skills ADD  CONSTRAINT skills_goal_type_check
  CHECK (goal_type IN ('hours', 'exam'));

-- Make PostgREST pick up the new columns immediately
NOTIFY pgrst, 'reload schema';
