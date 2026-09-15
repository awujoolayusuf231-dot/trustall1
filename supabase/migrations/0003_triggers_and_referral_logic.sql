-- Referral code generation, referral crediting, fulfillment/dispute timestamp logic
-- (payout 3h, dispute window 2 days — two separate clocks), admin function security.

create or replace function public.generate_referral_code()
returns trigger language plpgsql as $$
begin
  if new.referral_code is null then
    new.referral_code := substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  end if;
  return new;
end; $$;
drop trigger if exists trg_generate_referral_code on public.profiles;
create trigger trg_generate_referral_code before insert on public.profiles for each row execute function public.generate_referral_code();
update public.profiles set referral_code = substr(replace(gen_random_uuid()::text, '-', ''), 1, 8) where referral_code is null;

-- capture referred_by at signup from ref_code passed in user metadata
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_referrer_id uuid;
begin
  if new.raw_user_meta_data->>'ref_code' is not null then
    select id into v_referrer_id from public.profiles where referral_code = new.raw_user_meta_data->>'ref_code';
  end if;
  insert into public.profiles (id, full_name, referred_by)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), v_referrer_id)
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.is_admin() from anon, authenticated;

-- payout release: buyer confirm or auto after 3 hours. dispute window: separate 2-day clock.
create or replace function public.set_fulfillment_timestamps()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.status = 'fulfilled' and old.status is distinct from 'fulfilled' then
    new.fulfilled_at := now(); new.auto_confirm_at := now() + interval '3 hours';
    new.escrow_release_at := now() + interval '3 hours'; new.dispute_deadline_at := now() + interval '2 days';
  end if;
  if new.status = 'confirmed' and old.status is distinct from 'confirmed' then
    new.confirmed_at := now(); new.released_at := now();
    if new.dispute_deadline_at is null then new.dispute_deadline_at := now() + interval '2 days'; end if;
  end if;
  if new.transaction_type = 'digital_instant' and new.status = 'paid' and old.status is distinct from 'paid' then
    new.status := 'confirmed'; new.fulfilled_at := now(); new.confirmed_at := now();
    new.released_at := now(); new.dispute_deadline_at := now() + interval '2 days';
  end if;
  return new;
end; $$;
drop trigger if exists trg_set_fulfillment_timestamps on public.orders;
create trigger trg_set_fulfillment_timestamps before update on public.orders for each row execute function public.set_fulfillment_timestamps();

create or replace function public.set_fulfillment_timestamps_on_insert()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.transaction_type = 'digital_instant' and new.status = 'paid' then
    new.status := 'confirmed'; new.fulfilled_at := now(); new.confirmed_at := now();
    new.released_at := now(); new.dispute_deadline_at := now() + interval '2 days';
  end if;
  return new;
end; $$;
drop trigger if exists trg_set_fulfillment_timestamps_insert on public.orders;
create trigger trg_set_fulfillment_timestamps_insert before insert on public.orders for each row execute function public.set_fulfillment_timestamps_on_insert();

create or replace function public.auto_confirm_overdue_orders()
returns void language sql as $$
  update public.orders set status = 'confirmed', confirmed_at = now()
  where status = 'fulfilled' and auto_confirm_at is not null and auto_confirm_at <= now();
$$;
select cron.schedule('auto-confirm-orders', '*/10 * * * *', $$select public.auto_confirm_overdue_orders();$$);

-- seller level recalculation (0=unverified,1=verified,2=30rev+₦200k,3=60rev+₦500k; level 4 is the separate pro_vendor flag)
create or replace function public.recalculate_seller_stats(p_seller_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_review_count int; v_sales_volume numeric; v_verified boolean; v_new_level int;
begin
  select count(*) into v_review_count from public.reviews where seller_id = p_seller_id;
  select coalesce(sum(amount), 0) into v_sales_volume from public.orders where seller_id = p_seller_id and status = 'confirmed';
  select verified_seller into v_verified from public.profiles where id = p_seller_id;
  v_new_level := case when not v_verified then 0
    when v_review_count >= 60 and v_sales_volume >= 500000 then 3
    when v_review_count >= 30 and v_sales_volume >= 200000 then 2 else 1 end;
  update public.profiles set
    completed_sales_count = (select count(*) from public.orders where seller_id = p_seller_id and status = 'confirmed'),
    total_sales_volume = v_sales_volume,
    avg_rating = (select round(avg(rating), 2) from public.reviews where seller_id = p_seller_id),
    seller_level = v_new_level
  where id = p_seller_id;
end; $$;
revoke execute on function public.recalculate_seller_stats(uuid) from anon, authenticated;

create or replace function public.on_order_confirmed()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.status = 'confirmed' and old.status is distinct from 'confirmed' then
    perform public.recalculate_seller_stats(new.seller_id);
    update public.profiles set completed_purchases_count = completed_purchases_count + 1 where id = new.buyer_id;
  end if;
  return new;
end; $$;
drop trigger if exists trg_on_order_confirmed on public.orders;
create trigger trg_on_order_confirmed after update on public.orders for each row execute function public.on_order_confirmed();

create or replace function public.on_review_added()
returns trigger language plpgsql set search_path = public as $$
begin perform public.recalculate_seller_stats(new.seller_id); return new; end; $$;
drop trigger if exists trg_on_review_added on public.reviews;
create trigger trg_on_review_added after insert on public.reviews for each row execute function public.on_review_added();

-- referral bonus credited once the referred user's FIRST order is confirmed
create or replace function public.on_first_order_confirmed_referral()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_referrer uuid; v_is_first_order boolean;
begin
  if new.status = 'confirmed' and old.status is distinct from 'confirmed' then
    select referred_by into v_referrer from public.profiles where id = new.buyer_id or id = new.seller_id limit 1;
    if v_referrer is not null then
      select not exists (select 1 from public.orders where (buyer_id = new.buyer_id or seller_id = new.seller_id) and status = 'confirmed' and id <> new.id) into v_is_first_order;
      if v_is_first_order then
        insert into public.referral_bonuses (referrer_id, referred_id, triggering_order_id, status, cleared_at)
        values (v_referrer, coalesce(new.buyer_id, new.seller_id), new.id, 'cleared', now())
        on conflict (referrer_id, referred_id) do nothing;
        update public.profiles set wallet_cleared = wallet_cleared + 1000 where id = v_referrer;
      end if;
    end if;
  end if;
  return new;
end; $$;
drop trigger if exists trg_referral_on_confirm on public.orders;
create trigger trg_referral_on_confirm after update on public.orders for each row execute function public.on_first_order_confirmed_referral();
