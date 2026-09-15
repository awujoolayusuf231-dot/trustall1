-- Add services_included field to listings table for service/freelance offerings
alter table public.listings
  add column if not exists services_included jsonb;

-- Create index for faster queries
create index if not exists idx_listings_services on public.listings using gin(services_included);
