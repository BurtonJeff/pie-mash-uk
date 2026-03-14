-- Reset check-ins, badges, and points for test users @Caravaggio and @Jeff Burton.

DO $$
DECLARE
  user_ids uuid[];
BEGIN
  SELECT ARRAY(
    SELECT id FROM profiles
    WHERE lower(username) IN ('caravaggio', 'jeff burton')
  ) INTO user_ids;

  DELETE FROM checkins WHERE user_id = ANY(user_ids);
  DELETE FROM user_badges WHERE user_id = ANY(user_ids);

  UPDATE profiles
  SET
    total_points         = 0,
    total_visits         = 0,
    unique_shops_visited = 0
  WHERE id = ANY(user_ids);
END $$;
