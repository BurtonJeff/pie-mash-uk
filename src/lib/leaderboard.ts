import { supabase } from './supabase';
import { weekStart, monthStart, yearStart } from '../utils/dateUtils';

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
    .eq('is_active', true)
    .eq('is_private', false)
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

async function fetchPeriodLeaderboard(since: string, limit = 50): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('checkins')
    .select('user_id, points_earned, profiles(id, username, display_name, avatar_url, unique_shops_visited, total_visits, bio, created_at, is_private, is_active)')
    .gte('checked_in_at', since);

  if (error) throw error;

  const map = new Map<string, LeaderboardEntry>();
  for (const row of data ?? []) {
    const p = row.profiles as any;
    if (!p || p.is_private || !p.is_active) continue;
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

export async function fetchWeeklyLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  return fetchPeriodLeaderboard(weekStart(), limit);
}

export async function fetchMonthlyLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  return fetchPeriodLeaderboard(monthStart(), limit);
}

export async function fetchYearlyLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  return fetchPeriodLeaderboard(yearStart(), limit);
}

export type GroupLeaderboardPeriod = 'alltime' | 'weekly' | 'monthly' | 'yearly';

export async function fetchGroupLeaderboard(groupId: string, period: GroupLeaderboardPeriod = 'alltime'): Promise<LeaderboardEntry[]> {
  if (period === 'alltime') {
    const { data, error } = await supabase
      .from('group_members')
      .select('profiles(id, username, display_name, avatar_url, total_points, unique_shops_visited, total_visits, bio, created_at, is_active)')
      .eq('group_id', groupId)
      .eq('status', 'active');

    if (error) throw error;

    return (data ?? [])
      .map((row: any) => row.profiles)
      .filter((p: any) => p && p.is_active)
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

  // Period-based: aggregate checkins for group members
  const sinceMap: Record<string, () => string> = {
    weekly: weekStart,
    monthly: monthStart,
    yearly: yearStart,
  };
  const since = sinceMap[period]();

  const { data: members, error: me } = await supabase
    .from('group_members')
    .select('user_id, profiles(id, username, display_name, avatar_url, unique_shops_visited, total_visits, bio, created_at, is_active)')
    .eq('group_id', groupId)
    .eq('status', 'active');

  if (me) throw me;

  const memberIds = (members ?? []).map((m: any) => m.user_id);
  if (memberIds.length === 0) return [];

  const { data: checkins, error: ce } = await supabase
    .from('checkins')
    .select('user_id, points_earned')
    .in('user_id', memberIds)
    .gte('checked_in_at', since);

  if (ce) throw ce;

  const profileMap = new Map<string, any>();
  for (const m of members ?? []) {
    const p = m.profiles as any;
    if (p && p.is_active) profileMap.set(m.user_id, p);
  }

  const pointsMap = new Map<string, number>();
  for (const c of checkins ?? []) {
    pointsMap.set(c.user_id, (pointsMap.get(c.user_id) ?? 0) + c.points_earned);
  }

  return [...profileMap.entries()]
    .map(([userId, p]: [string, any]) => ({
      rank: 0,
      userId: p.id,
      username: p.username,
      displayName: p.display_name,
      avatarUrl: p.avatar_url,
      points: pointsMap.get(userId) ?? 0,
      uniqueShops: p.unique_shops_visited,
      totalVisits: p.total_visits,
      bio: p.bio ?? null,
      memberSince: p.created_at,
    }))
    .sort((a, b) => b.points - a.points)
    .map((e, i) => ({ ...e, rank: i + 1 }));
}
