import { useQuery } from '@tanstack/react-query';
import { fetchFeaturedShop } from '../lib/home';

export function useFeaturedShop() {
  return useQuery({
    queryKey: ['featuredShop'],
    queryFn: () => fetchFeaturedShop(),
    staleTime: 60 * 60 * 1000, // 1 hour — featured shop changes weekly at most
  });
}
