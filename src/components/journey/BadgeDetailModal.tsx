import React from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  Image, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Profile } from '../../types/database';

interface Props {
  badge: Badge | null;
  earned: boolean;
  awardedAt?: string;
  profile?: Profile;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  first_visit: 'First Visit',
  quantity: 'Quantity',
  regional: 'Regional',
  social: 'Social',
  seasonal: 'Seasonal',
  speed: 'Speed',
  group: 'Group',
};

function criteriaText(type: string, value: number): string {
  if (type === 'total_checkins') return `Check in ${value} time${value !== 1 ? 's' : ''}`;
  if (type === 'unique_shops') return `Visit ${value} different shop${value !== 1 ? 's' : ''}`;
  return `${type.replace(/_/g, ' ')} — ${value}`;
}

function getProgress(badge: Badge, profile?: Profile): number | null {
  if (!profile) return null;
  if (badge.criteria_type === 'total_checkins') {
    return Math.min(profile.total_visits / badge.criteria_value, 1);
  }
  if (badge.criteria_type === 'unique_shops') {
    return Math.min(profile.unique_shops_visited / badge.criteria_value, 1);
  }
  return null;
}

export default function BadgeDetailModal({ badge, earned, awardedAt, profile, onClose }: Props) {
  if (!badge) return null;

  const progress = earned ? 1 : getProgress(badge, profile);
  const progressPct = progress !== null ? Math.round(progress * 100) : null;

  return (
    <Modal visible={!!badge} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />

      <View style={styles.sheet}>
        {/* Close button */}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="close" size={22} color="#888" />
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

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
          <Text style={styles.name}>{badge.name}</Text>

          {/* Category chip */}
          <View style={styles.categoryChip}>
            <Text style={styles.categoryText}>
              {CATEGORY_LABELS[badge.category] ?? badge.category}
            </Text>
          </View>

          {/* Description */}
          <Text style={styles.description}>{badge.description}</Text>

          {/* Criteria */}
          <View style={styles.criteriaRow}>
            <Ionicons name="trophy-outline" size={16} color="#2D5016" style={{ marginRight: 6 }} />
            <Text style={styles.criteriaText}>{criteriaText(badge.criteria_type, badge.criteria_value)}</Text>
          </View>

          {/* Earned status */}
          {earned ? (
            <View style={styles.earnedBanner}>
              <Ionicons name="checkmark-circle" size={18} color="#2D5016" style={{ marginRight: 6 }} />
              <Text style={styles.earnedText}>
                Earned{awardedAt ? ` on ${new Date(awardedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}
              </Text>
            </View>
          ) : (
            progressPct !== null && (
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Your progress</Text>
                  <Text style={styles.progressPct}>{progressPct}%</Text>
                </View>
                <View style={styles.progressWrap}>
                  <View style={[styles.progressBar, { width: `${progressPct}%` }]} />
                </View>
              </View>
            )
          )}

        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: 16,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 8,
    alignItems: 'center',
  },

  // Icon
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconEarned: { backgroundColor: '#e8f5e9' },
  iconLocked: { backgroundColor: '#f0f0f0', opacity: 0.6 },
  icon: { width: 52, height: 52, borderRadius: 26 },
  iconGrey: { tintColor: '#aaa' },
  iconEmoji: { fontSize: 44 },

  // Name
  name: { fontSize: 22, fontWeight: '800', color: '#1a1a1a', textAlign: 'center', marginBottom: 10 },

  // Category
  categoryChip: {
    backgroundColor: '#eef2ea',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 16,
  },
  categoryText: { fontSize: 12, fontWeight: '700', color: '#2D5016', textTransform: 'uppercase', letterSpacing: 0.6 },

  // Description
  description: {
    fontSize: 15,
    color: '#444',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },

  // Criteria
  criteriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f5f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
    alignSelf: 'stretch',
  },
  criteriaText: { fontSize: 14, color: '#555', flex: 1 },

  // Earned banner
  earnedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'stretch',
  },
  earnedText: { fontSize: 14, fontWeight: '600', color: '#2D5016' },

  // Progress
  progressSection: { alignSelf: 'stretch' },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 13, color: '#888' },
  progressPct: { fontSize: 13, fontWeight: '700', color: '#2D5016' },
  progressWrap: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: { height: 6, backgroundColor: '#2D5016', borderRadius: 3 },
});
