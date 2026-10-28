alter table public.messages
  add column if not exists is_read boolean not null default false,
  add column if not exists read_at timestamptz;

create index if not exists idx_messages_conversation_read
  on public.messages (conversation_id, sender_id, is_read, read_at);

alter publication supabase_realtime add table public.messages;
