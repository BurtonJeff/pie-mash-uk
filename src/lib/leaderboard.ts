import { supabase } from './supabase';
import { weekStart } from '../utils/dateUtils';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  points: number;
  uniqueShops: number;
  totalVisits: number;
  bio: string | null;
  memberSince: string;
}

export async function fetchAllTimeLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, total_points, unique_shops_visited, total_visits, bio, created_at')
    .order('total_points', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((p: any, i) => ({
    rank: i + 1,
    userId: p.id,
    username: p.username,
    displayName: p.display_name,
    avatarUrl: p.avatar_url,
    points: p.total_points,
    uniqueShops: p.unique_shops_visited,
    totalVisits: p.total_visits,
    bio: p.bio ?? null,
    memberSince: p.created_at,
  }));
}

export async function fetchWeeklyLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('checkins')
    .select('user_id, points_earned, profiles(id, username, display_name, avatar_url, unique_shops_visited, total_visits, bio, created_at)')
    .gte('checked_in_at', weekStart());

  if (error) throw error;

  // Aggregate by user
  const map = new Map<string, LeaderboardEntry>();
  for (const row of data ?? []) {
    const p = row.profiles as any;
    if (!p) continue;
    const existing = map.get(p.id);
    if (existing) {
      existing.points += row.points_earned;
    } else {
      map.set(p.id, {
        rank: 0,
        userId: p.id,
        username: p.username,
        displayName: p.display_name,
        avatarUrl: p.avatar_url,
        points: row.points_earned,
        uniqueShops: p.unique_shops_visited,
        totalVisits: p.total_visits,
        bio: p.bio ?? null,
        memberSince: p.created_at,
      });
    }
  }

  return [...map.values()]
    .sort((a, b) => b.points - a.points)
    .slice(0, limit)
    .map((e, i) => ({ ...e, rank: i + 1 }));
}

export async function fetchGroupLeaderboard(groupId: string): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select('profiles(id, username, display_name, avatar_url, total_points, unique_shops_visited, total_visits, bio, created_at)')
    .eq('group_id', groupId);

  if (error) throw error;

  return (data ?? [])
    .map((row: any) => row.profiles)
    .filter(Boolean)
    .sort((a: any, b: any) => b.total_points - a.total_points)
    .map((p: any, i: number) => ({
      rank: i + 1,
      userId: p.id,
      username: p.username,
      displayName: p.display_name,
      avatarUrl: p.avatar_url,
      points: p.total_points,
      uniqueShops: p.unique_shops_visited,
      totalVisits: p.total_visits,
      bio: p.bio ?? null,
      memberSince: p.created_at,
    }));
}
