create table if not exists public.message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  file_url text not null,
  file_type text not null check (file_type in ('image','video')),
  created_at timestamptz not null default now()
);

alter table public.message_attachments enable row level security;

create index if not exists idx_message_attachments_message_id
  on public.message_attachments (message_id);

create policy "Participants view message attachments"
on public.message_attachments for select
using (
  exists (
    select 1
    from public.messages m
    join public.conversations c on c.id = m.conversation_id
    where m.id = message_attachments.message_id
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  )
  or public.is_admin()
);

create policy "Participants insert message attachments"
on public.message_attachments for insert
with check (
  exists (
    select 1
    from public.messages m
    join public.conversations c on c.id = m.conversation_id
    where m.id = message_attachments.message_id
      and m.sender_id = auth.uid()
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  )
  or public.is_admin()
);

create policy "Participants delete own message attachments"
on public.message_attachments for delete
using (
  exists (
    select 1
    from public.messages m
    join public.conversations c on c.id = m.conversation_id
    where m.id = message_attachments.message_id
      and m.sender_id = auth.uid()
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  )
  or public.is_admin()
);

create policy "Public read uploaded chat media"
on storage.objects for select
using (bucket_id = 'message-attachments');

create policy "Authenticated users upload chat media"
on storage.objects for insert
with check (
  bucket_id = 'message-attachments'
  and auth.uid() is not null
);

create policy "Authenticated users update their chat media"
on storage.objects for update
using (bucket_id = 'message-attachments' and auth.uid() is not null)
with check (bucket_id = 'message-attachments' and auth.uid() is not null);

create policy "Authenticated users delete chat media"
on storage.objects for delete
using (bucket_id = 'message-attachments' and auth.uid() is not null);
