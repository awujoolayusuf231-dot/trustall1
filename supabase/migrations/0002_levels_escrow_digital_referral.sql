-- Seller levels, escrow/fee model, digital products, referral engine, moderation.

alter table public.profiles
  add column if not exists handle text unique, add column if not exists business_name text,
  add column if not exists state text, add column if not exists bio text, add column if not exists avatar_url text,
  add column if not exists seller_level int not null default 0 check (seller_level between 0 and 4),
  add column if not exists pro_buyer boolean not null default false,
  add column if not exists completed_sales_count int not null default 0,
  add column if not exists completed_purchases_count int not null default 0,
  add column if not exists avg_rating numeric(3,2), add column if not exists total_sales_volume numeric(14,2) not null default 0,
  add column if not exists status text not null default 'active' check (status in ('active','warned','suspended')),
  add column if not exists warning_count int not null default 0,
  add column if not exists referral_code text unique, add column if not exists referred_by uuid references public.profiles(id),
  add column if not exists wallet_pending numeric(12,2) not null default 0, add column if not exists wallet_cleared numeric(12,2) not null default 0;

create index if not exists idx_profiles_handle on public.profiles(handle);
create index if not exists idx_profiles_state on public.profiles(state);
create index if not exists idx_profiles_business_name on public.profiles(business_name);

alter table public.listings add column if not exists slug text unique;
alter table public.listings add column if not exists product_type text not null default 'physical' check (product_type in ('physical','digital_instant','digital_service'));
alter table public.listings add column if not exists digital_file_path text;
create index if not exists idx_listings_category on public.listings(category);

alter table public.orders
  add column if not exists seller_fee numeric(12,2), add column if not exists buyer_fee numeric(12,2) not null default 100,
  add column if not exists transaction_type text not null default 'physical' check (transaction_type in ('physical','digital_instant','digital_service')),
  add column if not exists escrow_release_at timestamptz, add column if not exists released_at timestamptz,
  add column if not exists dispute_status text not null default 'none' check (dispute_status in ('none','raised','resolved')),
  add column if not exists dispute_deadline_at timestamptz;

create or replace function public.compute_order_fees(p_amount numeric, p_delivery_fee numeric)
returns table (seller_fee numeric, buyer_fee numeric, seller_payout numeric, total_charged numeric)
language sql immutable as $$
  select least(round((p_amount + p_delivery_fee) * 0.05, 2), 5000) as seller_fee, 100::numeric as buyer_fee,
    (p_amount + p_delivery_fee) - least(round((p_amount + p_delivery_fee) * 0.05, 2), 5000) as seller_payout,
    (p_amount + p_delivery_fee) + 100 as total_charged;
$$;

create table public.reviews (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade unique,
  reviewer_id uuid not null references public.profiles(id), seller_id uuid not null references public.profiles(id),
  rating int not null check (rating between 1 and 5), comment text, created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(), reporter_id uuid not null references public.profiles(id),
  reported_id uuid not null references public.profiles(id), order_id uuid references public.orders(id),
  reason text not null, details text, is_dispute boolean not null default false,
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now()
);

create table public.account_warnings (
  id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null, issued_by uuid references public.profiles(id), created_at timestamptz not null default now()
);

alter table public.messages add column if not exists flagged boolean not null default false;
alter table public.messages add column if not exists flagged_reason text;

create or replace function public.flag_sensitive_message()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.body is not null and (new.body ~* '\mbank\M' or new.body ~* '\maccount name\M' or new.body ~* '\mbank name\M' or new.body ~* '\maccount number\M') then
    new.flagged := true; new.flagged_reason := 'possible bank detail shared';
  end if;
  return new;
end; $$;
drop trigger if exists trg_flag_sensitive_message on public.messages;
create trigger trg_flag_sensitive_message before insert on public.messages for each row execute function public.flag_sensitive_message();

create table public.marketing_packages (
  id uuid primary key default gen_random_uuid(), name text not null,
  platform text not null check (platform in ('facebook','tiktok','both')), duration_weeks int not null default 2,
  price_ngn numeric(12,2) not null, description text, is_active boolean not null default true,
  display_order int not null default 0, created_at timestamptz not null default now()
);

create table public.pro_vendor_payments (
  id uuid primary key default gen_random_uuid(), seller_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(12,2) not null default 5000, paystack_reference text,
  status text not null default 'pending' check (status in ('pending','success','failed')), created_at timestamptz not null default now()
);

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(), title text not null, slug text not null unique,
  excerpt text, content text, cover_image_url text, author_id uuid references public.profiles(id),
  is_published boolean not null default false, published_at timestamptz, created_at timestamptz not null default now()
);

create table public.referral_bonuses (
  id uuid primary key default gen_random_uuid(), referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_id uuid not null references public.profiles(id) on delete cascade, triggering_order_id uuid references public.orders(id),
  amount numeric(12,2) not null default 1000, status text not null default 'pending' check (status in ('pending','cleared','paid')),
  created_at timestamptz not null default now(), cleared_at timestamptz, unique (referrer_id, referred_id)
);

alter table public.reviews enable row level security;
alter table public.reports enable row level security;
alter table public.account_warnings enable row level security;
alter table public.marketing_packages enable row level security;
alter table public.pro_vendor_payments enable row level security;
alter table public.blog_posts enable row level security;
alter table public.referral_bonuses enable row level security;

create policy "Reviews are publicly viewable" on public.reviews for select using (true);
create policy "Buyers review only confirmed orders" on public.reviews for insert with check (
  reviewer_id = auth.uid() and exists (select 1 from public.orders o where o.id = order_id and o.buyer_id = auth.uid() and o.status = 'confirmed'));

create policy "Users view own reports" on public.reports for select using (reporter_id = auth.uid() or reported_id = auth.uid() or public.is_admin());
create policy "Users can file reports" on public.reports for insert with check (reporter_id = auth.uid());
create policy "Admins manage reports" on public.reports for update using (public.is_admin()) with check (public.is_admin());

create policy "Users view own warnings" on public.account_warnings for select using (profile_id = auth.uid() or public.is_admin());
create policy "Admins issue warnings" on public.account_warnings for insert with check (public.is_admin());

create policy "Active marketing packages are public" on public.marketing_packages for select using (is_active = true or public.is_admin());
create policy "Admins manage marketing packages" on public.marketing_packages for all using (public.is_admin()) with check (public.is_admin());

create policy "Sellers view own pro vendor payments" on public.pro_vendor_payments for select using (seller_id = auth.uid() or public.is_admin());
create policy "Sellers start a pro vendor payment" on public.pro_vendor_payments for insert with check (seller_id = auth.uid() and status = 'pending');

create policy "Public views published posts" on public.blog_posts for select using (is_published = true or public.is_admin());
create policy "Admins manage posts" on public.blog_posts for all using (public.is_admin()) with check (public.is_admin());

create policy "Users view own referral bonuses" on public.referral_bonuses for select using (referrer_id = auth.uid() or public.is_admin());

insert into storage.buckets (id, name, public) values ('digital-products', 'digital-products', false) on conflict (id) do nothing;
create policy "Sellers upload own digital products" on storage.objects for insert with check (bucket_id = 'digital-products' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Buyers download purchased digital files" on storage.objects for select using (
  bucket_id = 'digital-products' and exists (
    select 1 from public.orders o join public.listings l on l.seller_id = o.seller_id
    where o.buyer_id = auth.uid() and o.status = 'confirmed' and l.digital_file_path = storage.objects.name));
create policy "Sellers view own digital products" on storage.objects for select using (bucket_id = 'digital-products' and (storage.foldername(name))[1] = auth.uid()::text);
