import { File } from 'expo-file-system/next';
import { supabase } from './supabase';
import { Shop, Badge } from '../types/database';

// ─── Stats ───────────────────────────────────────────────────────────────────

export interface AdminStats {
  totalUsers: number;
  totalShops: number;
  checkInsToday: number;
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const todayMidnight = new Date();
  todayMidnight.setUTCHours(0, 0, 0, 0);

  const [usersResult, shopsResult, checkInsResult] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('shops').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase
      .from('check_ins')
      .select('id', { count: 'exact', head: true })
      .gte('checked_in_at', todayMidnight.toISOString()),
  ]);

  if (usersResult.error) throw usersResult.error;
  if (shopsResult.error) throw shopsResult.error;
  if (checkInsResult.error) throw checkInsResult.error;

  return {
    totalUsers: usersResult.count ?? 0,
    totalShops: shopsResult.count ?? 0,
    checkInsToday: checkInsResult.count ?? 0,
  };
}

// ─── Shops ────────────────────────────────────────────────────────────────────

export interface AdminShop extends Shop {
  primary_photo: string | null;
}

export async function fetchAdminShops(): Promise<AdminShop[]> {
  const { data, error } = await supabase
    .from('shops')
    .select(`
      *,
      shop_photos (storage_path, is_primary)
    `)
    .order('name');

  if (error) throw error;

  return (data ?? []).map((shop: any) => ({
    ...shop,
    primary_photo:
      shop.shop_photos?.find((p: any) => p.is_primary)?.storage_path ??
      shop.shop_photos?.[0]?.storage_path ??
      null,
  }));
}

export async function setShopFeatured(shopId: string): Promise<void> {
  const { error: clearError } = await supabase
    .from('shops')
    .update({ is_featured: false })
    .eq('is_featured', true);

  if (clearError) throw clearError;

  const { error } = await supabase
    .from('shops')
    .update({ is_featured: true })
    .eq('id', shopId);

  if (error) throw error;
}

export async function setShopActive(shopId: string, active: boolean): Promise<void> {
  const { error } = await supabase
    .from('shops')
    .update({ is_active: active })
    .eq('id', shopId);

  if (error) throw error;
}

export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

export type OpeningHours = Record<string, DayHours>;

export const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

export const DEFAULT_OPENING_HOURS: OpeningHours = {
  monday:    { open: '11:00', close: '14:00', closed: false },
  tuesday:   { open: '11:00', close: '14:00', closed: false },
  wednesday: { open: '11:00', close: '14:00', closed: false },
  thursday:  { open: '11:00', close: '14:00', closed: false },
  friday:    { open: '11:00', close: '14:30', closed: false },
  saturday:  { open: '10:00', close: '14:30', closed: false },
  sunday:    { open: '00:00', close: '00:00', closed: true  },
};

export interface ShopFormData {
  name: string;
  description: string;
  address_line1: string;
  address_line2: string;
  city: string;
  postcode: string;
  phone: string;
  website: string;
  facebook_url: string;
  latitude: string;
  longitude: string;
  price_range: 1 | 2 | 3 | 4;
  opening_hours: OpeningHours;
}

export async function fetchAdminShopById(shopId: string): Promise<AdminShop> {
  const { data, error } = await supabase
    .from('shops')
    .select('*, shop_photos(storage_path, is_primary)')
    .eq('id', shopId)
    .single();

  if (error) throw error;

  return {
    ...data,
    primary_photo:
      data.shop_photos?.find((p: any) => p.is_primary)?.storage_path ??
      data.shop_photos?.[0]?.storage_path ??
      null,
  };
}

export async function addShop(data: ShopFormData): Promise<void> {
  const slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const { error } = await supabase.from('shops').insert({
    name: data.name,
    slug,
    description: data.description,
    address_line1: data.address_line1,
    address_line2: data.address_line2 || null,
    city: data.city,
    postcode: data.postcode,
    phone: data.phone || null,
    website: data.website || null,
    facebook_url: data.facebook_url || null,
    latitude: parseFloat(data.latitude),
    longitude: parseFloat(data.longitude),
    price_range: data.price_range,
    opening_hours: data.opening_hours,
    is_active: true,
    is_featured: false,
  });

  if (error) throw error;
}

