import { supabase } from './supabase';
import { ShopWithPhoto } from './shops';

export async function fetchFeaturedShop(): Promise<ShopWithPhoto | null> {
  const { data, error } = await supabase
    .from('shops')
    .select('*, shop_photos(storage_path, is_primary)')
    .eq('is_active', true)
    .eq('is_featured', true)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const primary_photo =
    (data as any).shop_photos?.find((p: any) => p.is_primary)?.storage_path ??
    (data as any).shop_photos?.[0]?.storage_path ??
    null;

  return { ...data, primary_photo } as ShopWithPhoto;
}
