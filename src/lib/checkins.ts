import { supabase } from './supabase';
import { CheckIn, Badge } from '../types/database';

export interface SubmitCheckInParams {
  userId: string;
  shopId: string;
  latitude: number;
  longitude: number;
  photoUri?: string | null;
  notes?: string;
}

export interface CheckInResult {
  checkin: CheckIn;
  pointsEarned: number;
  newBadges: Badge[];
}

/** Upload a local photo URI to Supabase Storage, return the storage path. */
async function uploadCheckinPhoto(userId: string, uri: string): Promise<string> {
  const ext = uri.split('.').pop() ?? 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;

  const response = await fetch(uri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from('checkin-photos')
    .upload(path, blob, { contentType: `image/${ext}`, upsert: false });

  if (error) throw error;
  return path;
}

/** Fetch badge IDs already earned by this user. */
async function getEarnedBadgeIds(userId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId);
  return new Set((data ?? []).map((r: any) => r.badge_id));
}

/** Fetch badge details for a list of IDs. */
async function fetchBadgesByIds(ids: string[]): Promise<Badge[]> {
  if (ids.length === 0) return [];
  const { data } = await supabase.from('badges').select('*').in('id', ids);
  return (data ?? []) as Badge[];
}

export async function submitCheckIn(params: SubmitCheckInParams): Promise<CheckInResult> {
  const { userId, shopId, latitude, longitude, photoUri, notes } = params;

  // Snapshot badges before check-in so we can diff afterwards
  const beforeBadges = await getEarnedBadgeIds(userId);

  // Upload photo if provided
  let photoUrl: string | null = null;
  if (photoUri) {
    const path = await uploadCheckinPhoto(userId, photoUri);
    const { data } = supabase.storage.from('checkin-photos').getPublicUrl(path);
    photoUrl = data.publicUrl;
  }

  // Insert check-in record
  const { data: checkin, error } = await supabase
    .from('checkins')
    .insert({
      user_id: userId,
      shop_id: shopId,
      latitude,
      longitude,
      photo_url: photoUrl,
      notes: notes ?? null,
    })
    .select()
    .single();

  if (error) throw error;

  // Invoke server-side edge functions to calculate points and award badges
  try {
    await supabase.functions.invoke('calculate-points', { body: { record: checkin } });
    await supabase.functions.invoke('award-badges', { body: { record: checkin } });
  } catch {
    // Non-fatal — points/badges may be eventually consistent via webhooks
  }

  // Fetch updated checkin to get points_earned (set by calculate-points)
  const { data: updated } = await supabase
    .from('checkins')
    .select('points_earned')
    .eq('id', checkin.id)
    .single();

  // Diff badges to find newly awarded ones
  const afterBadgeIds = await getEarnedBadgeIds(userId);
  const newBadgeIds = [...afterBadgeIds].filter((id) => !beforeBadges.has(id));
  const newBadges = await fetchBadgesByIds(newBadgeIds);

  return {
    checkin: checkin as CheckIn,
    pointsEarned: updated?.points_earned ?? 10,
    newBadges,
  };
}

export async function fetchUserCheckins(userId: string): Promise<(CheckIn & { shop_name: string })[]> {
  const { data, error } = await supabase
    .from('checkins')
    .select('*, shops(name)')
    .eq('user_id', userId)
    .order('checked_in_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((c: any) => ({ ...c, shop_name: c.shops?.name ?? '' }));
}
