import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Called by the client after a meetup is proposed.
// Notifies all group members except the proposer.
Deno.serve(async (req) => {
  const { group_id, meetup_id, proposer_id } = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const [{ data: group }, { data: proposer }, { data: meetup }] = await Promise.all([
    supabase.from('groups').select('name').eq('id', group_id).single(),
    supabase.from('profiles').select('display_name, username').eq('id', proposer_id).single(),
    supabase.from('meetups').select('meetup_date, meetup_time, shops(name)').eq('id', meetup_id).single(),
  ]);

  if (!group || !meetup) return new Response('Not found', { status: 404 });

  const proposerName = proposer?.display_name || proposer?.username || 'Someone';
  const shopName = (meetup as any).shops?.name ?? 'a shop';
  const date = new Date(`${meetup.meetup_date}T${meetup.meetup_time}`);
  const dateStr = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

  const title = `Meatup proposed in ${group.name}`;
  const body = `${proposerName} suggested ${shopName} on ${dateStr}`;

  const { data: members } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', group_id)
    .eq('status', 'active')
    .neq('user_id', proposer_id);

  await Promise.all(
    (members ?? []).map(({ user_id }) =>
      supabase.functions.invoke('send-notification', {
        body: { user_id, title, body, data: { type: 'meetup', groupId: group_id } },
      }),
    ),
  );

  return new Response('ok');
});
