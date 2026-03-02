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
    .neq('id', '');

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

export interface ShopFormData {
  name: string;
  description: string;
  address_line1: string;
  address_line2: string;
  city: string;
  postcode: string;
  phone: string;
  website: string;
  latitude: string;
  longitude: string;
  price_range: 1 | 2 | 3 | 4;
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
    latitude: parseFloat(data.latitude),
    longitude: parseFloat(data.longitude),
    price_range: data.price_range,
    opening_hours: {},
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
      latitude: parseFloat(data.latitude),
      longitude: parseFloat(data.longitude),
      price_range: data.price_range,
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
  criteria_type: 'total_checkins' | 'unique_shops';
  criteria_value: string;
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

  const { error } = await supabase.from('badges').insert({
    slug,
    name: data.name,
    description: data.description,
    icon_url: data.icon_url,
    category: data.category,
    criteria_type: data.criteria_type,
    criteria_value: parseInt(data.criteria_value, 10),
    is_active: true,
  });

  if (error) throw error;
}

export async function updateBadge(badgeId: string, data: BadgeFormData): Promise<void> {
  const { error } = await supabase
    .from('badges')
    .update({
      name: data.name,
      description: data.description,
      icon_url: data.icon_url,
      category: data.category,
      criteria_type: data.criteria_type,
      criteria_value: parseInt(data.criteria_value, 10),
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
  }));
}

export interface ChallengeFormData {
  title: string;
  description: string;
  points_reward: string;
  start_date: string;
  end_date: string;
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
    })
    .eq('id', challengeId);

  if (error) throw error;
}

export async function addChallenge(data: ChallengeFormData): Promise<void> {
  const { error } = await supabase.from('challenges').insert({
    title: data.title,
    description: data.description,
    points_reward: parseInt(data.points_reward, 10),
    start_date: data.start_date,
    end_date: data.end_date,
    scope: 'global',
    is_active: true,
    criteria: {},
    group_id: null,
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

  const response = await fetch(uri);
  const blob = await response.blob();

  const { error: storageError } = await supabase.storage
    .from('shop-photos')
    .upload(path, blob, { contentType, upsert: false });

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
