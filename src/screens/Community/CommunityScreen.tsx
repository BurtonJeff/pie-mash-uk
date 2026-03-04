import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
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

const FACEBOOK_GROUP_URL = 'https://www.facebook.com/groups/2223751270';

type Props = NativeStackScreenProps<CommunityStackParamList, 'CommunityHome'>;
type Tab = 'leaderboard' | 'challenges' | 'groups';
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

  const leaderboard = lbPeriod === 'alltime' ? allTime : weekly;

  const TABS: { key: Tab; label: string }[] = [
    { key: 'leaderboard', label: 'Top' },
    { key: 'challenges', label: 'Challenges' },
    { key: 'groups', label: 'Groups' },
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
              {/* Facebook community card */}
              <TouchableOpacity
                style={styles.fbCard}
                onPress={() => Linking.openURL(FACEBOOK_GROUP_URL)}
                activeOpacity={0.85}
              >
                <View style={styles.fbIconWrap}>
                  <Ionicons name="logo-facebook" size={28} color="#fff" />
                </View>
                <View style={styles.fbText}>
                  <Text style={styles.fbTitle}>Pie, Mash & Liquor Appreciation</Text>
                  <Text style={styles.fbSub}>Join the conversation in the Facebook group for all things Pie, Mash and Liquor</Text>
                </View>
                <Ionicons name="open-outline" size={18} color="#1877F2" />
              </TouchableOpacity>

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
              onPress={() => navigation.navigate('GroupDetail', { groupId: item.id, groupName: item.name, inviteCode: item.inviteCode })}
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

      <MemberDetailModal
        member={selectedEntry ? entryToMember(selectedEntry) : null}
        onClose={() => setSelectedEntry(null)}
      />
    </SafeAreaView>
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

  // ── Facebook card ──────────────────────────────────
  fbCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#1877F2',
    gap: 12,
  },
  fbIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#1877F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fbText: { flex: 1 },
  fbTitle: { fontSize: 14, fontWeight: '700', color: '#1a1a1a', marginBottom: 2 },
  fbSub: { fontSize: 12, color: '#888', lineHeight: 17 },

  groupActions: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  groupActionButton: {
    flex: 1, backgroundColor: '#2D5016', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  groupActionOutline: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#2D5016' },
  groupActionText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  groupActionOutlineText: { color: '#2D5016' },
});
