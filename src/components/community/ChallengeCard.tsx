import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Challenge } from '../../lib/challenges';
import { daysRemaining } from '../../utils/dateUtils';

interface Props {
  challenge: Challenge;
}

export default function ChallengeCard({ challenge }: Props) {
  const days = daysRemaining(challenge.endDate);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={[styles.scopeBadge, challenge.scope === 'group' && styles.scopeGroup]}>
          <Text style={styles.scopeText}>{challenge.scope === 'global' ? 'Global' : 'Group'}</Text>
        </View>
        <Text style={styles.reward}>+{challenge.pointsReward} pts</Text>
      </View>

      <Text style={styles.title}>{challenge.title}</Text>
      <Text style={styles.description} numberOfLines={2}>{challenge.description}</Text>

      <View style={styles.footer}>
        <Text style={[styles.timer, days <= 2 && styles.timerUrgent]}>
          {days === 0 ? 'Ends today' : `${days} day${days !== 1 ? 's' : ''} left`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  scopeBadge: { backgroundColor: '#e8f5e9', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  scopeGroup: { backgroundColor: '#e8eaf6' },
  scopeText: { fontSize: 11, fontWeight: '700', color: '#555' },
  reward: { fontSize: 14, fontWeight: '800', color: '#2D5016' },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  description: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 10 },
  footer: { flexDirection: 'row', justifyContent: 'flex-end' },
  timer: { fontSize: 12, color: '#888', fontWeight: '600' },
  timerUrgent: { color: '#e53935' },
});
