-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- STEP 1: CREATE ALL TABLES FIRST
-- ============================================================

create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_url text,
  google_calendar_refresh_token text,
  created_at timestamptz default now() not null
);

create table if not exists domains (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  color text not null default '#7c6cf0',
  created_at timestamptz default now() not null
);

create table if not exists skills (
  id uuid primary key default uuid_generate_v4(),
  domain_id uuid references domains on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  color text not null default '#7c6cf0',
  status text default 'active' check (status in ('active', 'shelved')),
  goal_hours integer default 10000,
  timer_mode text default 'pomodoro' check (timer_mode in ('pomodoro', 'countdown', 'stopwatch')),
  pomodoro_work_minutes integer default 25,
  pomodoro_break_minutes integer default 5,
  pomodoro_sessions integer default 4,
  created_at timestamptz default now() not null
);

create table if not exists sessions (
  id uuid primary key default uuid_generate_v4(),
  skill_id uuid references skills on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds integer,
  verified boolean default false,
  created_at timestamptz default now() not null
);

create table if not exists memos (
  id uuid primary key default uuid_generate_v4(),
  skill_id uuid references skills on delete cascade not null,
  session_id uuid references sessions on delete set null,
  user_id uuid references auth.users on delete cascade not null,
  content text not null default '',
  date date not null default current_date,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists memo_media (
  id uuid primary key default uuid_generate_v4(),
  memo_id uuid references memos on delete cascade not null,
  storage_path text not null,
  url text not null,
  media_type text check (media_type in ('image', 'video')),
  created_at timestamptz default now() not null
);

create table if not exists groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text default '',
  created_by uuid references auth.users on delete cascade not null,
  invite_code text unique not null default encode(gen_random_bytes(6), 'hex'),
  created_at timestamptz default now() not null
);

create table if not exists group_members (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role text default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz default now() not null,
  unique(group_id, user_id)
);

create table if not exists group_skill_shares (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  skill_id uuid references skills on delete cascade,
  domain_id uuid references domains on delete cascade,
  share_type text check (share_type in ('skill', 'domain')),
  created_at timestamptz default now() not null
);

-- ============================================================
-- STEP 2: ENABLE RLS ON ALL TABLES
-- ============================================================

alter table profiles enable row level security;
alter table domains enable row level security;
alter table skills enable row level security;
alter table sessions enable row level security;
alter table memos enable row level security;
alter table memo_media enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table group_skill_shares enable row level security;

-- ============================================================
-- STEP 3: RLS POLICIES
-- (all tables exist now, so cross-references are safe)
-- ============================================================

-- profiles
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- domains
create policy "Users can view own domains"
  on domains for select using (auth.uid() = user_id);
create policy "Users can create own domains"
  on domains for insert with check (auth.uid() = user_id);
create policy "Users can update own domains"
  on domains for update using (auth.uid() = user_id);
create policy "Users can delete own domains"
  on domains for delete using (auth.uid() = user_id);
create policy "Group members can view shared domains"
  on domains for select using (
    exists (
      select 1 from group_skill_shares gss
      join group_members gm on gm.group_id = gss.group_id
      where gss.domain_id = domains.id
        and gm.user_id = auth.uid()
    )
  );

-- skills
create policy "Users can view own skills"
  on skills for select using (auth.uid() = user_id);
create policy "Users can create own skills"
  on skills for insert with check (auth.uid() = user_id);
create policy "Users can update own skills"
  on skills for update using (auth.uid() = user_id);
create policy "Users can delete own skills"
  on skills for delete using (auth.uid() = user_id);
create policy "Group members can view shared skills"
  on skills for select using (
    exists (
      select 1 from group_skill_shares gss
      join group_members gm on gm.group_id = gss.group_id
      where (gss.skill_id = skills.id or gss.domain_id = skills.domain_id)
        and gm.user_id = auth.uid()
    )
  );

-- sessions
create policy "Users can view own sessions"
  on sessions for select using (auth.uid() = user_id);
create policy "Users can create own sessions"
  on sessions for insert with check (auth.uid() = user_id);
create policy "Users can update own sessions"
  on sessions for update using (auth.uid() = user_id);
create policy "Users can delete own sessions"
  on sessions for delete using (auth.uid() = user_id);
