import { supabase } from './supabase';
import { Shop } from '../types/database';

export interface ShopWithPhoto extends Shop {
  primary_photo?: string | null;
}

export async function fetchShops(): Promise<ShopWithPhoto[]> {
  const { data, error } = await supabase
    .from('shops')
    .select(`
      *,
      shop_photos (storage_path, is_primary)
    `)
    .eq('is_active', true)
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

export async function fetchShopById(id: string): Promise<ShopWithPhoto & { photos: string[] }> {
  const { data, error } = await supabase
    .from('shops')
    .select(`
      *,
      shop_photos (storage_path, is_primary, caption)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;

  const photos: string[] = (data.shop_photos ?? [])
    .sort((a: any) => (a.is_primary ? -1 : 1))
    .map((p: any) => p.storage_path);

  return {
    ...data,
    primary_photo: photos[0] ?? null,
    photos,
  };
}