export async function updateShop(shopId: string, data: ShopFormData): Promise<void> {
  const { error } = await supabase
    .from('shops')
    .update({
      name: data.name,
      description: data.description,
      address_line1: data.address_line1,
      address_line2: data.address_line2 || null,
      city: data.city,
      postcode: data.postcode,
      phone: data.phone || null,
      website: data.website || null,
      facebook_url: data.facebook_url || null,
      latitude: parseFloat(data.latitude),
      longitude: parseFloat(data.longitude),
      price_range: data.price_range,
      opening_hours: data.opening_hours,
    })
    .eq('id', shopId);

  if (error) throw error;
}

// ─── Badges ───────────────────────────────────────────────────────────────────

export async function fetchAdminBadges(): Promise<Badge[]> {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .order('name');

  if (error) throw error;
  return data ?? [];
}

export async function setBadgeActive(badgeId: string, active: boolean): Promise<void> {
  const { error } = await supabase
    .from('badges')
    .update({ is_active: active })
    .eq('id', badgeId);

  if (error) throw error;
}

export interface BadgeFormData {
  name: string;
  description: string;
  icon_url: string;
  category: string;
  criteria_type: 'total_checkins' | 'unique_shops' | 'shop_tour';
  criteria_value: string;
  criteria_shops: string[];
}

export async function fetchAdminBadgeById(badgeId: string): Promise<Badge> {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .eq('id', badgeId)
    .single();

  if (error) throw error;
  return data as Badge;
}

export async function addBadge(data: BadgeFormData): Promise<void> {
  const slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const isShopTour = data.criteria_type === 'shop_tour';

  const { error } = await supabase.from('badges').insert({
    slug,
    name: data.name,
    description: data.description,
    icon_url: data.icon_url,
    category: data.category,
    criteria_type: data.criteria_type,
    criteria_value: isShopTour ? data.criteria_shops.length : parseInt(data.criteria_value, 10),
    criteria_shops: isShopTour ? data.criteria_shops : null,
    is_active: true,
  });

  if (error) throw error;
}

export async function updateBadge(badgeId: string, data: BadgeFormData): Promise<void> {
  const isShopTour = data.criteria_type === 'shop_tour';

  const { error } = await supabase
    .from('badges')
    .update({
      name: data.name,
      description: data.description,
      icon_url: data.icon_url,
      category: data.category,
      criteria_type: data.criteria_type,
      criteria_value: isShopTour ? data.criteria_shops.length : parseInt(data.criteria_value, 10),
      criteria_shops: isShopTour ? data.criteria_shops : null,
    })
    .eq('id', badgeId);

  if (error) throw error;
}

// ─── Challenges ───────────────────────────────────────────────────────────────

export interface AdminChallenge {
  id: string;
  title: string;
  description: string;
  pointsReward: number;
  startDate: string;
  endDate: string;
  scope: 'global' | 'group';
  isActive: boolean;
  criteriaType: string;
  criteriaValue: number;
  criteriaShops: string[];
}

export async function fetchAdminChallenges(): Promise<AdminChallenge[]> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .order('start_date', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((c: any) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    pointsReward: c.points_reward,
    startDate: c.start_date,
    endDate: c.end_date,
    scope: c.scope,
    isActive: c.is_active,
    criteriaType: c.criteria?.type ?? 'total_checkins',
    criteriaValue: c.criteria?.value ?? 0,
    criteriaShops: c.criteria?.shops ?? [],
  }));
}

export interface ChallengeFormData {
  title: string;
  description: string;
  points_reward: string;
  start_date: string;
  end_date: string;
  criteria_type: 'total_checkins' | 'unique_shops' | 'shop_tour';
  criteria_value: string;
  criteria_shops: string[];
}

export async function fetchAdminChallengeById(challengeId: string): Promise<AdminChallenge> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', challengeId)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    pointsReward: data.points_reward,
    startDate: data.start_date,
    endDate: data.end_date,
    scope: data.scope,
    isActive: data.is_active,
    criteriaType: data.criteria?.type ?? 'total_checkins',
    criteriaValue: data.criteria?.value ?? 0,
    criteriaShops: data.criteria?.shops ?? [],
  };
}

