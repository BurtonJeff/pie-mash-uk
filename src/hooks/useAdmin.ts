import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAdminStats,
  fetchAdminShops,
  fetchAdminShopById,
  setShopFeatured,
  setShopActive,
  addShop,
  updateShop,
  ShopFormData,
  fetchAdminBadges,
  fetchAdminBadgeById,
  setBadgeActive,
  addBadge,
  updateBadge,
  BadgeFormData,
  fetchAdminChallenges,
  fetchAdminChallengeById,
  addChallenge,
  updateChallenge,
  ChallengeFormData,
  fetchShopPhotos,
  uploadShopPhoto,
  deleteShopPhoto,
  setShopPhotoPrimary,
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

export function useAdminShopById(shopId: string | undefined) {
  return useQuery({
    queryKey: ['adminShop', shopId],
    queryFn: () => fetchAdminShopById(shopId!),
    enabled: !!shopId,
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

export function useUpdateShop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ shopId, data }: { shopId: string; data: ShopFormData }) =>
      updateShop(shopId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminShops'] });
      qc.invalidateQueries({ queryKey: ['adminShop'] });
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

export function useAdminBadgeById(badgeId: string | undefined) {
  return useQuery({
    queryKey: ['adminBadge', badgeId],
    queryFn: () => fetchAdminBadgeById(badgeId!),
    enabled: !!badgeId,
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

export function useUpdateBadge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ badgeId, data }: { badgeId: string; data: BadgeFormData }) =>
      updateBadge(badgeId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminBadges'] });
      qc.invalidateQueries({ queryKey: ['adminBadge'] });
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

export function useAdminChallengeById(challengeId: string | undefined) {
  return useQuery({
    queryKey: ['adminChallenge', challengeId],
    queryFn: () => fetchAdminChallengeById(challengeId!),
    enabled: !!challengeId,
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

export function useUpdateChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ challengeId, data }: { challengeId: string; data: ChallengeFormData }) =>
      updateChallenge(challengeId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminChallenges'] });
      qc.invalidateQueries({ queryKey: ['adminChallenge'] });
    },
  });
}

// ─── Shop Photos ──────────────────────────────────────────────────────────────

export function useShopPhotos(shopId: string | undefined) {
  return useQuery({
    queryKey: ['shopPhotos', shopId],
    queryFn: () => fetchShopPhotos(shopId!),
    enabled: !!shopId,
    staleTime: 0,
  });
}

export function useUploadShopPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      shopId,
      uri,
      isFirst,
    }: {
      shopId: string;
      uri: string;
      isFirst: boolean;
    }) => uploadShopPhoto(shopId, uri, isFirst),
    onSuccess: (_, { shopId }) => {
      qc.invalidateQueries({ queryKey: ['shopPhotos', shopId] });
      qc.invalidateQueries({ queryKey: ['adminShops'] });
      qc.invalidateQueries({ queryKey: ['adminShop', shopId] });
    },
  });
}

export function useDeleteShopPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      photoId,
      storagePath,
    }: {
      photoId: string;
      storagePath: string;
      shopId: string;
    }) => deleteShopPhoto(photoId, storagePath),
    onSuccess: (_, { shopId }) => {
      qc.invalidateQueries({ queryKey: ['shopPhotos', shopId] });
      qc.invalidateQueries({ queryKey: ['adminShops'] });
      qc.invalidateQueries({ queryKey: ['adminShop', shopId] });
    },
  });
}

export function useSetShopPhotoPrimary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ shopId, photoId }: { shopId: string; photoId: string }) =>
      setShopPhotoPrimary(shopId, photoId),
    onSuccess: (_, { shopId }) => {
      qc.invalidateQueries({ queryKey: ['shopPhotos', shopId] });
      qc.invalidateQueries({ queryKey: ['adminShops'] });
      qc.invalidateQueries({ queryKey: ['adminShop', shopId] });
    },
  });
}
