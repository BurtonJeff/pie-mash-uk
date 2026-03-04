import { supabase } from './supabase';

export interface FeedItem {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  shopName: string;
  shopCity: string;
  checkedInAt: string;
  photoUrl: string | null;
  notes: string | null;
  pointsEarned: number;
}

export async function fetchGlobalFeed(limit = 40): Promise<FeedItem[]> {
  const { data, error } = await supabase
    .from('checkins')
    .select('id, user_id, checked_in_at, photo_url, notes, points_earned, profiles(username, display_name, avatar_url), shops(name, city)')
    .order('checked_in_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    username: row.profiles?.username ?? '',
    displayName: row.profiles?.display_name ?? '',
    avatarUrl: row.profiles?.avatar_url ?? null,
    shopName: row.shops?.name ?? '',
    shopCity: row.shops?.city ?? '',
    checkedInAt: row.checked_in_at,
    photoUrl: row.photo_url,
    notes: row.notes ?? null,
    pointsEarned: row.points_earned,
  }));
}

export async function fetchGroupFeed(groupId: string, limit = 40): Promise<FeedItem[]> {
  // Get member IDs for this group
  const { data: members } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId);

  const memberIds = (members ?? []).map((m: any) => m.user_id);
  if (memberIds.length === 0) return [];

  const { data, error } = await supabase
    .from('checkins')
    .select('id, user_id, checked_in_at, photo_url, notes, points_earned, profiles(username, display_name, avatar_url), shops(name, city)')
    .in('user_id', memberIds)
    .order('checked_in_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    username: row.profiles?.username ?? '',
    displayName: row.profiles?.display_name ?? '',
    avatarUrl: row.profiles?.avatar_url ?? null,
    shopName: row.shops?.name ?? '',
    shopCity: row.shops?.city ?? '',
    checkedInAt: row.checked_in_at,
    photoUrl: row.photo_url,
    notes: row.notes ?? null,
    pointsEarned: row.points_earned,
  }));
}
