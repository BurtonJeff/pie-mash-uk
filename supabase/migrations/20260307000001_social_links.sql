create table public.social_links (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  url text not null,
  icon_name text not null default 'globe-outline',
  icon_color text not null default '#2D5016',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.social_links enable row level security;

-- Anyone can read active links
create policy "Public read active social links"
  on public.social_links for select
  using (is_active = true);

-- Admins can do everything
create policy "Admins manage social links"
  on public.social_links for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Seed the existing Facebook group link
insert into public.social_links (label, url, icon_name, icon_color, sort_order, is_active)
values ('Pie, Mash & Liquor Appreciation', 'https://www.facebook.com/groups/2223751270', 'logo-facebook', '#1877F2', 0, true);
