import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Triggered when a group challenge is created or completed.
// Notifies all group members via send-notification.
Deno.serve(async (req) => {
  const { challenge_id, event } = await req.json(); // event: 'created' | 'completed'

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: challenge } = await supabase
    .from('challenges')
    .select('title, group_id')
    .eq('id', challenge_id)
    .single();

  if (!challenge) return new Response('Not found', { status: 404 });

  const { data: members } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', challenge.group_id);

  const title = event === 'created' ? 'New Challenge!' : 'Challenge Complete!';
  const body = event === 'created'
    ? `A new group challenge has started: ${challenge.title}`
    : `Your group has completed: ${challenge.title}`;

  for (const { user_id } of members ?? []) {
    await supabase.functions.invoke('send-notification', {
      body: { user_id, title, body, data: { challenge_id } },
    });
  }

  return new Response('ok');
});
