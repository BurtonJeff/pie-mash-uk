-- Allow admins to insert check-ins on behalf of any user (manual check-in feature).

create policy "Admins can insert check-ins for any user"
  on public.checkins for insert to authenticated
  with check (is_admin());
