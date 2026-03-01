import { supabase } from './supabase';

export interface Group {
  id: string;
  name: string;
  description: string;
  inviteCode: string;
  createdBy: string;
  memberCount: number;
  userRole: 'admin' | 'member';
}

export interface GroupMessage {
  id: string;
  groupId: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  body: string;
  createdAt: string;
}

export async function fetchUserGroups(userId: string): Promise<Group[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select('role, groups(id, name, description, invite_code, created_by)')
    .eq('user_id', userId);

  if (error) throw error;

  const groupIds = (data ?? []).map((row: any) => row.groups?.id).filter(Boolean);
  if (groupIds.length === 0) return [];

  // Get member counts
  const { data: counts } = await supabase
    .from('group_members')
    .select('group_id')
    .in('group_id', groupIds);

  const countMap = new Map<string, number>();
  for (const row of counts ?? []) {
    countMap.set(row.group_id, (countMap.get(row.group_id) ?? 0) + 1);
  }

  return (data ?? [])
    .filter((row: any) => row.groups)
    .map((row: any) => ({
      id: row.groups.id,
      name: row.groups.name,
      description: row.groups.description,
      inviteCode: row.groups.invite_code,
      createdBy: row.groups.created_by,
      memberCount: countMap.get(row.groups.id) ?? 1,
      userRole: row.role as 'admin' | 'member',
    }));
}

export async function createGroup(
  userId: string,
  name: string,
  description: string,
): Promise<Group> {
  const { data: group, error } = await supabase
    .from('groups')
    .insert({ name, description, created_by: userId })
    .select()
    .single();

  if (error) throw error;

  await supabase.from('group_members').insert({
    group_id: group.id,
    user_id: userId,
    role: 'admin',
  });

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    inviteCode: group.invite_code,
    createdBy: group.created_by,
    memberCount: 1,
    userRole: 'admin',
  };
}

export async function joinGroupByCode(userId: string, code: string): Promise<Group> {
  const { data: group, error: ge } = await supabase
    .from('groups')
    .select('*')
    .eq('invite_code', code.toUpperCase().trim())
    .single();

  if (ge || !group) throw new Error('Group not found. Check the invite code and try again.');

  const { error: me } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: userId, role: 'member' });

  if (me) {
    if (me.code === '23505') throw new Error('You are already a member of this group.');
    throw me;
  }

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    inviteCode: group.invite_code,
    createdBy: group.created_by,
    memberCount: 0,
    userRole: 'member',
  };
}

export async function fetchGroupMessages(groupId: string): Promise<GroupMessage[]> {
  const { data, error } = await supabase
    .from('group_messages')
    .select('id, group_id, user_id, body, created_at, profiles(username, display_name, avatar_url)')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    groupId: row.group_id,
    userId: row.user_id,
    username: row.profiles?.username ?? '',
    displayName: row.profiles?.display_name ?? '',
    avatarUrl: row.profiles?.avatar_url ?? null,
    body: row.body,
    createdAt: row.created_at,
  }));
}

export async function sendMessage(groupId: string, userId: string, body: string): Promise<void> {
  const { error } = await supabase
    .from('group_messages')
    .insert({ group_id: groupId, user_id: userId, body });
  if (error) throw error;
}
