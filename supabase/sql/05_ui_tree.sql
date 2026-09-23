-- UI tree: top categories + departments with images (market-card style display)
create table if not exists public.categories (
  mc_id bigint primary key,
  name text not null default '',
  img text not null default '',
  sliders jsonb not null default '[]'::jsonb,
  sort bigint not null default 0
);

create table if not exists public.departments (
  mc_id bigint primary key,
  name text not null default '',
  img text not null default '',
  sliders jsonb not null default '[]'::jsonb,
  top_id bigint not null default 0,
  top_name text not null default ''
);

alter table public.categories enable row level security;
drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read" on public.categories for select to anon, authenticated using (true);

alter table public.departments enable row level security;
drop policy if exists "departments_public_read" on public.departments;
create policy "departments_public_read" on public.departments for select to anon, authenticated using (true);
