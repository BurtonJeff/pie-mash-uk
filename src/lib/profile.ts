import { File } from 'expo-file-system/next';
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

  // Profile missing — auto-create from auth user data
  if (error?.code === 'PGRST116' || (!data && error)) {
    const { data: { user } } = await supabase.auth.getUser();
    const username = user?.user_metadata?.username
      ?? user?.email?.split('@')[0]
      ?? 'user';
    const { data: created, error: createError } = await supabase
      .from('profiles')
      .insert({ id: userId, username, display_name: username })
      .select()
      .single();
    if (createError) throw createError;
    return created as Profile;
  }

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

/** Upload a local image URI as the user's avatar; returns the public URL. */
export async function uploadAvatar(userId: string, uri: string): Promise<string> {
  const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `${userId}/avatar.${ext}`;

  const file = new File(uri);
  const bytes = await file.bytes();

  const { error } = await supabase.storage
    .from('checkin-photos')
    .upload(path, bytes, { contentType: `image/${ext}`, upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from('checkin-photos').getPublicUrl(path);
  // Append a timestamp so React Native doesn't serve a stale cached version
  return `${data.publicUrl}?t=${Date.now()}`;
}
