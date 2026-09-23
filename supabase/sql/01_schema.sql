-- MOBILY BRO+ schema
create extension if not exists pgcrypto;

create table if not exists public.products (
  mc_id bigint primary key,
  name text not null default '',
  type text not null default 'id',
  info text not null default '',
  img text not null default '',
  min_qty numeric not null default 0,
  max_qty numeric not null default 0,
  is_available boolean not null default false,
  price numeric not null default 0,
  unit_price numeric not null default 0,
  can_check boolean not null default false,
  is_url boolean not null default false,
  top_category_id bigint not null default 0,
  top_category_name text not null default '',
  department_id bigint not null default 0,
  department_name text not null default '',
  sell_unit_price numeric not null default 0,
  price_override numeric,
  is_hidden boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  product_mc_id bigint not null,
  product_name text not null default '',
  product_img text not null default '',
  id_user text not null default '',
  amount numeric not null default 1,
  sell_price numeric not null default 0,
  pay_amount numeric not null default 0,
  customer_wallet text not null default '',
  customer_note text not null default '',
  status text not null default 'awaiting_payment',
  mc_bill_id bigint,
  mc_status text not null default '',
  cancel_note text not null default '',
  result_code text not null default '',
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_idx on public.orders (created_at desc);

create table if not exists public.settings (
  key text primary key,
  value text not null default ''
);

create table if not exists public.logs (
  id bigint generated always as identity primary key,
  scope text not null default '',
  message text not null default '',
  meta jsonb,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.products enable row level security;
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products for select to anon, authenticated using (true);

alter table public.orders enable row level security;
-- no anon policies: reads/writes only via server functions (service_role)

alter table public.settings enable row level security;
alter table public.logs enable row level security;
