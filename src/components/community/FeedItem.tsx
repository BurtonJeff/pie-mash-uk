import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FeedItem as FeedItemType } from '../../lib/feed';
import { timeAgo } from '../../utils/dateUtils';

interface Props {
  item: FeedItemType;
  onEdit?: () => void;
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url) return <Image source={{ uri: url }} style={styles.avatar} />;
  return (
    <View style={[styles.avatar, styles.avatarPlaceholder]}>
      <Text style={styles.avatarText}>{name.slice(0, 2).toUpperCase()}</Text>
    </View>
  );
}

export default function FeedItemComponent({ item, onEdit }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Avatar name={item.displayName || item.username} url={item.avatarUrl} />
        <View style={styles.headerText}>
          <Text style={styles.name}>{item.displayName || item.username}</Text>
          <Text style={styles.time}>{timeAgo(item.checkedInAt)}</Text>
        </View>
        <View style={styles.pointsPill}>
          <Text style={styles.pointsText}>+{item.pointsEarned}</Text>
        </View>
        {onEdit && (
          <TouchableOpacity onPress={onEdit} style={styles.editBtn} hitSlop={8}>
            <Ionicons name="pencil-outline" size={16} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.action}>
        Checked in at <Text style={styles.shopName}>{item.shopName}</Text>
        {item.shopCity ? ` · ${item.shopCity}` : ''}
      </Text>

      {item.photoUrl ? (
        <Image source={{ uri: item.photoUrl }} style={styles.photo} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    padding: 14,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: { width: 38, height: 38, borderRadius: 19 },
  avatarPlaceholder: { backgroundColor: '#2D5016', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  headerText: { flex: 1, marginLeft: 10 },
  name: { fontSize: 14, fontWeight: '700' },
  time: { fontSize: 11, color: '#aaa', marginTop: 1 },
  pointsPill: { backgroundColor: '#e8f5e9', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  pointsText: { fontSize: 12, fontWeight: '700', color: '#2D5016' },
  editBtn: { marginLeft: 8, padding: 2 },
  action: { fontSize: 14, color: '#444', lineHeight: 20 },
  shopName: { fontWeight: '700', color: '#222' },
  photo: { width: '100%', height: 180, borderRadius: 8, marginTop: 10 },
});
