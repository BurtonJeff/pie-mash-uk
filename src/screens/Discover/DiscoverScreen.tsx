import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useShops } from '../../hooks/useShops';
import ShopCard from '../../components/shop/ShopCard';
import { distanceKm } from '../../utils/shopUtils';
import { ShopWithPhoto } from '../../lib/shops';
import { DiscoverStackParamList } from '../../navigation/DiscoverNavigator';

type Props = NativeStackScreenProps<DiscoverStackParamList, 'DiscoverHome'>;

type ViewMode = 'list' | 'map';
type SortMode = 'nearest' | 'az' | 'za';

const DEFAULT_REGION = {
  latitude: 51.505,
  longitude: -0.09,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};

export default function DiscoverScreen({ navigation }: Props) {
  const { data: shops = [], isLoading, error } = useShops();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortMode, setSortMode] = useState<SortMode>('nearest');
  const [search, setSearch] = useState('');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const requestLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
  }, []);

  useEffect(() => { requestLocation(); }, [requestLocation]);

  async function handleSortNearest() {
    setSortMode('nearest');
    if (!userLocation) await requestLocation();
  }

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

    if (sortMode === 'nearest' && userLocation) {
      return [...result].sort(
        (a, b) =>
          distanceKm(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude) -
          distanceKm(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude),
      );
    }
    if (sortMode === 'az') {
      return [...result].sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sortMode === 'za') {
      return [...result].sort((a, b) => b.name.localeCompare(a.name));
    }

    return result;
  }, [shops, search, userLocation, sortMode]);

  function getDistance(shop: ShopWithPhoto) {
    if (!userLocation) return undefined;
    return distanceKm(userLocation.latitude, userLocation.longitude, shop.latitude, shop.longitude);
  }

  const mapRegion = userLocation
    ? { ...userLocation, latitudeDelta: 0.3, longitudeDelta: 0.3 }
    : DEFAULT_REGION;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
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
      </View>

      {/* Sort chips + List/Map toggle */}
      <View style={styles.sortRow}>
        <TouchableOpacity
          style={[styles.sortChip, sortMode === 'nearest' && styles.sortChipActive]}
          onPress={handleSortNearest}
        >
          <Text style={[styles.sortChipText, sortMode === 'nearest' && styles.sortChipTextActive]}>
            Nearest
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortChip, sortMode === 'az' && styles.sortChipActive]}
          onPress={() => setSortMode('az')}
        >
          <Text style={[styles.sortChipText, sortMode === 'az' && styles.sortChipTextActive]}>
            A – Z
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortChip, sortMode === 'za' && styles.sortChipActive]}
          onPress={() => setSortMode('za')}
        >
          <Text style={[styles.sortChipText, sortMode === 'za' && styles.sortChipTextActive]}>
            Z – A
          </Text>
        </TouchableOpacity>

        <View style={styles.toggleSpacer} />

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
  searchRow: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  toggleSpacer: { flex: 1 },
  sortChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#e8e0d8',
  },
  sortChipActive: {
    backgroundColor: '#2D5016',
  },
  sortChipText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  sortChipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
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
