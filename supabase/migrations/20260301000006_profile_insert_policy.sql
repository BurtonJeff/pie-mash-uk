-- Allow authenticated users to insert their own profile row
-- (handles cases where the handle_new_user trigger didn't fire)
create policy "Users can insert own profile"
  on public.profiles for insert to authenticated
  with check (id = auth.uid());
