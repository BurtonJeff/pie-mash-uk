import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Triggered via database webhook after a checkin insert.
// Calculates points earned and updates profile totals.
const POINTS_PER_VISIT = 10;
const FIRST_VISIT_BONUS = 25;

Deno.serve(async (req) => {
  const { record } = await req.json();
  const { id: checkin_id, user_id, shop_id } = record;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Check if this is a first-ever visit to this shop by this user
  const { count } = await supabase
    .from('checkins')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user_id)
    .eq('shop_id', shop_id);

  const isFirstVisit = (count ?? 0) <= 1;
  const points = POINTS_PER_VISIT + (isFirstVisit ? FIRST_VISIT_BONUS : 0);

  // Update the checkin with earned points
  await supabase.from('checkins').update({ points_earned: points }).eq('id', checkin_id);

  // Increment profile counters
  const { data: profile } = await supabase
    .from('profiles')
    .select('total_visits, unique_shops_visited, total_points')
    .eq('id', user_id)
    .single();

  if (profile) {
    await supabase.from('profiles').update({
      total_points: profile.total_points + points,
      total_visits: profile.total_visits + 1,
      unique_shops_visited: isFirstVisit ? profile.unique_shops_visited + 1 : profile.unique_shops_visited,
    }).eq('id', user_id);
  }

  return new Response(JSON.stringify({ points_earned: points }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
