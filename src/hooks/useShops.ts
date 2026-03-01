import { useQuery } from '@tanstack/react-query';
import { fetchShops, fetchShopById } from '../lib/shops';

export function useShops() {
  return useQuery({
    queryKey: ['shops'],
    queryFn: fetchShops,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

export function useShop(id: string) {
  return useQuery({
    queryKey: ['shop', id],
    queryFn: () => fetchShopById(id),
    staleTime: 5 * 60 * 1000,
  });
}
