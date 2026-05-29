-- Feedback / bug reports submitted from the app.
-- Anyone (auth'd or not) can write, only the project owner can read
-- (via service_role / Supabase dashboard). Keep this lean — we just
-- need a durable inbox for what users send.

create table if not exists public.feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users (id) on delete set null,
  email       text,
  category    text not null check (category in ('bug', 'feature', 'general')),
  message     text not null check (char_length(message) between 1 and 5000),
  url         text,
  user_agent  text,
  app_version text,
  created_at  timestamptz not null default now()
);

create index if not exists feedback_created_at_idx on public.feedback (created_at desc);

alter table public.feedback enable row level security;

-- Anyone (including anonymous visitors) can submit feedback.
drop policy if exists "feedback_insert_anyone" on public.feedback;
create policy "feedback_insert_anyone"
  on public.feedback
  for insert
  to anon, authenticated
  with check (true);

-- No SELECT policy → regular users (anon + authenticated) can't read
-- anyone's feedback, including their own. service_role bypasses RLS so
-- you'll still see everything in the Supabase Table Editor.
