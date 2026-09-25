-- Ad banners for the home hero slider
create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  img text not null,
  link text not null default '/categories',
  title text not null default '',
  sort bigint not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.banners enable row level security;
drop policy if exists "banners_public_read" on public.banners;
create policy "banners_public_read" on public.banners for select to anon, authenticated using (active = true);
