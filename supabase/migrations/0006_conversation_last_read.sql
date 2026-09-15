alter table public.conversations
  add column if not exists buyer_last_read_at timestamptz,
  add column if not exists seller_last_read_at timestamptz;

insert into storage.buckets (id, name, public)
  values ('message-attachments', 'message-attachments', true)
  on conflict (id) do nothing;
