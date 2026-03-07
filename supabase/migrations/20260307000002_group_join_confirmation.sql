-- Add requires_confirmation to groups
alter table public.groups
  add column requires_confirmation boolean not null default false;

-- Add status column to group_members
alter table public.group_members
  add column status text not null default 'active';

alter table public.group_members
  add constraint group_members_status_check check (status in ('active', 'pending'));

-- Update is_group_member to only count active members (pending members cannot
-- read group content until approved).
create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from group_members
    where group_id = p_group_id and user_id = auth.uid() and status = 'active'
  );
$$;

-- Update is_group_admin similarly.
create or replace function public.is_group_admin(p_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from group_members
    where group_id = p_group_id and user_id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

-- Allow group admins to update member status (approve / reject pending requests).
create policy "Group admins can update member status"
  on public.group_members for update to authenticated
  using (is_group_admin(group_id))
  with check (is_group_admin(group_id));

-- Allow pending members to read their own row so the app can check their status.
create policy "Users can read their own membership"
  on public.group_members for select to authenticated
  using (user_id = auth.uid());
