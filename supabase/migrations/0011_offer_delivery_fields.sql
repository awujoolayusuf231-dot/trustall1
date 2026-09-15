-- Add delivery fields to offers table for enhanced offer management
alter table public.offers
  add column if not exists delivery_address text,
  add column if not exists delivery_type text default 'normal' check (delivery_type in ('fast', 'normal')),
  add column if not exists delivery_date timestamptz,
  add column if not exists fast_delivery_price numeric(12,2) default 500,
  add column if not exists normal_delivery_price numeric(12,2);