export async function updateChallenge(challengeId: string, data: ChallengeFormData): Promise<void> {
  const { error } = await supabase
    .from('challenges')
    .update({
      title: data.title,
      description: data.description,
      points_reward: parseInt(data.points_reward, 10),
      start_date: data.start_date,
      end_date: data.end_date,
      criteria: {
        type: data.criteria_type,
        value: data.criteria_type !== 'shop_tour' ? parseInt(data.criteria_value, 10) : 0,
        shops: data.criteria_type === 'shop_tour' ? data.criteria_shops : [],
      },
    })
    .eq('id', challengeId);

  if (error) throw error;
}

export async function addChallenge(data: ChallengeFormData): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('challenges').insert({
    title: data.title,
    description: data.description,
    points_reward: parseInt(data.points_reward, 10),
    start_date: data.start_date,
    end_date: data.end_date,
    scope: 'global',
    is_active: true,
    criteria: {
      type: data.criteria_type,
      value: data.criteria_type !== 'shop_tour' ? parseInt(data.criteria_value, 10) : 0,
      shops: data.criteria_type === 'shop_tour' ? data.criteria_shops : [],
    },
    group_id: null,
    created_by: user?.id,
  });

  if (error) throw error;
}

// ─── Shop Photos ──────────────────────────────────────────────────────────────

export interface ShopPhoto {
  id: string;
  storage_path: string;
  is_primary: boolean;
}

export async function fetchShopPhotos(shopId: string): Promise<ShopPhoto[]> {
  const { data, error } = await supabase
    .from('shop_photos')
    .select('id, storage_path, is_primary')
    .eq('shop_id', shopId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as ShopPhoto[];
}

export async function uploadShopPhoto(shopId: string, uri: string, isFirst: boolean): Promise<ShopPhoto> {
  const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
  const path = `shops/${shopId}/${Date.now()}.${ext}`;

  const file = new File(uri);
  const bytes = await file.bytes();

  const { error: storageError } = await supabase.storage
    .from('shop-photos')
    .upload(path, bytes, { contentType, upsert: false });

  if (storageError) throw storageError;

  const { data, error } = await supabase
    .from('shop_photos')
    .insert({ shop_id: shopId, storage_path: path, is_primary: isFirst })
    .select('id, storage_path, is_primary')
    .single();

  if (error) throw error;
  return data as ShopPhoto;
}

export async function deleteShopPhoto(photoId: string, storagePath: string): Promise<void> {
  await supabase.storage.from('shop-photos').remove([storagePath]);

  const { error } = await supabase
    .from('shop_photos')
    .delete()
    .eq('id', photoId);

  if (error) throw error;
}

export async function setShopPhotoPrimary(shopId: string, photoId: string): Promise<void> {
  await supabase
    .from('shop_photos')
    .update({ is_primary: false })
    .eq('shop_id', shopId);

  const { error } = await supabase
    .from('shop_photos')
    .update({ is_primary: true })
    .eq('id', photoId);

  if (error) throw error;
}

// ─── Feedback ─────────────────────────────────────────────────────────────────

export interface FeedbackItem {
  id: string;
  message: string;
  submitted_at: string;
  user: {
    display_name: string;
    username: string;
    avatar_url: string | null;
    total_visits: number;
    total_points: number;
  } | null;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  total_points: number;
  total_visits: number;
  unique_shops_visited: number;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, total_points, total_visits, unique_shops_visited, is_active, is_admin, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function setUserActive(userId: string, active: boolean): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: active })
    .eq('id', userId);
  if (error) throw error;
}

export async function deleteFeedback(id: string): Promise<void> {
  const { error } = await supabase.from('feedback').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchAdminFeedback(): Promise<FeedbackItem[]> {
  const { data, error } = await supabase
    .from('feedback')
    .select(`
      id,
      message,
      submitted_at,
      profiles (
        display_name,
        username,
        avatar_url,
        total_visits,
        total_points
      )
    `)
    .order('submitted_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    message: row.message,
    submitted_at: row.submitted_at,
    user: row.profiles ?? null,
  }));
}
