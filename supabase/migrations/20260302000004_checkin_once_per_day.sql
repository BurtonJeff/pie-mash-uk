-- Prevent a user from checking into the same shop more than once per day.
-- Uses a unique expression index on the UTC calendar date of checked_in_at.

create unique index checkins_user_shop_day_idx
  on public.checkins (user_id, shop_id, (checked_in_at::date));
