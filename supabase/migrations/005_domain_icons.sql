-- ────────────────────────────────────────────────────────────────────────────
-- 005_domain_icons.sql
--
-- Adds an `icon` column to domains so each domain can have a small
-- visual marker alongside its color. Value is a lucide-icon name (e.g.
-- 'BookOpen', 'Music', 'Dumbbell'). Nullable for legacy rows — the
-- frontend falls back to the colored dot when icon is null.
--
-- Idempotent — safe to re-run.
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.domains
  ADD COLUMN IF NOT EXISTS icon TEXT;

NOTIFY pgrst, 'reload schema';

-- Back-fill icons for the five default-seeded domains so existing users
-- get the diagrams retroactively. Only writes if icon is still NULL.
UPDATE public.domains SET icon = 'BookOpen' WHERE icon IS NULL AND name = 'Academic';
UPDATE public.domains SET icon = 'Music'    WHERE icon IS NULL AND name = 'Music';
UPDATE public.domains SET icon = 'Dumbbell' WHERE icon IS NULL AND name = 'Physical Training';
UPDATE public.domains SET icon = 'Palette'  WHERE icon IS NULL AND name = 'Creative';
UPDATE public.domains SET icon = 'Languages' WHERE icon IS NULL AND name = 'Languages';
