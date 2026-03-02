-- Replace the calculate-points edge function with a BEFORE INSERT trigger
-- so points are awarded atomically with every check-in, with no network
-- calls, no deployment steps, and no silent failures.

create or replace function public.calculate_checkin_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prev_count         int;
  v_is_first_visit     bool;
  v_points             int;
begin
  -- Count prior visits to this shop by this user (excluding the row
  -- being inserted, which doesn't exist yet in a BEFORE trigger).
  select count(*) into v_prev_count
  from checkins
  where user_id = new.user_id
    and shop_id = new.shop_id;

  v_is_first_visit := v_prev_count = 0;
  v_points         := 10 + case when v_is_first_visit then 25 else 0 end;

  -- Stamp points onto the row before it is written.
  new.points_earned := v_points;

  -- Update profile totals in the same transaction.
  update profiles set
    total_points         = total_points         + v_points,
    total_visits         = total_visits         + 1,
    unique_shops_visited = unique_shops_visited + case when v_is_first_visit then 1 else 0 end
  where id = new.user_id;

  return new;
end;
$$;

create trigger on_checkin_insert
  before insert on public.checkins
  for each row
  execute function public.calculate_checkin_points();
