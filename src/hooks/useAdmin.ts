import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAdminStats,
  fetchAdminShops,
  setShopFeatured,
  setShopActive,
  addShop,
  ShopFormData,
  fetchAdminBadges,
  setBadgeActive,
  addBadge,
  BadgeFormData,
  fetchAdminChallenges,
  addChallenge,
  ChallengeFormData,
} from '../lib/admin';

// ─── Stats ────────────────────────────────────────────────────────────────────

export function useAdminStats() {
  return useQuery({
    queryKey: ['adminStats'],
    queryFn: () => fetchAdminStats(),
    staleTime: 30000,
  });
}

// ─── Shops ────────────────────────────────────────────────────────────────────

export function useAdminShops() {
  return useQuery({
    queryKey: ['adminShops'],
    queryFn: () => fetchAdminShops(),
    staleTime: 0,
  });
}

export function useSetShopFeatured() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (shopId: string) => setShopFeatured(shopId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminShops'] });
    },
  });
}

export function useSetShopActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ shopId, active }: { shopId: string; active: boolean }) =>
      setShopActive(shopId, active),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminShops'] });
    },
  });
}

export function useAddShop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ShopFormData) => addShop(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminShops'] });
    },
  });
}

// ─── Badges ───────────────────────────────────────────────────────────────────

export function useAdminBadges() {
  return useQuery({
    queryKey: ['adminBadges'],
    queryFn: () => fetchAdminBadges(),
    staleTime: 0,
  });
}

export function useSetBadgeActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ badgeId, active }: { badgeId: string; active: boolean }) =>
      setBadgeActive(badgeId, active),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminBadges'] });
    },
  });
}

export function useAddBadge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BadgeFormData) => addBadge(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminBadges'] });
    },
  });
}

// ─── Challenges ───────────────────────────────────────────────────────────────

export function useAdminChallenges() {
  return useQuery({
    queryKey: ['adminChallenges'],
    queryFn: () => fetchAdminChallenges(),
    staleTime: 0,
  });
}

export function useAddChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ChallengeFormData) => addChallenge(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminChallenges'] });
    },
  });
}
