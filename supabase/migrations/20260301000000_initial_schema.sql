-- ============================================================
-- Enable extensions
-- ============================================================
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";

-- ============================================================
-- SHOPS
-- ============================================================
create table public.shops (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  slug          text not null unique,
  description   text not null default '',
  address_line1 text not null,
  address_line2 text,
  city          text not null,
  postcode      text not null,
  latitude      float8 not null,
  longitude     float8 not null,
  location      geography(point, 4326) generated always as (
                  st_point(longitude, latitude)::geography
                ) stored,
  phone         text,
  website       text,
  email         text,
  founded_year  int,
  opening_hours jsonb not null default '{}',
  price_range   int not null check (price_range between 1 and 4),
  is_active     boolean not null default true,
  features      jsonb not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index shops_location_idx on public.shops using gist (location);
create index shops_is_active_idx on public.shops (is_active);

-- ============================================================
-- SHOP PHOTOS
-- ============================================================
create table public.shop_photos (
  id           uuid primary key default uuid_generate_v4(),
  shop_id      uuid not null references public.shops (id) on delete cascade,
  storage_path text not null,
  caption      text,
  credit       text,
  is_primary   boolean not null default false,
  uploaded_by  uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now()
);

create index shop_photos_shop_id_idx on public.shop_photos (shop_id);

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table public.profiles (
  id                   uuid primary key references auth.users (id) on delete cascade,
  username             text not null unique,
  display_name         text not null,
  avatar_url           text,
  bio                  text,
  total_points         int not null default 0,
  total_visits         int not null default 0,
  unique_shops_visited int not null default 0,
  created_at           timestamptz not null default now()
);

-- Auto-create a profile row on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- CHECK-INS
-- ============================================================
create table public.checkins (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  shop_id       uuid not null references public.shops (id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  latitude      float8 not null,
  longitude     float8 not null,
  photo_url     text,
  notes         text,
  points_earned int not null default 0
);

create index checkins_user_id_idx on public.checkins (user_id);
create index checkins_shop_id_idx on public.checkins (shop_id);
create index checkins_checked_in_at_idx on public.checkins (checked_in_at desc);

-- ============================================================
-- BADGES
-- ============================================================
create table public.badges (
  id             uuid primary key default uuid_generate_v4(),
  slug           text not null unique,
  name           text not null,
  description    text not null,
  icon_url       text not null,
  category       text not null,   -- first_visit | quantity | regional | social | seasonal | speed | group
  criteria_type  text not null,   -- total_checkins | unique_shops | same_shop | region | etc.
  criteria_value int not null,
  is_active      boolean not null default true
);

create table public.user_badges (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  badge_id   uuid not null references public.badges (id) on delete cascade,
  awarded_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

create index user_badges_user_id_idx on public.user_badges (user_id);

-- ============================================================
-- GROUPS
-- ============================================================
create table public.groups (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  description text not null default '',
  invite_code text not null unique default upper(substring(md5(random()::text), 1, 8)),
  created_by  uuid not null references public.profiles (id) on delete restrict,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.group_members (
  id        uuid primary key default uuid_generate_v4(),
  group_id  uuid not null references public.groups (id) on delete cascade,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  role      text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create index group_members_group_id_idx on public.group_members (group_id);
create index group_members_user_id_idx on public.group_members (user_id);

-- ============================================================
-- GROUP MESSAGES
-- ============================================================
create table public.group_messages (
  id         uuid primary key default uuid_generate_v4(),
  group_id   uuid not null references public.groups (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);

create index group_messages_group_id_idx on public.group_messages (group_id, created_at desc);

-- ============================================================
-- CHALLENGES
-- ============================================================
create table public.challenges (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  description  text not null,
  criteria     jsonb not null,   -- {type: 'most_visits' | 'first_checkin' | 'shop_list', value: ..., shop_ids: [...]}
  points_reward int not null default 0,
  start_date   timestamptz not null,
  end_date     timestamptz not null,
  is_active    boolean not null default true,
  scope        text not null default 'global' check (scope in ('global', 'group')),
  group_id     uuid references public.groups (id) on delete cascade,
  created_by   uuid not null references public.profiles (id) on delete restrict,
  constraint group_challenge_requires_group check (
    scope = 'global' or group_id is not null
  )
);

create index challenges_scope_idx on public.challenges (scope, is_active);
create index challenges_group_id_idx on public.challenges (group_id) where group_id is not null;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.shops enable row level security;
alter table public.shop_photos enable row level security;
alter table public.profiles enable row level security;
alter table public.checkins enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_messages enable row level security;
alter table public.challenges enable row level security;

-- Shops: public read, admin write (admin role managed via Supabase dashboard)
create policy "Shops are publicly readable"
  on public.shops for select using (is_active = true);

-- Shop photos: public read
create policy "Shop photos are publicly readable"
  on public.shop_photos for select using (true);
create policy "Authenticated users can upload shop photos"
  on public.shop_photos for insert to authenticated
  with check (uploaded_by = auth.uid());

-- Profiles: public read, own write
create policy "Profiles are publicly readable"
  on public.profiles for select using (true);
create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid());

-- Check-ins: public read, own insert
create policy "Check-ins are publicly readable"
  on public.checkins for select using (true);
create policy "Authenticated users can insert own check-ins"
  on public.checkins for insert to authenticated
  with check (user_id = auth.uid());

-- Badges: public read
create policy "Badges are publicly readable"
  on public.badges for select using (is_active = true);

-- User badges: public read
create policy "User badges are publicly readable"
  on public.user_badges for select using (true);

-- Groups: members can read their own groups
create policy "Group members can read groups"
  on public.groups for select to authenticated
  using (
    id in (select group_id from public.group_members where user_id = auth.uid())
  );
create policy "Authenticated users can create groups"
  on public.groups for insert to authenticated
  with check (created_by = auth.uid());
create policy "Group admins can update their groups"
  on public.groups for update to authenticated
  using (
    id in (
      select group_id from public.group_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Group members: members can read, admins can manage
create policy "Group members can read membership"
  on public.group_members for select to authenticated
  using (
    group_id in (select group_id from public.group_members where user_id = auth.uid())
  );
create policy "Authenticated users can join groups"
  on public.group_members for insert to authenticated
  with check (user_id = auth.uid());
create policy "Group admins can remove members"
  on public.group_members for delete to authenticated
  using (
    group_id in (
      select group_id from public.group_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Group messages: members can read and post
create policy "Group members can read messages"
  on public.group_messages for select to authenticated
  using (
    group_id in (select group_id from public.group_members where user_id = auth.uid())
  );
create policy "Group members can post messages"
  on public.group_messages for insert to authenticated
  with check (
    user_id = auth.uid() and
    group_id in (select group_id from public.group_members where user_id = auth.uid())
  );

-- Challenges: global readable by all, group challenges readable by members
create policy "Global challenges are publicly readable"
  on public.challenges for select using (scope = 'global' and is_active = true);
create policy "Group challenges readable by members"
  on public.challenges for select to authenticated
  using (
    scope = 'group' and
    group_id in (select group_id from public.group_members where user_id = auth.uid())
  );
create policy "Group admins can create group challenges"
  on public.challenges for insert to authenticated
  with check (
    scope = 'group' and
    created_by = auth.uid() and
    group_id in (
      select group_id from public.group_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- updated_at triggers
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_shops_updated_at
  before update on public.shops
  for each row execute function public.set_updated_at();

create trigger set_groups_updated_at
  before update on public.groups
  for each row execute function public.set_updated_at();
