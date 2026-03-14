import { File } from 'expo-file-system/next';
import { supabase } from './supabase';
import { CheckIn, Badge } from '../types/database';

export interface SubmitCheckInParams {
  userId: string;
  shopId: string;
  latitude: number;
  longitude: number;
  photoUris?: string[];
  notes?: string;
  isFeatured?: boolean;
}

const FEATURED_BONUS_POINTS = 10;

export interface CheckInResult {
  checkin: CheckIn;
  pointsEarned: number;
  newBadges: Badge[];
}

/** Upload a local photo URI to Supabase Storage, return the storage path. */
async function uploadCheckinPhoto(userId: string, uri: string): Promise<string> {
  const ext = uri.split('.').pop() ?? 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;

  const file = new File(uri);
  const bytes = await file.bytes();

  const { error } = await supabase.storage
    .from('checkin-photos')
    .upload(path, bytes, { contentType: `image/${ext}`, upsert: false });

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
  const { userId, shopId, latitude, longitude, photoUris, notes, isFeatured } = params;

  // Reject if the user has already checked in here today
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const { count: todayCount } = await supabase
    .from('checkins')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('shop_id', shopId)
    .gte('checked_in_at', dayStart.toISOString());
  if ((todayCount ?? 0) > 0) {
    throw new Error("You've already checked in here today. Come back tomorrow!");
  }

  // Snapshot badges before check-in so we can diff afterwards
  const beforeBadges = await getEarnedBadgeIds(userId);

  // Upload all photos in parallel
  const photoUrls: string[] = [];
  if (photoUris && photoUris.length > 0) {
    const uploadedPaths = await Promise.all(photoUris.map((uri) => uploadCheckinPhoto(userId, uri)));
    for (const path of uploadedPaths) {
      const { data } = supabase.storage.from('checkin-photos').getPublicUrl(path);
      photoUrls.push(data.publicUrl);
    }
  }

  const photoUrl = photoUrls[0] ?? null;

  // Insert check-in record
  const { data: checkin, error } = await supabase
    .from('checkins')
    .insert({
      user_id: userId,
      shop_id: shopId,
      latitude,
      longitude,
      photo_url: photoUrl,
      photo_urls: photoUrls,
      notes: notes ?? null,
    })
    .select()
    .single();

  if (error) throw error;

  // If the DB trigger ran, points_earned will already be > 0.
  // Otherwise (trigger migration not yet applied) calculate and apply here.
  let pointsEarned = checkin.points_earned;
  if (pointsEarned === 0) {
    // Count all checkins for this shop by this user (new row is now in DB).
    const { count: shopCount } = await supabase
      .from('checkins')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('shop_id', shopId);
    const isFirstVisit = (shopCount ?? 1) === 1;
    pointsEarned = 10 + (isFirstVisit ? 25 : 0) + (isFeatured ? FEATURED_BONUS_POINTS : 0);

    // Update profile totals directly (users have UPDATE permission on own profile).
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_points, total_visits, unique_shops_visited')
      .eq('id', userId)
      .single();
    if (profile) {
      const newVisits = profile.total_visits + 1;
      const newUniqueShops = isFirstVisit
        ? profile.unique_shops_visited + 1
        : profile.unique_shops_visited;

      await supabase.from('profiles').update({
        total_points: profile.total_points + pointsEarned,
        total_visits: newVisits,
        unique_shops_visited: newUniqueShops,
      }).eq('id', userId);

      // Award badges client-side (fallback when badge trigger not yet applied).
      const { data: activeBadges } = await supabase
        .from('badges')
        .select('id, criteria_type, criteria_value, criteria_shops')
        .eq('is_active', true);

      // Fetch visited shop IDs once if any shop_tour badges exist
      const hasTourBadge = (activeBadges ?? []).some((b: any) => b.criteria_type === 'shop_tour');
      let visitedShopIds: Set<string> = new Set();
      if (hasTourBadge) {
        const { data: visits } = await supabase
          .from('checkins')
          .select('shop_id')
          .eq('user_id', userId);
        visitedShopIds = new Set((visits ?? []).map((v: any) => v.shop_id));
      }

      const toAward = (activeBadges ?? []).filter((b: any) => {
        if (beforeBadges.has(b.id)) return false;
        if (b.criteria_type === 'total_checkins') return newVisits >= b.criteria_value;
        if (b.criteria_type === 'unique_shops') return newUniqueShops >= b.criteria_value;
        if (b.criteria_type === 'shop_tour' && Array.isArray(b.criteria_shops) && b.criteria_shops.length > 0) {
          return b.criteria_shops.every((id: string) => visitedShopIds.has(id));
        }
        return false;
      });

      if (toAward.length > 0) {
        await supabase.from('user_badges').insert(
          toAward.map((b: any) => ({ user_id: userId, badge_id: b.id }))
        );
      }
    }
  } else if (isFeatured) {
    // DB trigger ran but we still need to apply the featured bonus on top
    pointsEarned += FEATURED_BONUS_POINTS;
    await supabase
      .from('checkins')
      .update({ points_earned: pointsEarned })
      .eq('id', checkin.id);
    const { data: profileForBonus } = await supabase
      .from('profiles')
      .select('total_points')
      .eq('id', userId)
      .single();
    if (profileForBonus) {
      await supabase
        .from('profiles')
        .update({ total_points: profileForBonus.total_points + FEATURED_BONUS_POINTS })
        .eq('id', userId);
    }
  }

  // Diff badges to find newly awarded ones
  const afterBadgeIds = await getEarnedBadgeIds(userId);
  const newBadgeIds = [...afterBadgeIds].filter((id) => !beforeBadges.has(id));
  const newBadges = await fetchBadgesByIds(newBadgeIds);

  return {
    checkin: checkin as CheckIn,
    pointsEarned,
    newBadges,
  };
}

export interface UpdateCheckInParams {
  checkInId: string;
  userId: string;
  /** Local file URIs of newly picked photos to upload. */
  newPhotoUris?: string[];
  /** Existing remote URLs to keep (user may have removed some). */
  existingPhotoUrls: string[];
  notes: string;
}

export async function updateCheckIn(params: UpdateCheckInParams): Promise<void> {
  const { checkInId, userId, newPhotoUris = [], existingPhotoUrls, notes } = params;

  // Upload any new photos
  const newUrls: string[] = [];
  if (newPhotoUris.length > 0) {
    const uploadedPaths = await Promise.all(newPhotoUris.map((uri) => uploadCheckinPhoto(userId, uri)));
    for (const path of uploadedPaths) {
      const { data } = supabase.storage.from('checkin-photos').getPublicUrl(path);
      newUrls.push(data.publicUrl);
    }
  }

  const photoUrls = [...existingPhotoUrls, ...newUrls];
  const photoUrl = photoUrls[0] ?? null;

  const { error } = await supabase
    .from('checkins')
    .update({ photo_url: photoUrl, photo_urls: photoUrls, notes: notes.trim() || null })
    .eq('id', checkInId);

  if (error) throw error;
}

/** Return the set of shop IDs the user has ever checked in to. */
export async function fetchVisitedShopIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('checkins')
    .select('shop_id')
    .eq('user_id', userId);
  if (error) throw error;
  return new Set((data ?? []).map((r: any) => r.shop_id as string));
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
