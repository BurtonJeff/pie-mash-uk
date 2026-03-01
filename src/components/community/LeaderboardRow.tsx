import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LeaderboardEntry } from '../../lib/leaderboard';

interface Props {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
}

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url) return <Image source={{ uri: url }} style={styles.avatar} />;
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <View style={[styles.avatar, styles.avatarPlaceholder]}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

export default function LeaderboardRow({ entry, isCurrentUser }: Props) {
  return (
    <View style={[styles.row, isCurrentUser && styles.rowHighlight]}>
      <Text style={styles.rank}>{MEDAL[entry.rank] ?? entry.rank}</Text>
      <Avatar name={entry.displayName || entry.username} url={entry.avatarUrl} />
      <View style={styles.nameBlock}>
        <Text style={styles.displayName} numberOfLines={1}>
          {entry.displayName || entry.username}
          {isCurrentUser ? '  (you)' : ''}
        </Text>
        <Text style={styles.meta}>{entry.uniqueShops} shops visited</Text>
      </View>
      <Text style={styles.points}>{entry.points.toLocaleString()} pts</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  rowHighlight: { borderWidth: 2, borderColor: '#2D5016' },
  rank: { width: 32, fontSize: 18, textAlign: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, marginHorizontal: 10 },
  avatarPlaceholder: { backgroundColor: '#2D5016', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  nameBlock: { flex: 1 },
  displayName: { fontSize: 14, fontWeight: '600' },
  meta: { fontSize: 11, color: '#888', marginTop: 1 },
  points: { fontSize: 14, fontWeight: '700', color: '#2D5016' },
});
