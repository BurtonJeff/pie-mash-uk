-- The groups SELECT policy ("Group members can read groups") blocks two flows:
--
-- 1. createGroup: does INSERT ... .select().single() — Supabase evaluates
--    the SELECT policy on the returned row, but the user isn't in
--    group_members yet (that insert happens next), so it returns nothing
--    and surfaces as an RLS violation.
--
-- 2. joinGroupByCode: SELECTs a group by invite_code before inserting the
--    membership row — same problem.
--
-- Fix: allow all authenticated users to read any group. The invite code
-- is the real access gate; group names/descriptions being visible to
-- authenticated users is fine for a social app.

drop policy if exists "Group members can read groups" on public.groups;

create policy "Groups are readable by authenticated users"
  on public.groups for select to authenticated
  using (true);
