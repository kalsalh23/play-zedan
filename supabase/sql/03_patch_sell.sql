-- add sell_unit_price column if missing
alter table public.products add column if not exists sell_unit_price numeric not null default 0;
