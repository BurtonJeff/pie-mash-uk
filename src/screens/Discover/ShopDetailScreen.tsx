import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DiscoverStackParamList } from '../../navigation/DiscoverNavigator';
import { useShop } from '../../hooks/useShops';
import {
  OpeningHours,
  isOpenNow,
  formatAddress,
  formatHours,
  priceLabel,
  openDirections,
  shopPhotoUrl,
} from '../../utils/shopUtils';

type Props = NativeStackScreenProps<DiscoverStackParamList, 'ShopDetail'>;
type Tab = 'details' | 'hours' | 'history';

const DAY_LABELS: { key: keyof OpeningHours; label: string }[] = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

const { width } = Dimensions.get('window');

export default function ShopDetailScreen({ route, navigation }: Props) {
  const { shopId } = route.params;
  const { data: shop, isLoading, error } = useShop(shopId);
  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [photoIndex, setPhotoIndex] = useState(0);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2D5016" />
      </View>
    );
  }

  if (error || !shop) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Shop not found.</Text>
      </View>
    );
  }

  const hours = shop.opening_hours as unknown as OpeningHours;
  const hasHours = hours && Object.keys(hours).length > 0;
  const open = hasHours ? isOpenNow(hours) : null;
  const photos = shop.photos ?? [];

  React.useLayoutEffect(() => {
    navigation.setOptions({ title: shop.name });
  }, [navigation, shop.name]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Hero photo */}
        {photos.length > 0 ? (
          <View>
            <Image source={{ uri: shopPhotoUrl(photos[photoIndex]) }} style={styles.hero} />
            {photos.length > 1 && (
              <View style={styles.photoDots}>
                {photos.map((_, i) => (
                  <TouchableOpacity key={i} onPress={() => setPhotoIndex(i)}>
                    <View style={[styles.dot, i === photoIndex && styles.dotActive]} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.hero, styles.heroPlaceholder]}>
            <Text style={styles.heroPlaceholderText}>No photos yet</Text>
          </View>
        )}

        {/* Name & meta */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.name}>{shop.name}</Text>
            <Text style={styles.price}>{priceLabel(shop.price_range)}</Text>
          </View>
          <Text style={styles.city}>{shop.city} · {shop.postcode}</Text>
          <View style={styles.badges}>
            {open !== null && (
              <View style={[styles.badge, open ? styles.badgeOpen : styles.badgeClosed]}>
                <Text style={styles.badgeText}>{open ? 'Open now' : 'Closed'}</Text>
              </View>
            )}
            {shop.founded_year && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Est. {shop.founded_year}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Directions button */}
        <TouchableOpacity style={styles.directionsButton} onPress={() => openDirections(shop)}>
          <Text style={styles.directionsText}>Get Directions</Text>
        </TouchableOpacity>

        {/* Tab switcher */}
        <View style={styles.tabs}>
          {(['details', 'hours', 'history'] as Tab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        <View style={styles.tabContent}>
          {activeTab === 'details' && (
            <View>
              <InfoRow label="Address" value={formatAddress(shop)} />
              {shop.phone && (
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${shop.phone}`)}>
                  <InfoRow label="Phone" value={shop.phone!} link />
                </TouchableOpacity>
              )}
              {shop.website && (
                <TouchableOpacity onPress={() => Linking.openURL(shop.website!)}>
                  <InfoRow label="Website" value={shop.website!} link />
                </TouchableOpacity>
              )}

              {/* Features */}
              {shop.features && Object.keys(shop.features).length > 0 && (
                <View style={styles.features}>
                  {Object.entries(shop.features as Record<string, boolean>)
                    .filter(([, v]) => v)
                    .map(([key]) => (
                      <View key={key} style={styles.featureChip}>
                        <Text style={styles.featureText}>
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </Text>
                      </View>
                    ))}
                </View>
              )}

              {shop.description ? (
                <Text style={styles.description}>{shop.description}</Text>
              ) : null}
            </View>
          )}

          {activeTab === 'hours' && (
            <View>
              {hasHours ? (
                DAY_LABELS.map(({ key, label }) => (
                  <View key={key} style={styles.hoursRow}>
                    <Text style={styles.hoursDay}>{label}</Text>
                    <Text style={styles.hoursTime}>{formatHours(hours[key])}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyTabText}>Opening hours not yet available.</Text>
              )}
            </View>
          )}

          {activeTab === 'history' && (
            <View>
              {shop.founded_year && (
                <Text style={styles.founded}>Founded in {shop.founded_year}</Text>
              )}
              {shop.description ? (
                <Text style={styles.description}>{shop.description}</Text>
              ) : (
                <Text style={styles.emptyTabText}>No history information yet.</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, link }: { label: string; value: string; link?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, link && styles.infoLink]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#c00', fontSize: 16 },
  scrollContent: { paddingBottom: 40 },

  hero: { width, height: 240, backgroundColor: '#f0ede8' },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  heroPlaceholderText: { color: '#bbb', fontSize: 14 },
  photoDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: -20, paddingBottom: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#fff' },

  header: { padding: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  name: { fontSize: 22, fontWeight: '700', flex: 1, marginRight: 8 },
  price: { fontSize: 16, color: '#666', marginTop: 4 },
  city: { fontSize: 14, color: '#888', marginTop: 4 },
  badges: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  badge: { borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#f0ede8' },
  badgeOpen: { backgroundColor: '#e8f5e9' },
  badgeClosed: { backgroundColor: '#fce4e4' },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#444' },

  directionsButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#2D5016',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  directionsText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  tabs: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#eee' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#2D5016' },
  tabText: { fontSize: 14, color: '#999' },
  tabTextActive: { color: '#2D5016', fontWeight: '700' },

  tabContent: { padding: 16 },
  infoRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  infoLabel: { width: 80, fontSize: 13, color: '#888', paddingTop: 1 },
  infoValue: { flex: 1, fontSize: 14, color: '#222' },
  infoLink: { color: '#2D5016', textDecorationLine: 'underline' },

  features: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  featureChip: { backgroundColor: '#f0ede8', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 },
  featureText: { fontSize: 13, color: '#555' },

  description: { fontSize: 14, color: '#444', lineHeight: 22, marginTop: 16 },
  founded: { fontSize: 15, fontWeight: '600', marginBottom: 8 },

  hoursRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  hoursDay: { fontSize: 14, color: '#555', width: 100 },
  hoursTime: { fontSize: 14, color: '#222' },

  emptyTabText: { color: '#999', fontSize: 14, marginTop: 8 },
});
