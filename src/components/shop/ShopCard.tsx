import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShopWithPhoto } from '../../lib/shops';
import { OpeningHours, isOpenNow, formatDistance, shopPhotoUrl } from '../../utils/shopUtils';

interface Props {
  shop: ShopWithPhoto;
  distanceKm?: number;
  visited?: boolean;
  onPress: () => void;
}

export default function ShopCard({ shop, distanceKm, visited, onPress }: Props) {
  const hours = shop.opening_hours as unknown as OpeningHours;
  const open = hours && Object.keys(hours).length > 0 ? isOpenNow(hours) : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View>
        {shop.primary_photo ? (
          <Image source={{ uri: shopPhotoUrl(shop.primary_photo) }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.imagePlaceholderText}>No photo</Text>
          </View>
        )}
        {visited && (
          <View style={styles.visitedBadge}>
            <Ionicons name="checkmark-circle" size={22} color="#2D5016" />
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{shop.name}</Text>

        <Text style={styles.city} numberOfLines={1}>{shop.city}  ·  {shop.postcode}</Text>

        <View style={styles.row}>
          {open === true && (
            <View style={styles.badgeOpen}>
              <Text style={styles.badgeText}>Open now</Text>
            </View>
          )}
          {distanceKm !== undefined && (
            <Text style={styles.distance}>{formatDistance(distanceKm)}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    overflow: 'hidden',
  },
  image: { width: 90, height: 90 },
  imagePlaceholder: { backgroundColor: '#f0ede8', alignItems: 'center', justifyContent: 'center' },
  visitedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#fff',
    borderRadius: 11,
  },
  imagePlaceholderText: { fontSize: 11, color: '#999' },
  info: { flex: 1, padding: 12, justifyContent: 'space-between' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 15, fontWeight: '600', flex: 1, marginRight: 8 },
  price: { fontSize: 13, color: '#666' },
  city: { fontSize: 13, color: '#888', marginTop: 2 },
  badge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginTop: 6 },
  badgeOpen: { backgroundColor: '#e8f5e9' },
  badgeClosed: { backgroundColor: '#fce4e4' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  distance: { fontSize: 12, color: '#888', marginTop: 6 },
});
