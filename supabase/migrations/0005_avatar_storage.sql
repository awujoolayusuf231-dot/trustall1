alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists business_logo_url text;

insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;
create policy "Users upload own avatars" on storage.objects for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Public can view avatars" on storage.objects for select using (bucket_id = 'avatars');
create policy "Users update own avatars" on storage.objects for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users delete own avatars" on storage.objects for delete using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
