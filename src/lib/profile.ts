import { supabase } from './supabase';
import { Profile, Badge } from '../types/database';

export interface UserBadge {
  badge: Badge;
  awarded_at: string;
}

export async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function fetchUserBadges(userId: string): Promise<UserBadge[]> {
  const { data, error } = await supabase
    .from('user_badges')
    .select('awarded_at, badges(*)')
    .eq('user_id', userId)
    .order('awarded_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({ badge: row.badges as Badge, awarded_at: row.awarded_at }));
}

export async function fetchAllBadges(): Promise<Badge[]> {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .eq('is_active', true)
    .order('category')
    .order('criteria_value');
  if (error) throw error;
  return (data ?? []) as Badge[];
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'display_name' | 'bio' | 'avatar_url'>>,
): Promise<void> {
  const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
  if (error) throw error;
}
