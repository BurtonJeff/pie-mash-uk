import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAllTimeLeaderboard, fetchWeeklyLeaderboard, fetchMonthlyLeaderboard, fetchYearlyLeaderboard, fetchGroupLeaderboard, GroupLeaderboardPeriod } from '../lib/leaderboard';
import { fetchGlobalFeed, fetchGroupFeed } from '../lib/feed';
import { fetchActiveChallenges, fetchUserCompletedChallenges } from '../lib/challenges';
import { fetchUserGroups, createGroup, joinGroupByCode, fetchGroupMembers, fetchPendingMembers, removeGroupMember, updateMemberRole, approveGroupMember, rejectGroupMember, setGroupRequiresConfirmation } from '../lib/groups';
import { fetchGroupMeetups, proposeMeetup, updateMeetup, cancelMeetup, rsvpMeetup, unrsvpMeetup, fetchMeetupRsvps, fetchUpcomingUserMeetups } from '../lib/meetups';

export function useAllTimeLeaderboard() {
  return useQuery({ queryKey: ['leaderboard', 'alltime'], queryFn: () => fetchAllTimeLeaderboard(), staleTime: 60000 });
}

export function useWeeklyLeaderboard() {
  return useQuery({ queryKey: ['leaderboard', 'weekly'], queryFn: () => fetchWeeklyLeaderboard(), staleTime: 60000 });
}

export function useMonthlyLeaderboard() {
  return useQuery({ queryKey: ['leaderboard', 'monthly'], queryFn: () => fetchMonthlyLeaderboard(), staleTime: 60000 });
}

export function useYearlyLeaderboard() {
  return useQuery({ queryKey: ['leaderboard', 'yearly'], queryFn: () => fetchYearlyLeaderboard(), staleTime: 60000 });
}

export function useGroupLeaderboard(groupId: string, period: GroupLeaderboardPeriod = 'alltime') {
  return useQuery({
    queryKey: ['leaderboard', 'group', groupId, period],
    queryFn: () => fetchGroupLeaderboard(groupId, period),
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
    mutationFn: ({ name, description, requiresConfirmation }: { name: string; description: string; requiresConfirmation: boolean }) =>
      createGroup(userId, name, description, requiresConfirmation),
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

export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: ['groupMembers', groupId],
    queryFn: () => fetchGroupMembers(groupId),
    enabled: !!groupId,
  });
}

export function useRemoveGroupMember(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId: string) => removeGroupMember(groupId, targetUserId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groupMembers', groupId] }),
  });
}

export function usePendingMembers(groupId: string) {
  return useQuery({
    queryKey: ['pendingMembers', groupId],
    queryFn: () => fetchPendingMembers(groupId),
    enabled: !!groupId,
  });
}

export function useApproveGroupMember(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId: string) => approveGroupMember(groupId, targetUserId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pendingMembers', groupId] });
      qc.invalidateQueries({ queryKey: ['groupMembers', groupId] });
    },
  });
}

export function useRejectGroupMember(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId: string) => rejectGroupMember(groupId, targetUserId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pendingMembers', groupId] }),
  });
}

export function useSetGroupRequiresConfirmation(groupId: string, userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (value: boolean) => setGroupRequiresConfirmation(groupId, value),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups', userId] }),
  });
}

export function useUpdateMemberRole(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ targetUserId, role }: { targetUserId: string; role: 'admin' | 'member' }) =>
      updateMemberRole(groupId, targetUserId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groupMembers', groupId] }),
  });
}

export function useGroupMeetups(groupId: string, userId: string) {
  return useQuery({
    queryKey: ['meetups', groupId],
    queryFn: () => fetchGroupMeetups(groupId, userId),
    enabled: !!groupId && !!userId,
    staleTime: 30000,
  });
}

export function useProposeMeetup(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      shopId: string; meetupDate: string; meetupTime: string;
      description?: string; maxAttendees?: number; proposedBy: string;
    }) => proposeMeetup({ groupId, ...params }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meetups', groupId] }),
  });
}

export function useUpdateMeetup(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      meetupId: string; meetupDate: string; meetupTime: string;
      description?: string; maxAttendees?: number | null;
    }) => updateMeetup(params.meetupId, params),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meetups', groupId] }),
  });
}

export function useMeetupRsvps(meetupId: string | null) {
  return useQuery({
    queryKey: ['meetupRsvps', meetupId],
    queryFn: () => fetchMeetupRsvps(meetupId!),
    enabled: !!meetupId,
    staleTime: 30000,
  });
}

export function useCancelMeetup(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ meetupId, cancelledBy }: { meetupId: string; cancelledBy: string }) =>
      cancelMeetup(meetupId, cancelledBy),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meetups', groupId] }),
  });
}

export function useRsvpMeetup(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ meetupId, userId }: { meetupId: string; userId: string }) =>
      rsvpMeetup(meetupId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meetups', groupId] }),
  });
}

export function useUnrsvpMeetup(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ meetupId, userId }: { meetupId: string; userId: string }) =>
      unrsvpMeetup(meetupId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meetups', groupId] }),
  });
}

export function useUpcomingMeetups(userId: string) {
  return useQuery({
    queryKey: ['upcomingMeetups', userId],
    queryFn: () => fetchUpcomingUserMeetups(userId),
    enabled: !!userId,
    staleTime: 60000,
  });
}

export function useActiveChallenges(userGroupIds: string[]) {
  return useQuery({
    queryKey: ['challenges', userGroupIds],
    queryFn: () => fetchActiveChallenges(userGroupIds),
    staleTime: 60000,
  });
}

export function useUserCompletedChallenges(userId: string) {
  return useQuery({
    queryKey: ['completedChallenges', userId],
    queryFn: () => fetchUserCompletedChallenges(userId),
    enabled: !!userId,
    staleTime: 60000,
  });
}
