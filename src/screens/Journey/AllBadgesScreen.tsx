import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { useAllBadges, useUserBadges, useProfile, useUserCheckins } from '../../hooks/useProfile';
import BadgeItem from '../../components/journey/BadgeItem';
import BadgeDetailModal from '../../components/journey/BadgeDetailModal';
import { Badge } from '../../types/database';

type Filter = 'all' | 'earned' | 'locked';

const CATEGORY_LABELS: Record<string, string> = {
  first_visit: 'First Visit',
  quantity: 'Quantity',
  regional: 'Regional',
  social: 'Social',
  seasonal: 'Seasonal',
  speed: 'Speed',
  group: 'Group',
};

export default function AllBadgesScreen() {
  const { user } = useAuthStore();
  const userId = user?.id ?? '';

  const { data: allBadges = [], isLoading: badgesLoading } = useAllBadges();
  const { data: userBadges = [] } = useUserBadges(userId);
  const { data: profile } = useProfile(userId);
  const { data: checkins = [] } = useUserCheckins(userId);

  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<{ badge: Badge; awardedAt?: string } | null>(null);

  const earnedMap = useMemo(
    () => new Map(userBadges.map((ub) => [ub.badge.id, ub.awarded_at])),
    [userBadges],
  );

  const visitedShopIds = useMemo(
    () => new Set(checkins.map((c) => c.shop_id)),
    [checkins],
  );

  const filtered = useMemo(() => {
    if (filter === 'earned') return allBadges.filter((b) => earnedMap.has(b.id));
    if (filter === 'locked') return allBadges.filter((b) => !earnedMap.has(b.id));
    return allBadges;
  }, [allBadges, earnedMap, filter]);

  // Group badges by category for display
  const sections = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const badge of filtered) {
      const cat = badge.category;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(badge);
    }
    return [...map.entries()].map(([category, badges]) => ({ category, badges }));
  }, [filtered]);

  if (badgesLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2D5016" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(['all', 'earned', 'locked'] as Filter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'earned' ? ` (${earnedMap.size})` : ''}
              {f === 'all' ? ` (${allBadges.length})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={sections}
        keyExtractor={(s) => s.category}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>
              {filter === 'earned' ? 'No badges earned yet — start checking in!' : 'No badges found.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.categorySection}>
            <Text style={styles.categoryLabel}>
              {CATEGORY_LABELS[item.category] ?? item.category}
            </Text>
            <View style={styles.badgeGrid}>
              {item.badges.map((badge) => (
                <BadgeItem
                  key={badge.id}
                  badge={badge}
                  earned={earnedMap.has(badge.id)}
                  awardedAt={earnedMap.get(badge.id)}
                  profile={profile}
                  visitedShopIds={visitedShopIds}
                  onPress={() => setSelected({ badge, awardedAt: earnedMap.get(badge.id) })}
                />
              ))}
            </View>
          </View>
        )}
      />
      <BadgeDetailModal
        badge={selected?.badge ?? null}
        earned={selected ? earnedMap.has(selected.badge.id) : false}
        awardedAt={selected?.awardedAt}
        profile={profile}
        visitedShopIds={new Set(checkins.map((c) => c.shop_id))}
        onClose={() => setSelected(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f5f0' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterTab: { flex: 1, paddingVertical: 13, alignItems: 'center' },
  filterTabActive: { borderBottomWidth: 2, borderBottomColor: '#2D5016' },
  filterText: { fontSize: 14, color: '#999' },
  filterTextActive: { color: '#2D5016', fontWeight: '700' },

  listContent: { padding: 16, paddingBottom: 40 },

  categorySection: { marginBottom: 24 },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },

  emptyWrap: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15, color: '#aaa', textAlign: 'center' },
});
