import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, ActivityIndicator, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { JourneyStackParamList } from '../../navigation/JourneyNavigator';
import { useAuthStore } from '../../store/authStore';
import { useProfile, useUserBadges, useUserCheckins } from '../../hooks/useProfile';
import BadgeItem from '../../components/journey/BadgeItem';
import BadgeDetailModal from '../../components/journey/BadgeDetailModal';
import VisitRow from '../../components/journey/VisitRow';
import { signOut } from '../../lib/auth';
import { Badge } from '../../types/database';

type Props = NativeStackScreenProps<JourneyStackParamList, 'JourneyHome'>;
type Tab = 'piehole' | 'badges' | 'visits';

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(' ');
  const initials = parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : name.slice(0, 2);
  return (
    <View style={styles.avatarPlaceholder}>
      <Text style={styles.avatarInitials}>{initials.toUpperCase()}</Text>
    </View>
  );
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'piehole', label: 'My Piehole' },
  { key: 'badges', label: 'Badges' },
  { key: 'visits', label: 'Check-Ins' },
];

export default function JourneyScreen({ navigation }: Props) {
  const { user, initialized } = useAuthStore();
  const userId = user?.id ?? '';
  const [tab, setTab] = useState<Tab>('piehole');
  const [selectedBadge, setSelectedBadge] = useState<{ badge: Badge; awardedAt?: string } | null>(null);

  const { data: profile, isLoading: profileLoading } = useProfile(userId);
  const { data: userBadges = [] } = useUserBadges(userId);
  const { data: checkins = [], isLoading: checkinsLoading } = useUserCheckins(userId);

  if (!initialized || profileLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2D5016" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Could not load profile.</Text>
      </View>
    );
  }

  const memberSince = new Date(profile.created_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>

      {/* ── Tab bar ──────────────────────────────────────── */}
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

      {/* ── My Piehole ───────────────────────────────────── */}
      {tab === 'piehole' && (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>

          {/* Profile row */}
          <View style={styles.profileRow}>
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <Initials name={profile.display_name || profile.username} />
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.displayName}>{profile.display_name}</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{profile.total_points}</Text>
                  <Text style={styles.statLabel}>Points</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{profile.unique_shops_visited}</Text>
                  <Text style={styles.statLabel}>Shops</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{profile.total_visits}</Text>
                  <Text style={styles.statLabel}>Visits</Text>
                </View>
              </View>
              <Text style={styles.memberSince}>Proud user since {memberSince}</Text>
              {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
            </View>
          </View>

          {/* Options */}
          <View style={styles.accountSection}>
            <AccountRow
              icon="person-outline"
              iconBg="#e8f0fb"
              iconColor="#2c5fba"
              label="Edit Profile"
              onPress={() => navigation.navigate('EditProfile')}
            />
            <AccountDivider />
            <AccountRow
              icon="settings-outline"
              iconBg="#f0f0f0"
              iconColor="#555"
              label="Settings"
              onPress={() => navigation.navigate('Settings')}
            />
            <AccountDivider />
            <AccountRow
              icon="log-out-outline"
              iconBg="#fdecea"
              iconColor="#c0392b"
              label="Sign Out"
              destructive
              onPress={signOut}
            />
          </View>

        </ScrollView>
      )}

      {/* ── Badges ───────────────────────────────────────── */}
      {tab === 'badges' && (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          <View style={styles.badgesHeader}>
            <Text style={styles.badgesCount}>
              {userBadges.length} badge{userBadges.length !== 1 ? 's' : ''} earned
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('AllBadges')}>
              <Text style={styles.seeAll}>View full collection →</Text>
            </TouchableOpacity>
          </View>
          {userBadges.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>🏅</Text>
              <Text style={styles.empty}>No badges yet</Text>
              <Text style={styles.emptySub}>Check in at your first shop to earn your first badge.</Text>
            </View>
          ) : (
            <View style={styles.badgeGrid}>
              {userBadges.map((ub) => (
                <BadgeItem
                  key={ub.badge.id}
                  badge={ub.badge}
                  earned
                  awardedAt={ub.awarded_at}
                  profile={profile}
                  onPress={() => setSelectedBadge({ badge: ub.badge, awardedAt: ub.awarded_at })}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* ── Visit History ─────────────────────────────────── */}
      {checkinsLoading && tab === 'visits' && (
        <ActivityIndicator style={styles.loader} color="#2D5016" />
      )}
      {!checkinsLoading && tab === 'visits' && (
        <FlatList
          data={checkins}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <VisitRow
              shopName={item.shop_name}
              checkedInAt={item.checked_in_at}
              photoUrl={item.photo_url}
              photoUrls={item.photo_urls}
              shopPrimaryPhoto={item.shop_primary_photo}
              pointsEarned={item.points_earned}
              onEdit={() => navigation.navigate('EditCheckIn', {
                checkInId: item.id,
                shopName: item.shop_name,
                initialPhotoUrls: item.photo_urls?.length ? item.photo_urls : (item.photo_url ? [item.photo_url] : []),
                initialNotes: item.notes ?? null,
              })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>📍</Text>
              <Text style={styles.empty}>No visits yet</Text>
              <Text style={styles.emptySub}>Head to the Check In tab to log your first visit.</Text>
            </View>
          }
        />
      )}

      <BadgeDetailModal
        badge={selectedBadge?.badge ?? null}
        earned={!!selectedBadge}
        awardedAt={selectedBadge?.awardedAt}
        profile={profile}
        visitedShopIds={new Set(checkins.map((c) => c.shop_id))}
        onClose={() => setSelectedBadge(null)}
      />
    </SafeAreaView>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────

function AccountRow({
  icon, iconBg, iconColor, label, destructive = false, onPress,
}: {
  icon: string; iconBg: string; iconColor: string;
  label: string; destructive?: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.accountRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.accountRowLeft}>
        <View style={[styles.accountIconWrap, { backgroundColor: iconBg }]}>
          <Ionicons name={icon as any} size={18} color={iconColor} />
        </View>
        <Text style={[styles.accountRowText, destructive && styles.destructiveText]}>{label}</Text>
      </View>
      {!destructive && <Ionicons name="chevron-forward" size={17} color="#ccc" />}
    </TouchableOpacity>
  );
}

function AccountDivider() {
  return <View style={styles.accountDivider} />;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f5f0' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#c00', fontSize: 15 },

  // ── Tab bar ───────────────────────────────────────────
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

  // ── Shared content padding ────────────────────────────
  listContent: { padding: 16, paddingBottom: 32 },
  loader: { marginTop: 60 },

  // ── My Piehole — profile ──────────────────────────────
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#f0ede8',
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2D5016',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 22, fontWeight: '700', color: '#fff' },
  profileInfo: { flex: 1, marginLeft: 14 },
  displayName: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 4 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#2D5016' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 1 },
  statDivider: { width: 1, height: 28, backgroundColor: '#e8e0d8', marginHorizontal: 12 },
  memberSince: { fontSize: 12, color: '#888', marginTop: 3 },
  bio: { fontSize: 14, color: '#666', marginTop: 4, lineHeight: 20 },

  // ── My Piehole — account options ──────────────────────
  accountSection: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  accountRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  accountIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountRowText: { fontSize: 15, fontWeight: '500', color: '#1a1a1a' },
  destructiveText: { color: '#c0392b' },
  accountDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#ebebeb',
    marginLeft: 62,
  },

  // ── Badges ────────────────────────────────────────────
  badgesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgesCount: { fontSize: 13, color: '#888' },
  seeAll: { fontSize: 13, color: '#2D5016', fontWeight: '600' },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },

  // ── Empty states ──────────────────────────────────────
  emptyWrap: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  empty: { textAlign: 'center', color: '#aaa', fontSize: 14, marginTop: 8 },
  emptySub: { fontSize: 13, color: '#bbb', marginTop: 4, textAlign: 'center' },
});
