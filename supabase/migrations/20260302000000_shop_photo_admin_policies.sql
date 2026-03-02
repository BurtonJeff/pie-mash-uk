-- Allow authenticated users (admins) to upload/update/delete from shop-photos storage bucket
create policy "Authenticated users can upload shop photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'shop-photos');

create policy "Authenticated users can update shop photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'shop-photos');

create policy "Authenticated users can delete shop photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'shop-photos');

-- Allow authenticated users to manage shop_photos records
create policy "Authenticated users can insert shop photo records"
  on public.shop_photos for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update shop photo records"
  on public.shop_photos for update
  to authenticated
  using (true);

create policy "Authenticated users can delete shop photo records"
  on public.shop_photos for delete
  to authenticated
  using (true);
