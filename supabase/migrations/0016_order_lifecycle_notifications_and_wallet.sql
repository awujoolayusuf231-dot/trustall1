-- Reconcile offer/order lifecycle events with wallet state and real-time notifications.

alter publication supabase_realtime add table public.notifications;

create or replace function public.notify_offer_accepted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer_id uuid;
  v_seller_id uuid;
  v_title text;
  v_conversation_id uuid;
begin
  if tg_op = 'UPDATE' and new.status = 'accepted' and old.status is distinct from 'accepted' then
    select c.buyer_id, c.seller_id, o.item_title, c.id
      into v_buyer_id, v_seller_id, v_title, v_conversation_id
    from public.conversations c
    join public.offers o on o.conversation_id = c.id
    where o.id = new.id;

    if v_seller_id is not null then
      insert into public.notifications (
        recipient_id,
        sender_id,
        type,
        title,
        message,
        related_conversation_id,
        related_offer_id
      )
      select
        v_seller_id,
        v_buyer_id,
        'offer_accepted',
        'Offer accepted',
        'Your offer for ' || v_title || ' has been accepted and payment is secured.',
        v_conversation_id,
        new.id
      where not exists (
        select 1 from public.notifications n
        where n.recipient_id = v_seller_id
          and n.related_offer_id = new.id
          and n.type = 'offer_accepted'
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_offer_accepted on public.offers;
create trigger trg_notify_offer_accepted
  after update on public.offers
  for each row
  execute function public.notify_offer_accepted();

create or replace function public.notify_fulfilled_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer_id uuid;
  v_seller_id uuid;
  v_title text;
  v_conversation_id uuid;
begin
  if tg_op = 'UPDATE' and new.status = 'fulfilled' and old.status is distinct from 'fulfilled' then
    select o.buyer_id, o.seller_id, ofr.item_title, ofr.conversation_id
      into v_buyer_id, v_seller_id, v_title, v_conversation_id
    from public.orders o
    join public.offers ofr on ofr.id = o.offer_id
    where o.id = new.id;

    if v_buyer_id is not null then
      insert into public.notifications (
        recipient_id,
        sender_id,
        type,
        title,
        message,
        related_order_id,
        related_conversation_id
      )
      select
        v_buyer_id,
        v_seller_id,
        'delivery_confirmed',
        'Delivery sent',
        'The seller has marked ' || v_title || ' as delivered. Please confirm receipt to release payment.',
        new.id,
        v_conversation_id
      where not exists (
        select 1 from public.notifications n
        where n.recipient_id = v_buyer_id
          and n.related_order_id = new.id
          and n.type = 'delivery_confirmed'
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_fulfilled_order on public.orders;
create trigger trg_notify_fulfilled_order
  after update on public.orders
  for each row
  execute function public.notify_fulfilled_order();

create or replace function public.record_payment_as_pending(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller_id uuid;
  v_buyer_id uuid;
  v_title text;
  v_conversation_id uuid;
  v_seller_payout numeric;
begin
  select seller_id, buyer_id, seller_payout
    into v_seller_id, v_buyer_id, v_seller_payout
  from public.orders
  where id = p_order_id;

  if v_seller_id is null then
    return jsonb_build_object('success', false, 'error', 'Order not found');
  end if;

  update public.orders
  set status = 'paid'
  where id = p_order_id and status <> 'paid';

  update public.profiles
  set wallet_pending = coalesce(wallet_pending, 0) + coalesce(v_seller_payout, 0)
  where id = v_seller_id;

  select ofr.item_title, ofr.conversation_id
    into v_title, v_conversation_id
  from public.offers ofr
  join public.orders o on o.offer_id = ofr.id
  where o.id = p_order_id;

  insert into public.notifications (
    recipient_id,
    sender_id,
    type,
    title,
    message,
    related_order_id,
    related_conversation_id
  )
  select
    v_seller_id,
    v_buyer_id,
    'offer_accepted',
    'Buyer payment secured',
    'Payment for ' || coalesce(v_title, 'your item') || ' has been secured and is pending delivery confirmation.',
    p_order_id,
    v_conversation_id
  where not exists (
    select 1 from public.notifications n
    where n.recipient_id = v_seller_id
      and n.related_order_id = p_order_id
      and n.type = 'offer_accepted'
  );

  return jsonb_build_object('success', true, 'order_id', p_order_id);
end;
$$;

create or replace function public.confirm_delivery_and_release_payment(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller_id uuid;
  v_buyer_id uuid;
  v_seller_payout numeric;
  v_title text;
  v_conversation_id uuid;
begin
  select seller_id, buyer_id, seller_payout
    into v_seller_id, v_buyer_id, v_seller_payout
  from public.orders
  where id = p_order_id;

  if v_seller_id is null then
    return jsonb_build_object('success', false, 'error', 'Order not found');
  end if;

  update public.orders
  set status = 'confirmed',
      confirmed_at = coalesce(confirmed_at, now()),
      released_at = coalesce(released_at, now())
  where id = p_order_id and status <> 'confirmed';

  update public.profiles p
  set wallet_pending = greatest(coalesce(wallet_pending, 0) - coalesce(o.seller_payout, 0), 0),
      wallet_cleared = coalesce(wallet_cleared, 0) + coalesce(o.seller_payout, 0)
  from public.orders o
  where p.id = o.seller_id and o.id = p_order_id;

  select ofr.item_title, ofr.conversation_id
    into v_title, v_conversation_id
  from public.offers ofr
  join public.orders o on o.offer_id = ofr.id
  where o.id = p_order_id;

  insert into public.notifications (
    recipient_id,
    sender_id,
    type,
    title,
    message,
    related_order_id,
    related_conversation_id
  )
  select * from (
    values
      (v_seller_id, v_buyer_id, 'payment_released', 'Payment released', 'Payment for ' || coalesce(v_title, 'your item') || ' has been released to your wallet.', p_order_id, v_conversation_id),
      (v_buyer_id, v_seller_id, 'order_confirmed', 'Order completed', 'You confirmed delivery for ' || coalesce(v_title, 'this order') || '. The seller has been paid.', p_order_id, v_conversation_id)
  ) as v(recipient_id, sender_id, type, title, message, related_order_id, related_conversation_id)
  where not exists (
    select 1 from public.notifications n
    where n.related_order_id = p_order_id
      and n.type = v.type
      and n.recipient_id = v.recipient_id
  );

  return jsonb_build_object('success', true, 'order_id', p_order_id);
end;
$$;

-- Ensure any direct state changes still keep wallet figures consistent after confirmation.
create or replace function public.on_order_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'confirmed' and old.status is distinct from 'confirmed' then
    perform public.recalculate_seller_stats(new.seller_id);
    update public.profiles set completed_purchases_count = completed_purchases_count + 1 where id = new.buyer_id;

    update public.profiles p
    set wallet_pending = greatest(coalesce(wallet_pending, 0) - coalesce(new.seller_payout, 0), 0),
        wallet_cleared = coalesce(wallet_cleared, 0) + coalesce(new.seller_payout, 0)
    where p.id = new.seller_id;

    insert into public.notifications (
      recipient_id,
      sender_id,
      type,
      title,
      message,
      related_order_id
    )
    select * from (
      values
        (new.seller_id, new.buyer_id, 'payment_released', 'Payment released', 'Funds for order #' || substr(new.id::text, 1, 8) || ' are now available in your wallet.', new.id),
        (new.buyer_id, new.seller_id, 'order_confirmed', 'Order completed', 'You confirmed receipt of this order and the seller has been paid.', new.id)
    ) as v(recipient_id, sender_id, type, title, message, related_order_id)
    where not exists (
      select 1 from public.notifications n
      where n.related_order_id = new.id
        and n.type = v.type
        and n.recipient_id = v.recipient_id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_on_order_confirmed on public.orders;
create trigger trg_on_order_confirmed
  after update on public.orders
  for each row
  execute function public.on_order_confirmed();
