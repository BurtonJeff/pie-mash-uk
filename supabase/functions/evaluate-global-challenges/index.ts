import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const { user_id, checkin_id } = await req.json();
    if (!user_id) return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400 });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_visits, unique_shops_visited')
      .eq('id', user_id)
      .single();

    if (!profile) return new Response(JSON.stringify({ completed: 0 }), { status: 200 });

    const now = new Date().toISOString();

    // Fetch active global challenges not yet completed by user
    const { data: completed } = await supabase
      .from('user_challenges')
      .select('challenge_id')
      .eq('user_id', user_id);

    const completedIds = (completed ?? []).map((r: any) => r.challenge_id);

    const { data: challenges } = await supabase
      .from('challenges')
      .select('id, criteria, badge_id, points_reward')
      .eq('scope', 'global')
      .eq('is_active', true)
      .lte('start_date', now)
      .gte('end_date', now);

    const eligible = (challenges ?? []).filter((c: any) => !completedIds.includes(c.id));

    let count = 0;
    for (const challenge of eligible) {
      const criteria = challenge.criteria ?? {};
      let met = false;
      if (criteria.type === 'total_checkins' && profile.total_visits >= criteria.value) met = true;
      if (criteria.type === 'unique_shops' && profile.unique_shops_visited >= criteria.value) met = true;

      if (met) {
        await supabase.from('user_challenges').insert({ user_id, challenge_id: challenge.id }).throwOnError();

        if (challenge.badge_id) {
          await supabase.from('user_badges').upsert({ user_id, badge_id: challenge.badge_id, awarded_at: now }, { onConflict: 'user_id,badge_id', ignoreDuplicates: true });
        }

        count++;
      }
    }

    return new Response(JSON.stringify({ completed: count }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});
