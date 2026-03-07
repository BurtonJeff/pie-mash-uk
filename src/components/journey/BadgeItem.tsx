import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Badge } from '../../types/database';
import { Profile } from '../../types/database';

interface Props {
  badge: Badge;
  earned: boolean;
  awardedAt?: string;
  profile?: Profile;
  visitedShopIds?: Set<string>;
  onPress?: () => void;
}

/** How far the user is towards earning this badge (0–1), based on known criteria types. */
function getProgress(badge: Badge, profile?: Profile, visitedShopIds?: Set<string>): number | null {
  if (!profile) return null;
  if (badge.criteria_type === 'total_checkins') {
    return Math.min(profile.total_visits / badge.criteria_value, 1);
  }
  if (badge.criteria_type === 'unique_shops') {
    return Math.min(profile.unique_shops_visited / badge.criteria_value, 1);
  }
  if (badge.criteria_shops?.length) {
    if (!visitedShopIds) return null;
    const visitedCount = badge.criteria_shops.filter((id) => visitedShopIds.has(id)).length;
    return visitedCount / badge.criteria_shops.length;
  }
  return null;
}

export default function BadgeItem({ badge, earned, awardedAt, profile, visitedShopIds, onPress }: Props) {
  const progress = earned ? 1 : getProgress(badge, profile, visitedShopIds);

  return (
    <TouchableOpacity
      style={[styles.container, !earned && styles.locked]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      {/* Icon */}
      <View style={[styles.iconWrap, earned ? styles.iconEarned : styles.iconLocked]}>
        {badge.icon_url?.startsWith('http') ? (
          <Image
            source={{ uri: badge.icon_url }}
            style={[styles.icon, !earned && styles.iconGrey]}
          />
        ) : (
          <Text style={styles.iconEmoji}>{badge.icon_url || '🏅'}</Text>
        )}
      </View>

      {/* Name */}
      <Text style={[styles.name, !earned && styles.nameLocked]} numberOfLines={2}>
        {badge.name}
      </Text>

      {/* Progress bar for unearned badges with known progress */}
      {!earned && progress !== null && (
        <View style={styles.progressWrap}>
          <View style={[styles.progressBar, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
      )}

      {/* Awarded date for earned badges */}
      {earned && awardedAt && (
        <Text style={styles.date}>
          {new Date(awardedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  locked: { opacity: 0.5 },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  iconEarned: { backgroundColor: '#e8f5e9' },
  iconLocked: { backgroundColor: '#f0f0f0' },
  icon: { width: 36, height: 36, borderRadius: 18 },
  iconGrey: { tintColor: '#aaa' },
  iconEmoji: { fontSize: 28 },
  name: { fontSize: 11, fontWeight: '600', textAlign: 'center', color: '#333' },
  nameLocked: { color: '#aaa' },
  progressWrap: {
    marginTop: 5,
    width: '100%',
    height: 3,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: { height: 3, backgroundColor: '#2D5016', borderRadius: 2 },
  date: { fontSize: 9, color: '#aaa', marginTop: 3, textAlign: 'center' },
});
