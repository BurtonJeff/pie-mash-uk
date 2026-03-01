import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAllTimeLeaderboard, fetchWeeklyLeaderboard, fetchGroupLeaderboard } from '../lib/leaderboard';
import { fetchGlobalFeed, fetchGroupFeed } from '../lib/feed';
import { fetchActiveChallenges } from '../lib/challenges';
import { fetchUserGroups, createGroup, joinGroupByCode, fetchGroupMessages, sendMessage } from '../lib/groups';

export function useAllTimeLeaderboard() {
  return useQuery({ queryKey: ['leaderboard', 'alltime'], queryFn: () => fetchAllTimeLeaderboard(), staleTime: 60000 });
}

export function useWeeklyLeaderboard() {
  return useQuery({ queryKey: ['leaderboard', 'weekly'], queryFn: () => fetchWeeklyLeaderboard(), staleTime: 60000 });
}

export function useGroupLeaderboard(groupId: string) {
  return useQuery({
    queryKey: ['leaderboard', 'group', groupId],
    queryFn: () => fetchGroupLeaderboard(groupId),
    enabled: !!groupId,
    staleTime: 60000,
  });
}

export function useGlobalFeed() {
  return useQuery({ queryKey: ['feed', 'global'], queryFn: () => fetchGlobalFeed(), staleTime: 30000 });
}

export function useGroupFeed(groupId: string) {
  return useQuery({
    queryKey: ['feed', 'group', groupId],
    queryFn: () => fetchGroupFeed(groupId),
    enabled: !!groupId,
    staleTime: 30000,
  });
}

export function useUserGroups(userId: string) {
  return useQuery({
    queryKey: ['groups', userId],
    queryFn: () => fetchUserGroups(userId),
    enabled: !!userId,
  });
}

export function useCreateGroup(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, description }: { name: string; description: string }) =>
      createGroup(userId, name, description),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups', userId] }),
  });
}

export function useJoinGroup(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => joinGroupByCode(userId, code),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups', userId] }),
  });
}

export function useGroupMessages(groupId: string) {
  return useQuery({
    queryKey: ['messages', groupId],
    queryFn: () => fetchGroupMessages(groupId),
    enabled: !!groupId,
    staleTime: 0,
  });
}

export function useSendMessage(groupId: string, userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => sendMessage(groupId, userId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages', groupId] }),
  });
}

export function useActiveChallenges(userGroupIds: string[]) {
  return useQuery({
    queryKey: ['challenges', userGroupIds],
    queryFn: () => fetchActiveChallenges(userGroupIds),
    staleTime: 60000,
  });
}
