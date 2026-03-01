import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Triggered after a checkin insert. Checks if the user has completed any active group challenges.
Deno.serve(async (req) => {
  const { record } = await req.json();
  const { user_id, shop_id, checked_in_at } = record;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Find active group challenges for groups this user belongs to
  const { data: challenges } = await supabase
    .from('challenges')
    .select('*, group_members!inner(user_id)')
    .eq('scope', 'group')
    .eq('is_active', true)
    .eq('group_members.user_id', user_id)
    .lte('start_date', checked_in_at)
    .gte('end_date', checked_in_at);

  // Evaluation logic per challenge type to be expanded here
  // Placeholder: log matched challenges
  return new Response(JSON.stringify({ evaluated: challenges?.length ?? 0 }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
