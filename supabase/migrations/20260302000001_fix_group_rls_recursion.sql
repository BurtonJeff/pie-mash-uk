-- Fix infinite recursion in group_members RLS policies.
--
-- Root cause: policies on group_members, groups, group_messages, and
-- challenges all call `SELECT ... FROM group_members`, which triggers
-- the group_members SELECT policy again → infinite recursion.
--
-- Fix: two SECURITY DEFINER functions that query group_members without
-- going through RLS, then rewrite all affected policies to use them.

-- ── Helper functions ──────────────────────────────────────────────────────────

create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from group_members
    where group_id = p_group_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_group_admin(p_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from group_members
    where group_id = p_group_id and user_id = auth.uid() and role = 'admin'
  );
$$;

-- ── group_members ─────────────────────────────────────────────────────────────

drop policy if exists "Group members can read membership" on public.group_members;
drop policy if exists "Group admins can remove members" on public.group_members;

create policy "Group members can read membership"
  on public.group_members for select to authenticated
  using (is_group_member(group_id));

create policy "Group admins can remove members"
  on public.group_members for delete to authenticated
  using (is_group_admin(group_id));

-- ── groups ────────────────────────────────────────────────────────────────────

drop policy if exists "Group members can read groups" on public.groups;
drop policy if exists "Group admins can update their groups" on public.groups;

create policy "Group members can read groups"
  on public.groups for select to authenticated
  using (is_group_member(id));

create policy "Group admins can update their groups"
  on public.groups for update to authenticated
  using (is_group_admin(id));

-- ── group_messages ────────────────────────────────────────────────────────────

drop policy if exists "Group members can read messages" on public.group_messages;
drop policy if exists "Group members can post messages" on public.group_messages;

create policy "Group members can read messages"
  on public.group_messages for select to authenticated
  using (is_group_member(group_id));

create policy "Group members can post messages"
  on public.group_messages for insert to authenticated
  with check (user_id = auth.uid() and is_group_member(group_id));

-- ── challenges ────────────────────────────────────────────────────────────────

drop policy if exists "Group challenges readable by members" on public.challenges;
drop policy if exists "Group admins can create group challenges" on public.challenges;

create policy "Group challenges readable by members"
  on public.challenges for select to authenticated
  using (scope = 'group' and is_group_member(group_id));

create policy "Group admins can create group challenges"
  on public.challenges for insert to authenticated
  with check (
    scope = 'group' and
    created_by = auth.uid() and
    is_group_admin(group_id)
  );
