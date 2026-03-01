import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { ShopWithPhoto } from '../../lib/shops';
import { shopPhotoUrl, priceLabel, isOpenNow, OpeningHours } from '../../utils/shopUtils';

interface Props {
  shop: ShopWithPhoto;
  onPress: () => void;
}

export default function FeaturedShopCard({ shop, onPress }: Props) {
  const photoUrl = shop.primary_photo ? shopPhotoUrl(shop.primary_photo) : null;
  const open = isOpenNow(shop.opening_hours as unknown as OpeningHours);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={styles.placeholderEmoji}>🥧</Text>
        </View>
      )}
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>{shop.name}</Text>
          <View style={[styles.badge, open ? styles.badgeOpen : styles.badgeClosed]}>
            <Text style={styles.badgeText}>{open ? 'Open' : 'Closed'}</Text>
          </View>
        </View>
        <Text style={styles.meta}>{shop.city} · {priceLabel(shop.price_range)}</Text>
        {!!shop.description && (
          <Text style={styles.description} numberOfLines={2}>{shop.description}</Text>
        )}
        <Text style={styles.cta}>View details →</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  image: { width: '100%', height: 180 },
  imagePlaceholder: {
    backgroundColor: '#e8f0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: { fontSize: 56 },
  body: { padding: 16 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  name: { fontSize: 18, fontWeight: '800', color: '#1a1a1a', flex: 1, marginRight: 8 },
  badge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  badgeOpen: { backgroundColor: '#d4edda' },
  badgeClosed: { backgroundColor: '#f5c6cb' },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#1a1a1a' },
  meta: { fontSize: 13, color: '#666', marginBottom: 8 },
  description: { fontSize: 14, color: '#444', lineHeight: 20, marginBottom: 10 },
  cta: { fontSize: 13, color: '#2D5016', fontWeight: '700' },
});
