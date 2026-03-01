-- Storage buckets for user-generated content
insert into storage.buckets (id, name, public)
values
  ('shop-photos', 'shop-photos', true),
  ('checkin-photos', 'checkin-photos', true)
on conflict (id) do nothing;

-- Authenticated users can upload checkin photos
create policy "Authenticated users can upload checkin photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'checkin-photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- Anyone can read checkin photos
create policy "Checkin photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'checkin-photos');

-- Users can delete their own checkin photos
create policy "Users can delete own checkin photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'checkin-photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- Admins manage shop photos (via service role — no RLS policy needed for service role)
-- Anyone can read shop photos
create policy "Shop photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'shop-photos');
