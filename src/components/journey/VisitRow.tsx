import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { shopPhotoUrl } from '../../utils/shopUtils';

interface Props {
  shopName: string;
  checkedInAt: string;
  photoUrl?: string | null;
  photoUrls?: string[];
  shopPrimaryPhoto?: string | null;
  pointsEarned: number;
  onEdit?: () => void;
}

export default function VisitRow({ shopName, checkedInAt, photoUrl, photoUrls, shopPrimaryPhoto, pointsEarned, onEdit }: Props) {
  const date = new Date(checkedInAt);
  const dateStr = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const firstPhoto = (photoUrls && photoUrls.length > 0) ? photoUrls[0] : photoUrl;
  const extraCount = photoUrls && photoUrls.length > 1 ? photoUrls.length - 1 : 0;
  const fallbackUri = shopPrimaryPhoto ? shopPhotoUrl(shopPrimaryPhoto) : null;

  return (
    <View style={styles.row}>
      {firstPhoto ? (
        <View style={styles.photoWrap}>
          <Image source={{ uri: firstPhoto }} style={styles.photo} />
          {extraCount > 0 && (
            <View style={styles.extraBadge}>
              <Text style={styles.extraBadgeText}>+{extraCount}</Text>
            </View>
          )}
        </View>
      ) : fallbackUri ? (
        <Image source={{ uri: fallbackUri }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Text style={styles.photoPlaceholderText}>🥧</Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.shopName} numberOfLines={1}>{shopName}</Text>
        <Text style={styles.datetime}>{dateStr} · {timeStr}</Text>
      </View>

      <View style={styles.points}>
        <Text style={styles.pointsValue}>+{pointsEarned}</Text>
        <Text style={styles.pointsLabel}>pts</Text>
      </View>
      {onEdit && (
        <TouchableOpacity style={styles.editButton} onPress={onEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="pencil-outline" size={16} color="#aaa" />
        </TouchableOpacity>
      )}
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
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  photoWrap: { position: 'relative' },
  photo: { width: 60, height: 60 },
  photoPlaceholder: { backgroundColor: '#f0ede8', alignItems: 'center', justifyContent: 'center' },
  photoPlaceholderText: { fontSize: 22 },
  extraBadge: {
    position: 'absolute', bottom: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 6,
    paddingHorizontal: 4, paddingVertical: 1,
  },
  extraBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  info: { flex: 1, paddingHorizontal: 12 },
  shopName: { fontSize: 14, fontWeight: '600' },
  datetime: { fontSize: 12, color: '#888', marginTop: 2 },
  points: { paddingRight: 8, alignItems: 'center' },
  editButton: { paddingRight: 14, paddingLeft: 4 },
  pointsValue: { fontSize: 16, fontWeight: '800', color: '#2D5016' },
  pointsLabel: { fontSize: 10, color: '#888' },
});
