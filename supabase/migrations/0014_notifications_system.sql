-- Create notifications table and trigger for message notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  type text not null check (type in ('new_message', 'offer_received', 'offer_accepted', 'order_confirmed', 'delivery_confirmed', 'payment_released', 'review_received', 'verification_decided')),
  title text not null,
  message text,
  related_conversation_id uuid references public.conversations(id) on delete cascade,
  related_offer_id uuid references public.offers(id) on delete cascade,
  related_order_id uuid references public.orders(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_notifications_recipient on public.notifications(recipient_id);
create index if not exists idx_notifications_unread on public.notifications(recipient_id) where read_at is null;
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);

-- Function to insert notification when message is sent
create or replace function public.on_new_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_recipient_id uuid;
  v_sender_name text;
begin
  -- Determine recipient (the other person in the conversation)
  select 
    case 
      when new.sender_id = c.buyer_id then c.seller_id
      else c.buyer_id
    end,
    coalesce(p.business_name, p.full_name, 'User')
  into v_recipient_id, v_sender_name
  from public.conversations c
  left join public.profiles p on p.id = new.sender_id
  where c.id = new.conversation_id
  limit 1;

  -- Insert notification
  if v_recipient_id is not null then
    insert into public.notifications (
      recipient_id,
      sender_id,
      type,
      title,
      message,
      related_conversation_id,
      created_at
    ) values (
      v_recipient_id,
      new.sender_id,
      'new_message',
      v_sender_name || ' sent you a message',
      new.body,
      new.conversation_id,
      now()
    );
  end if;

  return new;
end;
$$;

-- Trigger for new messages
drop trigger if exists trg_on_new_message on public.messages;
create trigger trg_on_new_message
  after insert on public.messages
  for each row
  execute function public.on_new_message();
