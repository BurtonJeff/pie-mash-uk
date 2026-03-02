-- Award badges automatically whenever a profile's visit counts increase.
-- Fires as an AFTER UPDATE trigger on profiles, so it runs whether the
-- update came from the checkin insert trigger or from the client-side fallback.

create or replace function public.award_badges_on_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  badge record;
begin
  -- Walk every active badge the user hasn't earned yet.
  for badge in
    select b.id, b.criteria_type, b.criteria_value
    from badges b
    where b.is_active = true
      and not exists (
        select 1 from user_badges ub
        where ub.user_id = new.id and ub.badge_id = b.id
      )
  loop
    if badge.criteria_type = 'total_checkins'
       and new.total_visits >= badge.criteria_value then
      insert into user_badges (user_id, badge_id)
      values (new.id, badge.id)
      on conflict (user_id, badge_id) do nothing;
    end if;

    if badge.criteria_type = 'unique_shops'
       and new.unique_shops_visited >= badge.criteria_value then
      insert into user_badges (user_id, badge_id)
      values (new.id, badge.id)
      on conflict (user_id, badge_id) do nothing;
    end if;
  end loop;

  return new;
end;
$$;

create trigger on_profile_update_award_badges
  after update of total_visits, unique_shops_visited on public.profiles
  for each row
  execute function public.award_badges_on_profile_update();

-- Allow authenticated users to insert their own badge awards.
-- Needed for the client-side fallback when the DB trigger is not yet applied.
create policy "Users can earn badges"
  on public.user_badges for insert to authenticated
  with check (user_id = auth.uid());
