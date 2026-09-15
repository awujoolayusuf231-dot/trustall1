-- Add product type, variants, and services included to offers table
alter table public.offers
  add column if not exists product_type text default 'physical' check (product_type in ('physical', 'service')),
  add column if not exists variants jsonb,
  add column if not exists services_included jsonb;

-- Add service_details for service-type offers
alter table public.offers
  add column if not exists service_details text;

-- Create index for faster queries
create index if not exists idx_offers_product_type on public.offers(product_type);
