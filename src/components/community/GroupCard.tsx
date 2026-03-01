import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Group } from '../../lib/groups';

interface Props {
  group: Group;
  onPress: () => void;
}

export default function GroupCard({ group, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{group.name.slice(0, 1).toUpperCase()}</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>{group.name}</Text>
          {group.userRole === 'admin' && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminText}>Admin</Text>
            </View>
          )}
        </View>
        <Text style={styles.members}>{group.memberCount} member{group.memberCount !== 1 ? 's' : ''}</Text>
        {group.description ? (
          <Text style={styles.description} numberOfLines={1}>{group.description}</Text>
        ) : null}
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#2D5016',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  icon: { fontSize: 22, color: '#fff', fontWeight: '700' },
  info: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  name: { fontSize: 15, fontWeight: '700', flex: 1 },
  adminBadge: { backgroundColor: '#fff3e0', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  adminText: { fontSize: 10, fontWeight: '700', color: '#e65100' },
  members: { fontSize: 12, color: '#888' },
  description: { fontSize: 12, color: '#aaa', marginTop: 2 },
  chevron: { fontSize: 22, color: '#ccc', marginLeft: 8 },
});
