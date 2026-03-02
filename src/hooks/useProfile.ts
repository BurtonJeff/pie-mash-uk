import { useQuery } from '@tanstack/react-query';
import { fetchProfile, fetchUserBadges, fetchAllBadges } from '../lib/profile';
import { fetchUserCheckins } from '../lib/checkins';

export function useProfile(userId: string) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId),
    enabled: !!userId,
    refetchOnMount: 'always',
  });
}

export function useUserBadges(userId: string) {
  return useQuery({
    queryKey: ['userBadges', userId],
    queryFn: () => fetchUserBadges(userId),
    enabled: !!userId,
  });
}

export function useAllBadges() {
  return useQuery({
    queryKey: ['allBadges'],
    queryFn: fetchAllBadges,
    staleTime: 30 * 60 * 1000, // badge catalogue rarely changes
  });
}

export function useUserCheckins(userId: string) {
  return useQuery({
    queryKey: ['userCheckins', userId],
    queryFn: () => fetchUserCheckins(userId),
    enabled: !!userId,
  });
}
