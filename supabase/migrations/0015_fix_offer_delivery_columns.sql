-- Ensure the offers table has the required delivery and product fields.
-- This fixes the runtime error: "Could not find the 'delivery_type' column of 'offers' in the schema cache"

alter table public.offers
  add column if not exists delivery_address text,
  add column if not exists delivery_type text default 'normal' check (delivery_type in ('fast', 'normal')),
  add column if not exists delivery_date timestamptz,
  add column if not exists fast_delivery_price numeric(12,2) default 500,
  add column if not exists normal_delivery_price numeric(12,2),
  add column if not exists product_type text default 'physical' check (product_type in ('physical', 'service')),
  add column if not exists variants jsonb,
  add column if not exists services_included jsonb,
  add column if not exists service_details text;

create index if not exists idx_offers_product_type on public.offers(product_type);
create index if not exists idx_offers_delivery_type on public.offers(delivery_type);
