-- ── Meetups ───────────────────────────────────────────────────────────────────

create table public.meetups (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  shop_id uuid not null references public.shops(id),
  proposed_by uuid not null references public.profiles(id),
  meetup_date date not null,
  meetup_time time not null,
  description text,
  max_attendees integer,
  cancelled_at timestamptz,
  cancelled_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index meetups_group_id_idx on public.meetups (group_id);
create index meetups_meetup_date_idx on public.meetups (meetup_date);

alter table public.meetups enable row level security;

create policy "Group members can read meetups"
  on public.meetups for select to authenticated
  using (is_group_member(group_id));

create policy "Group members can propose meetups"
  on public.meetups for insert to authenticated
  with check (proposed_by = auth.uid() and is_group_member(group_id));

create policy "Proposer or admin can cancel meetup"
  on public.meetups for update to authenticated
  using (proposed_by = auth.uid() or is_group_admin(group_id))
  with check (proposed_by = auth.uid() or is_group_admin(group_id));

-- ── Meetup RSVPs ──────────────────────────────────────────────────────────────

create table public.meetup_rsvps (
  id uuid primary key default gen_random_uuid(),
  meetup_id uuid not null references public.meetups(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique(meetup_id, user_id)
);

create index meetup_rsvps_meetup_id_idx on public.meetup_rsvps (meetup_id);

alter table public.meetup_rsvps enable row level security;

create policy "Group members can read meetup RSVPs"
  on public.meetup_rsvps for select to authenticated
  using (
    exists (
      select 1 from public.meetups m
      where m.id = meetup_id and is_group_member(m.group_id)
    )
  );

create policy "Group members can RSVP"
  on public.meetup_rsvps for insert to authenticated
  with check (
    user_id = auth.uid() and
    exists (
      select 1 from public.meetups m
      where m.id = meetup_id and is_group_member(m.group_id) and m.cancelled_at is null
    )
  );

create policy "Users can remove their own RSVP"
  on public.meetup_rsvps for delete to authenticated
  using (user_id = auth.uid());
