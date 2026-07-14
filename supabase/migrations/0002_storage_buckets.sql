-- Storage buckets + policies for specimen photos and Visual Check uploads.
-- Buckets are private; access via signed URLs / authenticated uploads scoped by path.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('specimen-photos', 'specimen-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('check-uploads', 'check-uploads', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Specimen photos: path prefix = auth.uid()/...
create policy specimen_photos_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'specimen-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy specimen_photos_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'specimen-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy specimen_photos_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'specimen-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy specimen_photos_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'specimen-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Check uploads: path prefix = auth.uid()/...
create policy check_uploads_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'check-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy check_uploads_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'check-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy check_uploads_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'check-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
