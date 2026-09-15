alter table public.offers
  add column if not exists delivery_speed text not null default 'standard' check (delivery_speed in ('standard', 'fast')),
  add column if not exists delivery_address text,
  add column if not exists delivery_date date,
  add column if not exists delivery_time time,
  add column if not exists delivery_deadline timestamptz;

alter table public.orders
  add column if not exists delivery_speed text,
  add column if not exists delivery_address text,
  add column if not exists delivery_date date,
  add column if not exists delivery_time time,
  add column if not exists delivery_deadline timestamptz;

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('paid','fulfilled','confirmed','complete','disputed'));

update public.orders o
set delivery_speed = co.delivery_speed,
    delivery_address = co.delivery_address,
    delivery_date = co.delivery_date,
    delivery_time = co.delivery_time,
    delivery_deadline = co.delivery_deadline
from public.offers co
where co.id = o.offer_id
and (o.delivery_speed is null or o.delivery_address is null or o.delivery_date is null or o.delivery_time is null);
