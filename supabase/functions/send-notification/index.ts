import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Sends a push notification to a user via Expo Push API.
Deno.serve(async (req) => {
  const { user_id, title, body, data } = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Fetch user's push token (to be stored in profiles once implemented)
  const { data: profile } = await supabase
    .from('profiles')
    .select('expo_push_token')
    .eq('id', user_id)
    .single();

  const token = profile?.expo_push_token;
  if (!token) return new Response('No push token', { status: 200 });

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: token, title, body, data }),
  });

  return new Response('ok');
});
