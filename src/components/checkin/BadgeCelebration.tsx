import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Badge } from '../../types/database';

interface Props {
  pointsEarned: number;
  newBadges: Badge[];
  shopName: string;
  onDone: () => void;
}

export default function BadgeCelebration({ pointsEarned, newBadges, shopName, onDone }: Props) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, bounciness: 14 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.Text style={[styles.tick, { transform: [{ scale: scaleAnim }] }]}>✓</Animated.Text>

        <Text style={styles.title}>Checked in!</Text>
        <Text style={styles.shopName}>{shopName}</Text>

        <View style={styles.pointsPill}>
          <Text style={styles.pointsText}>+{pointsEarned} points</Text>
        </View>

        {newBadges.length > 0 && (
          <View style={styles.badgesSection}>
            <Text style={styles.badgesHeading}>
              {newBadges.length === 1 ? 'New badge unlocked!' : `${newBadges.length} new badges unlocked!`}
            </Text>
            {newBadges.map((badge) => (
              <View key={badge.id} style={styles.badgeRow}>
                {badge.icon_url ? (
                  <Image source={{ uri: badge.icon_url }} style={styles.badgeIcon} />
                ) : (
                  <View style={styles.badgeIconPlaceholder}>
                    <Text style={styles.badgeIconEmoji}>🏅</Text>
                  </View>
                )}
                <View style={styles.badgeInfo}>
                  <Text style={styles.badgeName}>{badge.name}</Text>
                  <Text style={styles.badgeDesc}>{badge.description}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.doneButton} onPress={onDone}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#2D5016',
    zIndex: 100,
    justifyContent: 'center',
  },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  tick: { fontSize: 72, color: '#fff', marginBottom: 16 },
  title: { fontSize: 32, fontWeight: '800', color: '#fff', marginBottom: 4 },
  shopName: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 24, textAlign: 'center' },
  pointsPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginBottom: 32,
  },
  pointsText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  badgesSection: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
    gap: 12,
  },
  badgesHeading: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 4 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badgeIcon: { width: 48, height: 48, borderRadius: 24 },
  badgeIconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIconEmoji: { fontSize: 24 },
  badgeInfo: { flex: 1 },
  badgeName: { fontSize: 15, fontWeight: '700', color: '#fff' },
  badgeDesc: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  doneButton: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 48,
  },
  doneText: { color: '#2D5016', fontWeight: '800', fontSize: 16 },
});
