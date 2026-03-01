import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Triggered via database webhook after a checkin insert.
// Evaluates all badge criteria for the user and awards any newly earned badges.
Deno.serve(async (req) => {
  const { record } = await req.json(); // checkin record from webhook
  const { user_id, shop_id } = record;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Fetch user stats
  const { data: profile } = await supabase
    .from('profiles')
    .select('total_visits, unique_shops_visited')
    .eq('id', user_id)
    .single();

  if (!profile) return new Response('Profile not found', { status: 404 });

  // Fetch all active badges not yet earned by this user
  const { data: unearned } = await supabase
    .from('badges')
    .select('*')
    .eq('is_active', true)
    .not('id', 'in', `(select badge_id from user_badges where user_id = '${user_id}')`);

  const toAward: string[] = [];

  for (const badge of unearned ?? []) {
    if (badge.criteria_type === 'total_checkins' && profile.total_visits >= badge.criteria_value) {
      toAward.push(badge.id);
    }
    if (badge.criteria_type === 'unique_shops' && profile.unique_shops_visited >= badge.criteria_value) {
      toAward.push(badge.id);
    }
    // Additional criteria types (same_shop, region, seasonal, etc.) to be implemented per badge category
  }

  if (toAward.length > 0) {
    await supabase.from('user_badges').insert(
      toAward.map((badge_id) => ({ user_id, badge_id })),
    );

    // Notify the user for each newly earned badge.
    for (const badge_id of toAward) {
      const badge = (unearned ?? []).find((b) => b.id === badge_id);
      if (!badge) continue;
      await supabase.functions.invoke('send-notification', {
        body: {
          user_id,
          title: '🏅 New Badge Earned!',
          body: `You earned "${badge.name}" — ${badge.description}`,
          data: { type: 'badge', badgeId: badge_id },
        },
      });
    }
  }

  return new Response(JSON.stringify({ awarded: toAward.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
