import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { CommunityStackParamList } from '../../navigation/CommunityNavigator';
import { useAuthStore } from '../../store/authStore';
import {
  useAllTimeLeaderboard, useWeeklyLeaderboard,
  useUserGroups, useActiveChallenges,
} from '../../hooks/useCommunity';
import LeaderboardRow from '../../components/community/LeaderboardRow';
import ChallengeCard from '../../components/community/ChallengeCard';
import GroupCard from '../../components/community/GroupCard';
import MemberDetailModal from '../../components/community/MemberDetailModal';
import { LeaderboardEntry } from '../../lib/leaderboard';
import { GroupMember } from '../../lib/groups';
import { fetchActiveSocialLinks, SocialLink } from '../../lib/content';

type Props = NativeStackScreenProps<CommunityStackParamList, 'CommunityHome'>;
type Tab = 'leaderboard' | 'challenges' | 'groups' | 'social';
type LeaderboardPeriod = 'alltime' | 'weekly';

export default function CommunityScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const userId = user?.id ?? '';
  const [tab, setTab] = useState<Tab>('leaderboard');
  const [lbPeriod, setLbPeriod] = useState<LeaderboardPeriod>('alltime');
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null);

  const { data: groups = [] } = useUserGroups(userId);
  const groupIds = useMemo(() => groups.map((g) => g.id), [groups]);

  const allTime = useAllTimeLeaderboard();
  const weekly = useWeeklyLeaderboard();
  const challenges = useActiveChallenges(groupIds);
  const socialLinks = useQuery({
    queryKey: ['socialLinks'],
    queryFn: () => fetchActiveSocialLinks(),
    staleTime: 60000,
  });

  const leaderboard = lbPeriod === 'alltime' ? allTime : weekly;

  const TABS: { key: Tab; label: string }[] = [
    { key: 'leaderboard', label: 'Top' },
    { key: 'challenges', label: 'Challenges' },
    { key: 'groups', label: 'Groups' },
    { key: 'social', label: 'Social' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, tab === key && styles.tabActive]}
            onPress={() => setTab(key)}
          >
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Leaderboard ─────────────────────────────────── */}
      {tab === 'leaderboard' && (
        <>
          <View style={styles.subTabRow}>
            {(['alltime', 'weekly'] as LeaderboardPeriod[]).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.subTab, lbPeriod === p && styles.subTabActive]}
                onPress={() => setLbPeriod(p)}
              >
                <Text style={[styles.subTabText, lbPeriod === p && styles.subTabTextActive]}>
                  {p === 'alltime' ? 'All time' : 'This week'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {leaderboard.isLoading ? (
            <ActivityIndicator style={styles.loader} color="#2D5016" />
          ) : (
            <FlatList
              data={leaderboard.data ?? []}
              keyExtractor={(e) => e.userId}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <LeaderboardRow
                  entry={item}
                  isCurrentUser={item.userId === userId}
                  onPress={() => setSelectedEntry(item)}
                />
              )}
              ListEmptyComponent={<Text style={styles.empty}>No data yet — start checking in!</Text>}
            />
          )}
        </>
      )}

      {/* ── Challenges ───────────────────────────────────── */}
      {tab === 'challenges' && challenges.isLoading && <ActivityIndicator style={styles.loader} color="#2D5016" />}
      {tab === 'challenges' && !challenges.isLoading && (
        <FlatList
          data={challenges.data ?? []}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <ChallengeCard challenge={item} />}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyEmoji}>🏆</Text>
                <Text style={styles.empty}>No active challenges right now.</Text>
                <Text style={styles.emptySub}>Check back soon, or create one in a group.</Text>
              </View>
            }
          />
      )}

      {/* ── Groups ───────────────────────────────────────── */}
      {tab === 'groups' && (
        <FlatList
          data={groups}
          keyExtractor={(g) => g.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              {/* In-app group actions */}
              <View style={styles.groupActions}>
                <TouchableOpacity
                  style={styles.groupActionButton}
                  onPress={() => navigation.navigate('CreateGroup')}
                >
                  <Text style={styles.groupActionText}>+ Create group</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.groupActionButton, styles.groupActionOutline]}
                  onPress={() => navigation.navigate('JoinGroup')}
                >
                  <Text style={[styles.groupActionText, styles.groupActionOutlineText]}>Join with code</Text>
                </TouchableOpacity>
              </View>
            </>
          }
          renderItem={({ item }) => (
            <GroupCard
              group={item}
              onPress={() => navigation.navigate('GroupDetail', { groupId: item.id, groupName: item.name, inviteCode: item.inviteCode, createdBy: item.createdBy, requiresConfirmation: item.requiresConfirmation })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>👥</Text>
              <Text style={styles.empty}>You're not in any groups yet.</Text>
              <Text style={styles.emptySub}>Create one or join with an invite code.</Text>
            </View>
          }
        />
      )}

      {/* ── Social ───────────────────────────────────────── */}
      {tab === 'social' && socialLinks.isLoading && <ActivityIndicator style={styles.loader} color="#2D5016" />}
      {tab === 'social' && !socialLinks.isLoading && (
        <FlatList
          data={socialLinks.data ?? []}
          keyExtractor={(l) => l.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <SocialLinkCard link={item} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>🌐</Text>
              <Text style={styles.empty}>No social links yet.</Text>
            </View>
          }
        />
      )}

      <MemberDetailModal
        member={selectedEntry ? entryToMember(selectedEntry) : null}
        onClose={() => setSelectedEntry(null)}
      />
    </SafeAreaView>
  );
}

function SocialLinkCard({ link }: { link: SocialLink }) {
  return (
    <TouchableOpacity
      style={styles.socialCard}
      onPress={() => Linking.openURL(link.url)}
      activeOpacity={0.85}
    >
      <View style={[styles.socialIconWrap, { backgroundColor: link.icon_color }]}>
        <Ionicons name={link.icon_name as any} size={26} color="#fff" />
      </View>
      <Text style={styles.socialLabel}>{link.label}</Text>
      <Ionicons name="open-outline" size={18} color="#aaa" />
    </TouchableOpacity>
  );
}

function entryToMember(entry: LeaderboardEntry): GroupMember {
  return {
    userId: entry.userId,
    username: entry.username,
    displayName: entry.displayName,
    avatarUrl: entry.avatarUrl,
    bio: entry.bio,
    totalPoints: entry.points,
    totalVisits: entry.totalVisits,
    uniqueShopsVisited: entry.uniqueShops,
    role: 'member',
    status: 'active',
    joinedAt: entry.memberSince,
  };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f5f0' },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: { flex: 1, paddingVertical: 13, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#2D5016' },
  tabText: { fontSize: 13, color: '#999' },
  tabTextActive: { color: '#2D5016', fontWeight: '700' },

  subTabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  subTab: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  subTabActive: { backgroundColor: '#2D5016', borderColor: '#2D5016' },
  subTabText: { fontSize: 13, color: '#555' },
  subTabTextActive: { color: '#fff', fontWeight: '600' },

  listContent: { padding: 16, paddingBottom: 32 },
  loader: { marginTop: 60 },
  empty: { textAlign: 'center', color: '#aaa', fontSize: 14, marginTop: 8 },
  emptyWrap: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptySub: { fontSize: 13, color: '#bbb', marginTop: 4 },

  // ── Social cards ───────────────────────────────────
  socialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  socialIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1a1a1a' },

  groupActions: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  groupActionButton: {
    flex: 1, backgroundColor: '#2D5016', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  groupActionOutline: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#2D5016' },
  groupActionText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  groupActionOutlineText: { color: '#2D5016' },
});
