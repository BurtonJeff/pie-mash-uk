import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Called by the client after a user requests to join a group that requires confirmation.
// Sends a push notification to all admins of the group.
Deno.serve(async (req) => {
  const { group_id, requester_id } = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const [{ data: group }, { data: requester }] = await Promise.all([
    supabase.from('groups').select('name').eq('id', group_id).single(),
    supabase.from('profiles').select('display_name, username').eq('id', requester_id).single(),
  ]);

  if (!group) return new Response('Group not found', { status: 404 });

  const requesterName = requester?.display_name || requester?.username || 'Someone';
  const title = 'New join request';
  const body = `${requesterName} wants to join ${group.name}`;

  const { data: admins } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', group_id)
    .eq('role', 'admin')
    .eq('status', 'active');

  await Promise.all(
    (admins ?? []).map(({ user_id }) =>
      supabase.functions.invoke('send-notification', {
        body: { user_id, title, body, data: { type: 'join_request', groupId: group_id } },
      }),
    ),
  );

  return new Response('ok');
});
