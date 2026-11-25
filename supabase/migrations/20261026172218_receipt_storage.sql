-- Private bucket for receipt photos. Each user's files live under a folder
-- named with their user id: receipts/<user_id>/<file>.jpg
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy "receipts: read own" on storage.objects
  for select to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "receipts: upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "receipts: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Speeds up the daily scan-limit count.
create index receipts_user_created_idx on public.receipts (user_id, created_at desc);
drop index if exists public.receipts_user_id_idx;
