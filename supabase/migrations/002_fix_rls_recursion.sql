-- ============================================================
-- FIX: Infinite recursion in group_members RLS policies
--
-- Root cause: the SELECT policy on group_members queries
-- group_members itself. Postgres evaluates that subquery under
-- the same RLS policy → infinite recursion.
--
-- This is triggered indirectly whenever any other table's policy
-- (domains, skills, sessions, groups, group_skill_shares) does a
-- JOIN on group_members — including the RETURNING/SELECT that
-- PostgREST appends after an INSERT.
--
-- Fix: introduce two SECURITY DEFINER functions that check
-- membership / admin status by bypassing RLS, then rewrite all
-- policies that self-reference group_members to use them.
-- ============================================================

-- ── Helper functions (bypass RLS) ───────────────────────────

create or replace function public.is_group_member(group_uuid uuid, user_uuid uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = group_uuid and user_id = user_uuid
  );
$$;

create or replace function public.is_group_admin(group_uuid uuid, user_uuid uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = group_uuid and user_id = user_uuid and role = 'admin'
  );
$$;

-- ── group_members ────────────────────────────────────────────

drop policy if exists "Group members can view members"  on group_members;
drop policy if exists "Group admins can manage members" on group_members;

-- SELECT: user can see any row in a group they belong to
create policy "Group members can view members"
  on group_members for select using (
    is_group_member(group_id, auth.uid())
  );

-- UPDATE: only admins can change roles
create policy "Group admins can manage members"
  on group_members for update using (
    is_group_admin(group_id, auth.uid())
  );

-- ── groups ───────────────────────────────────────────────────

drop policy if exists "Group members can view groups"  on groups;
drop policy if exists "Group admins can update groups" on groups;
drop policy if exists "Group admins can delete groups" on groups;

create policy "Group members can view groups"
  on groups for select using (
    is_group_member(id, auth.uid())
  );

create policy "Group admins can update groups"
  on groups for update using (
    is_group_admin(id, auth.uid())
  );

create policy "Group admins can delete groups"
  on groups for delete using (
    is_group_admin(id, auth.uid())
  );
