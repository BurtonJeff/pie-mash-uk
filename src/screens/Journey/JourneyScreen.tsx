import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { JourneyStackParamList } from '../../navigation/JourneyNavigator';
import { useAuthStore } from '../../store/authStore';
import { useProfile, useUserBadges, useUserCheckins } from '../../hooks/useProfile';
import StatCard from '../../components/journey/StatCard';
import BadgeItem from '../../components/journey/BadgeItem';
import VisitRow from '../../components/journey/VisitRow';
import { signOut } from '../../lib/auth';

type Props = NativeStackScreenProps<JourneyStackParamList, 'JourneyHome'>;

const RECENT_VISITS_LIMIT = 5;
const BADGE_PREVIEW_LIMIT = 6;

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

export default function JourneyScreen({ navigation }: Props) {
  const { user, initialized } = useAuthStore();
  const userId = user?.id ?? '';

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

  const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badge.id));
  const recentVisits = checkins.slice(0, RECENT_VISITS_LIMIT);
  const previewBadges = userBadges.slice(0, BADGE_PREVIEW_LIMIT);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Profile header ─────────────────────────────── */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarRow}>
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <Initials name={profile.display_name || profile.username} />
            )}
            <View style={styles.nameBlock}>
              <Text style={styles.displayName}>{profile.display_name}</Text>
              <Text style={styles.username}>@{profile.username}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.settingsIconButton}>
              <Ionicons name="settings-outline" size={22} color="#555" />
            </TouchableOpacity>
          </View>

          {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

          {/* Stats */}
          <View style={styles.statsRow}>
            <StatCard value={profile.total_points.toLocaleString()} label="Points" />
            <View style={styles.statGap} />
            <StatCard value={profile.unique_shops_visited} label="Shops" />
            <View style={styles.statGap} />
            <StatCard value={profile.total_visits} label="Visits" />
          </View>
        </View>

        {/* ── Badge Collection ───────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Badges</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AllBadges')}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>

          {previewBadges.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>🏅</Text>
              <Text style={styles.emptyTitle}>No badges yet</Text>
              <Text style={styles.emptyBody}>Check in at your first shop to earn your first badge.</Text>
            </View>
          ) : (
            <View style={styles.badgeGrid}>
              {previewBadges.map((ub) => (
                <BadgeItem
                  key={ub.badge.id}
                  badge={ub.badge}
                  earned
                  awardedAt={ub.awarded_at}
                  profile={profile}
                />
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.allBadgesButton} onPress={() => navigation.navigate('AllBadges')}>
            <Text style={styles.allBadgesText}>
              {earnedBadgeIds.size} badge{earnedBadgeIds.size !== 1 ? 's' : ''} earned · View full collection
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Visit History ──────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Visit History</Text>
            {checkins.length > RECENT_VISITS_LIMIT && (
              <TouchableOpacity onPress={() => navigation.navigate('AllVisits')}>
                <Text style={styles.seeAll}>See all →</Text>
              </TouchableOpacity>
            )}
          </View>

          {checkinsLoading ? (
            <ActivityIndicator color="#2D5016" style={{ marginTop: 12 }} />
          ) : recentVisits.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>📍</Text>
              <Text style={styles.emptyTitle}>No visits yet</Text>
              <Text style={styles.emptyBody}>Head to the Check In tab to log your first visit.</Text>
            </View>
          ) : (
            recentVisits.map((c) => (
              <VisitRow
                key={c.id}
                shopName={c.shop_name}
                checkedInAt={c.checked_in_at}
                photoUrl={c.photo_url}
                pointsEarned={c.points_earned}
              />
            ))
          )}
        </View>

        {/* ── Sign Out ───────────────────────────────────── */}
        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f5f0' },
  scroll: { paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#c00', fontSize: 15 },

  profileHeader: { backgroundColor: '#fff', padding: 20, marginBottom: 16 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2D5016',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 24, fontWeight: '700', color: '#fff' },
  nameBlock: { flex: 1, marginLeft: 14 },
  displayName: { fontSize: 18, fontWeight: '700' },
  username: { fontSize: 13, color: '#888', marginTop: 2 },
  editButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  editButtonText: { fontSize: 13, fontWeight: '600', color: '#444' },
  bio: { fontSize: 14, color: '#555', marginBottom: 14, lineHeight: 20 },
  statsRow: { flexDirection: 'row', marginTop: 4 },
  statGap: { width: 10 },

  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  seeAll: { fontSize: 13, color: '#2D5016', fontWeight: '600' },

  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },

  allBadgesButton: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  allBadgesText: { fontSize: 13, color: '#2D5016', fontWeight: '600' },

  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyEmoji: { fontSize: 36, marginBottom: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  emptyBody: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 18 },

  settingsIconButton: { marginLeft: 10, padding: 4 },

  signOutButton: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  signOutText: { fontSize: 15, color: '#c00', fontWeight: '600' },
});
