import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useShops } from '../../hooks/useShops';
import ShopCard from '../../components/shop/ShopCard';
import { distanceKm, isOpenNow, OpeningHours } from '../../utils/shopUtils';
import { ShopWithPhoto } from '../../lib/shops';
import { DiscoverStackParamList } from '../../navigation/DiscoverNavigator';

type Props = NativeStackScreenProps<DiscoverStackParamList, 'DiscoverHome'>;

type ViewMode = 'list' | 'map';

interface Filters {
  openNow: boolean;
  takeaway: boolean;
  seating: boolean;
  parking: boolean;
}

const DEFAULT_REGION = {
  latitude: 51.505,
  longitude: -0.09,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};

export default function DiscoverScreen({ navigation }: Props) {
  const { data: shops = [], isLoading, error } = useShops();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Filters>({ openNow: false, takeaway: false, seating: false, parking: false });
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const requestLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
  }, []);

  const filtered = useMemo(() => {
    let result = shops;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.postcode.toLowerCase().includes(q),
      );
    }

    if (filters.openNow) {
      result = result.filter((s) => {
        const hours = s.opening_hours as unknown as OpeningHours;
        return hours && Object.keys(hours).length > 0 && isOpenNow(hours);
      });
    }
    if (filters.takeaway) result = result.filter((s) => (s.features as any)?.takeaway);
    if (filters.seating) result = result.filter((s) => (s.features as any)?.seating);
    if (filters.parking) result = result.filter((s) => (s.features as any)?.parking);

    if (userLocation) {
      return [...result].sort(
        (a, b) =>
          distanceKm(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude) -
          distanceKm(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude),
      );
    }

    return result;
  }, [shops, search, filters, userLocation]);

  function toggleFilter(key: keyof Filters) {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function getDistance(shop: ShopWithPhoto) {
    if (!userLocation) return undefined;
    return distanceKm(userLocation.latitude, userLocation.longitude, shop.latitude, shop.longitude);
  }

  const mapRegion = userLocation
    ? { ...userLocation, latitudeDelta: 0.3, longitudeDelta: 0.3 }
    : DEFAULT_REGION;

  return (
    <SafeAreaView style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search shops, town, postcode…"
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.locationButton} onPress={requestLocation}>
          <Text style={styles.locationButtonText}>Near me</Text>
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        {(Object.keys(filters) as (keyof Filters)[]).map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.chip, filters[key] && styles.chipActive]}
            onPress={() => toggleFilter(key)}
          >
            <Text style={[styles.chipText, filters[key] && styles.chipTextActive]}>
              {key === 'openNow' ? 'Open now' : key.charAt(0).toUpperCase() + key.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* View mode toggle */}
      <View style={styles.toggleRow}>
        <Text style={styles.resultCount}>{filtered.length} shop{filtered.length !== 1 ? 's' : ''}</Text>
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
            onPress={() => setViewMode('list')}
          >
            <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>List</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'map' && styles.toggleButtonActive]}
            onPress={() => setViewMode('map')}
          >
            <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>Map</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#2D5016" />
      ) : error ? (
        <Text style={styles.errorText}>Failed to load shops. Check your connection.</Text>
      ) : viewMode === 'list' ? (
        <FlatList
          data={filtered}
          keyExtractor={(s) => s.id}
          renderItem={({ item }) => (
            <ShopCard
              shop={item}
              distanceKm={getDistance(item)}
              onPress={() => navigation.navigate('ShopDetail', { shopId: item.id })}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No shops match your search.</Text>}
        />
      ) : (
        <MapView style={styles.map} region={mapRegion} showsUserLocation>
          {filtered.map((shop) => (
            <Marker
              key={shop.id}
              coordinate={{ latitude: shop.latitude, longitude: shop.longitude }}
              title={shop.name}
            >
              <Callout onPress={() => navigation.navigate('ShopDetail', { shopId: shop.id })}>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{shop.name}</Text>
                  <Text style={styles.calloutCity}>{shop.city}</Text>
                  <Text style={styles.calloutLink}>View details →</Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f5f0' },
  searchRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 8 },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  locationButton: {
    backgroundColor: '#2D5016',
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  locationButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  filterRow: { maxHeight: 44 },
  filterContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  chipActive: { backgroundColor: '#2D5016', borderColor: '#2D5016' },
  chipText: { fontSize: 13, color: '#555' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  resultCount: { fontSize: 13, color: '#888' },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#e8e0d8',
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: { paddingHorizontal: 16, paddingVertical: 5, borderRadius: 6 },
  toggleButtonActive: { backgroundColor: '#fff' },
  toggleText: { fontSize: 13, color: '#888' },
  toggleTextActive: { fontWeight: '600', color: '#222' },
  loader: { flex: 1 },
  errorText: { textAlign: 'center', marginTop: 40, color: '#c00', paddingHorizontal: 32 },
  listContent: { paddingTop: 4, paddingBottom: 24 },
  emptyText: { textAlign: 'center', marginTop: 60, color: '#999', fontSize: 15 },
  map: { flex: 1 },
  callout: { width: 180, padding: 4 },
  calloutTitle: { fontWeight: '700', fontSize: 14 },
  calloutCity: { color: '#666', fontSize: 12, marginTop: 2 },
  calloutLink: { color: '#2D5016', fontSize: 12, marginTop: 6, fontWeight: '600' },
});
