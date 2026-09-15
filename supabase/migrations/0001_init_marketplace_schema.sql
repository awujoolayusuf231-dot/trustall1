-- Core schema: profiles, verification, listings, chat, offers, orders.
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, phone text, phone_verified boolean not null default false,
  role text not null default 'user' check (role in ('user','admin')),
  is_seller boolean not null default false, verified_seller boolean not null default false,
  pro_vendor boolean not null default false, paystack_subaccount_code text,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create table public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  legal_name text not null, id_type text not null check (id_type in ('NIN','CAC')),
  id_number text not null, document_url text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references public.profiles(id), reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  title text not null, description text, price numeric(12,2) not null, category text,
  images text[] not null default '{}', is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete set null,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (listing_id, buyer_id, seller_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text, attachment_url text, created_at timestamptz not null default now()
);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  item_title text not null, item_description text, price numeric(12,2) not null,
  delivery_fee numeric(12,2) not null default 0,
  status text not null default 'pending' check (status in ('pending','accepted','declined','expired')),
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers(id) on delete restrict,
  buyer_id uuid not null references public.profiles(id), seller_id uuid not null references public.profiles(id),
  amount numeric(12,2) not null, delivery_fee numeric(12,2) not null default 0,
  platform_commission numeric(12,2) not null, seller_payout numeric(12,2) not null,
  paystack_reference text, status text not null default 'paid' check (status in ('paid','fulfilled','confirmed','disputed')),
  fulfilled_at timestamptz, confirmed_at timestamptz, auto_confirm_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.verification_requests enable row level security;
alter table public.listings enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.offers enable row level security;
alter table public.orders enable row level security;

create policy "Profiles are publicly viewable" on public.profiles for select using (true);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Admins can update any profile" on public.profiles for update using (public.is_admin()) with check (public.is_admin());

create policy "Sellers view own verification" on public.verification_requests for select using (seller_id = auth.uid() or public.is_admin());
create policy "Sellers submit verification" on public.verification_requests for insert with check (seller_id = auth.uid());
create policy "Admins review verification" on public.verification_requests for update using (public.is_admin()) with check (public.is_admin());

create policy "Active listings are public" on public.listings for select using (is_active = true or seller_id = auth.uid() or public.is_admin());
create policy "Sellers manage own listings" on public.listings for all using (seller_id = auth.uid() or public.is_admin()) with check (seller_id = auth.uid() or public.is_admin());

create policy "Participants view own conversations" on public.conversations for select using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());
create policy "Buyers start conversations" on public.conversations for insert with check (buyer_id = auth.uid());

create policy "Participants view own messages" on public.messages for select using (
  exists (select 1 from public.conversations c where c.id = conversation_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())) or public.is_admin());
create policy "Participants send messages" on public.messages for insert with check (
  sender_id = auth.uid() and exists (select 1 from public.conversations c where c.id = conversation_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())));

create policy "Participants view own offers" on public.offers for select using (
  exists (select 1 from public.conversations c where c.id = conversation_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())) or public.is_admin());
create policy "Sellers create offers in their own conversations" on public.offers for insert with check (
  seller_id = auth.uid() and exists (select 1 from public.conversations c where c.id = conversation_id and c.seller_id = auth.uid()));
create policy "Sellers update own offers" on public.offers for update using (seller_id = auth.uid());

create policy "Participants view own orders" on public.orders for select using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());
create policy "Sellers mark fulfilled" on public.orders for update using (seller_id = auth.uid() or buyer_id = auth.uid() or public.is_admin());

insert into storage.buckets (id, name, public) values ('verification-docs', 'verification-docs', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('listing-images', 'listing-images', true) on conflict (id) do nothing;
create policy "Sellers upload own verification docs" on storage.objects for insert with check (bucket_id = 'verification-docs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Sellers view own verification docs" on storage.objects for select using (bucket_id = 'verification-docs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "Public can view listing images" on storage.objects for select using (bucket_id = 'listing-images');
create policy "Sellers upload own listing images" on storage.objects for insert with check (bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text);

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.offers;