create policy "Group members can view shared skill sessions"
  on sessions for select using (
    exists (
      select 1 from group_skill_shares gss
      join group_members gm on gm.group_id = gss.group_id
      join skills s on s.id = sessions.skill_id
      where (gss.skill_id = sessions.skill_id or gss.domain_id = s.domain_id)
        and gm.user_id = auth.uid()
    )
  );

-- memos
create policy "Users can view own memos"
  on memos for select using (auth.uid() = user_id);
create policy "Users can create own memos"
  on memos for insert with check (auth.uid() = user_id);
create policy "Users can update own memos"
  on memos for update using (auth.uid() = user_id);
create policy "Users can delete own memos"
  on memos for delete using (auth.uid() = user_id);

-- memo_media
create policy "Users can view own memo media"
  on memo_media for select using (
    exists (select 1 from memos m where m.id = memo_media.memo_id and m.user_id = auth.uid())
  );
create policy "Users can create own memo media"
  on memo_media for insert with check (
    exists (select 1 from memos m where m.id = memo_media.memo_id and m.user_id = auth.uid())
  );
create policy "Users can delete own memo media"
  on memo_media for delete using (
    exists (select 1 from memos m where m.id = memo_media.memo_id and m.user_id = auth.uid())
  );

-- groups
create policy "Group members can view groups"
  on groups for select using (
    exists (
      select 1 from group_members gm
      where gm.group_id = groups.id and gm.user_id = auth.uid()
    )
  );
create policy "Anyone can find group by invite code"
  on groups for select using (true);
create policy "Authenticated users can create groups"
  on groups for insert with check (auth.uid() = created_by);
create policy "Group admins can update groups"
  on groups for update using (
    exists (
      select 1 from group_members gm
      where gm.group_id = groups.id and gm.user_id = auth.uid() and gm.role = 'admin'
    )
  );
create policy "Group admins can delete groups"
  on groups for delete using (
    exists (
      select 1 from group_members gm
      where gm.group_id = groups.id and gm.user_id = auth.uid() and gm.role = 'admin'
    )
  );

-- group_members
create policy "Group members can view members"
  on group_members for select using (
    exists (
      select 1 from group_members gm2
      where gm2.group_id = group_members.group_id and gm2.user_id = auth.uid()
    )
  );
create policy "Users can join groups"
  on group_members for insert with check (auth.uid() = user_id);
create policy "Users can leave groups"
  on group_members for delete using (auth.uid() = user_id);
create policy "Group admins can manage members"
  on group_members for update using (
    exists (
      select 1 from group_members gm2
      where gm2.group_id = group_members.group_id
        and gm2.user_id = auth.uid()
        and gm2.role = 'admin'
    )
  );

-- group_skill_shares
create policy "Group members can view shares"
  on group_skill_shares for select using (
    exists (
      select 1 from group_members gm
      where gm.group_id = group_skill_shares.group_id and gm.user_id = auth.uid()
    )
  );
create policy "Users can manage own shares"
  on group_skill_shares for insert with check (auth.uid() = user_id);
create policy "Users can remove own shares"
  on group_skill_shares for delete using (auth.uid() = user_id);

-- ============================================================
-- STEP 4: FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Auto-update memos.updated_at
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger memos_updated_at
  before update on memos
  for each row execute procedure update_updated_at_column();

-- Total hours logged for a skill
create or replace function get_skill_hours(skill_uuid uuid)
returns numeric language sql stable as $$
  select coalesce(sum(duration_seconds)::numeric / 3600, 0)
  from sessions
  where skill_id = skill_uuid and duration_seconds is not null;
$$;

-- ============================================================
-- STEP 5: STORAGE
-- ============================================================

insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload evidence"
  on storage.objects for insert
  with check (bucket_id = 'evidence' and auth.role() = 'authenticated');

create policy "Evidence files are publicly readable"
  on storage.objects for select
  using (bucket_id = 'evidence');

create policy "Users can delete own evidence"
  on storage.objects for delete
  using (
    bucket_id = 'evidence'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- STEP 6: REALTIME
-- ============================================================

alter publication supabase_realtime add table sessions;
alter publication supabase_realtime add table memos;
