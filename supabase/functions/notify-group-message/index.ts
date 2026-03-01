import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Called by the client after a group message is inserted.
// Sends a push notification to all group members except the sender.
Deno.serve(async (req) => {
  const { group_id, sender_id, message_preview } = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Fetch group name and sender display name in parallel.
  const [{ data: group }, { data: sender }] = await Promise.all([
    supabase.from('groups').select('name').eq('id', group_id).single(),
    supabase.from('profiles').select('display_name, username').eq('id', sender_id).single(),
  ]);

  if (!group) return new Response('Group not found', { status: 404 });

  const senderName = sender?.display_name || sender?.username || 'Someone';
  const title = group.name as string;
  const body = `${senderName}: ${message_preview}`;

  // Get all members except the sender.
  const { data: members } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', group_id)
    .neq('user_id', sender_id);

  await Promise.all(
    (members ?? []).map(({ user_id }) =>
      supabase.functions.invoke('send-notification', {
        body: { user_id, title, body, data: { type: 'message', groupId: group_id } },
      }),
    ),
  );

  return new Response('ok');
});
