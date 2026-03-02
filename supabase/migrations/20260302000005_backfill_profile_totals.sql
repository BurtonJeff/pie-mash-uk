-- Backfill profile totals from existing check-in history.
--
-- The calculate-points edge function was never deployed, so all existing
-- checkins have points_earned = 0 and all profiles have 0 totals.
-- This migration:
--   1. Recalculates points_earned on every checkin (10 base + 25 first-visit bonus)
--   2. Recomputes total_visits, unique_shops_visited, and total_points on every profile

-- Step 1: stamp correct points on every existing checkin.
-- First visit to a shop = 35 pts; repeat visit = 10 pts.
update public.checkins c
set points_earned = (
  10 + case
    when (
      select count(*)
      from public.checkins prev
      where prev.user_id   = c.user_id
        and prev.shop_id   = c.shop_id
        and prev.checked_in_at < c.checked_in_at
    ) = 0 then 25
    else 0
  end
);

-- Step 2: recompute profile counters from the corrected checkins.
update public.profiles p
set
  total_visits         = (select count(*)            from public.checkins c where c.user_id = p.id),
  unique_shops_visited = (select count(distinct shop_id) from public.checkins c where c.user_id = p.id),
  total_points         = (select coalesce(sum(points_earned), 0) from public.checkins c where c.user_id = p.id);
