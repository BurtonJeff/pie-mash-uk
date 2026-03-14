import { supabase } from './supabase';

export interface Group {
  id: string;
  name: string;
  description: string;
  inviteCode: string;
  createdBy: string;
  memberCount: number;
  userRole: 'admin' | 'member';
  userStatus: 'active' | 'pending';
  requiresConfirmation: boolean;
}

export interface JoinGroupResult {
  group: Group;
  pendingApproval: boolean;
}

export async function fetchUserGroups(userId: string): Promise<Group[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select('role, status, groups(id, name, description, invite_code, created_by, requires_confirmation)')
    .eq('user_id', userId)
    .in('status', ['active', 'pending']);

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
      userStatus: (row.status ?? 'active') as 'active' | 'pending',
      requiresConfirmation: row.groups.requires_confirmation ?? false,
    }));
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function createGroup(
  userId: string,
  name: string,
  description: string,
  requiresConfirmation = false,
): Promise<Group> {
  const { data: group, error } = await supabase
    .from('groups')
    .insert({ name, description, created_by: userId, invite_code: generateInviteCode(), requires_confirmation: requiresConfirmation })
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
    userStatus: 'active',
    requiresConfirmation: group.requires_confirmation ?? false,
  };
}

export async function joinGroupByCode(userId: string, code: string): Promise<JoinGroupResult> {
  const { data: group, error: ge } = await supabase
    .from('groups')
    .select('*')
    .eq('invite_code', code.toUpperCase().trim())
    .single();

  if (ge || !group) throw new Error('Group not found. Check the invite code and try again.');

  const pendingApproval = group.requires_confirmation === true;
  const status = pendingApproval ? 'pending' : 'active';

  const { error: me } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: userId, role: 'member', status });

  if (me) {
    if (me.code === '23505') throw new Error('You are already a member of this group.');
    throw me;
  }

  if (pendingApproval) {
    // Fire-and-forget: notify admins of the join request.
    supabase.functions
      .invoke('notify-join-request', { body: { group_id: group.id, requester_id: userId } })
      .catch(() => {});
  }

  return {
    group: {
      id: group.id,
      name: group.name,
      description: group.description,
      inviteCode: group.invite_code,
      createdBy: group.created_by,
      memberCount: 0,
      userRole: 'member',
      userStatus: pendingApproval ? 'pending' : 'active',
      requiresConfirmation: group.requires_confirmation ?? false,
    },
    pendingApproval,
  };
}

export interface GroupMember {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  totalPoints: number;
  totalVisits: number;
  uniqueShopsVisited: number;
  role: 'admin' | 'member';
  status: 'active' | 'pending';
  joinedAt: string;
}

export interface PendingMember {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  joinedAt: string;
}

export async function fetchGroupMembers(groupId: string): Promise<GroupMember[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select('role, status, joined_at, profiles(id, username, display_name, avatar_url, bio, total_points, total_visits, unique_shops_visited, is_active)')
    .eq('group_id', groupId)
    .eq('status', 'active')
    .order('joined_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).filter((row: any) => row.profiles?.is_active).map((row: any) => ({
    userId: row.profiles.id,
    username: row.profiles.username,
    displayName: row.profiles.display_name,
    avatarUrl: row.profiles.avatar_url ?? null,
    bio: row.profiles.bio ?? null,
    totalPoints: row.profiles.total_points,
    totalVisits: row.profiles.total_visits,
    uniqueShopsVisited: row.profiles.unique_shops_visited,
    role: row.role as 'admin' | 'member',
    status: (row.status ?? 'active') as 'active' | 'pending',
    joinedAt: row.joined_at,
  }));
}

export async function fetchPendingMembers(groupId: string): Promise<PendingMember[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select('joined_at, profiles(id, username, display_name, avatar_url, is_active)')
    .eq('group_id', groupId)
    .eq('status', 'pending')
    .order('joined_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).filter((row: any) => row.profiles?.is_active).map((row: any) => ({
    userId: row.profiles.id,
    username: row.profiles.username,
    displayName: row.profiles.display_name,
    avatarUrl: row.profiles.avatar_url ?? null,
    joinedAt: row.joined_at,
  }));
}

export async function approveGroupMember(groupId: string, targetUserId: string): Promise<void> {
  const { error } = await supabase
    .from('group_members')
    .update({ status: 'active' })
    .eq('group_id', groupId)
    .eq('user_id', targetUserId);
  if (error) throw error;
}

export async function rejectGroupMember(groupId: string, targetUserId: string): Promise<void> {
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', targetUserId);
  if (error) throw error;
}

export async function setGroupRequiresConfirmation(
  groupId: string,
  value: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('groups')
    .update({ requires_confirmation: value })
    .eq('id', groupId);
  if (error) throw error;
}

export async function updateMemberRole(
  groupId: string,
  targetUserId: string,
  role: 'admin' | 'member',
): Promise<void> {
  const { error } = await supabase
    .from('group_members')
    .update({ role })
    .eq('group_id', groupId)
    .eq('user_id', targetUserId);
  if (error) throw error;
}

export async function removeGroupMember(groupId: string, targetUserId: string): Promise<void> {
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', targetUserId);
  if (error) throw error;
}

