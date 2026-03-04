import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useShops } from '../../hooks/useShops';
import { useSubmitCheckIn } from '../../hooks/useCheckin';
import { useAuthStore } from '../../store/authStore';
import { ShopWithPhoto } from '../../lib/shops';
import { distanceKm, formatDistance, formatAddress, isOpenNow, OpeningHours } from '../../utils/shopUtils';
import BadgeCelebration from '../../components/checkin/BadgeCelebration';
import { CheckInResult } from '../../lib/checkins';

const CHECK_IN_RADIUS_M = 200;

type Step = 'idle' | 'confirming' | 'photo' | 'note' | 'submitting' | 'success';

interface UserLocation {
  latitude: number;
  longitude: number;
}

export default function CheckInScreen() {
  const { user } = useAuthStore();
  const { data: shops = [], isLoading: shopsLoading } = useShops();
  const mutation = useSubmitCheckIn();

  const [step, setStep] = useState<Step>('idle');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ShopWithPhoto | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [result, setResult] = useState<CheckInResult | null>(null);

  // Request location on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError(true);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    })();
  }, []);

  const getDistance = useCallback(
    (shop: ShopWithPhoto) =>
      userLocation
        ? distanceKm(userLocation.latitude, userLocation.longitude, shop.latitude, shop.longitude)
        : null,
    [userLocation],
  );

  const shopsWithDistance = useMemo(() => {
    const q = search.toLowerCase();
    return shops
      .filter(
        (s) =>
          !q ||
          s.name.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.postcode.toLowerCase().includes(q),
      )
      .map((s) => ({ ...s, distKm: getDistance(s) }))
      .sort((a, b) => (a.distKm ?? Infinity) - (b.distKm ?? Infinity));
  }, [shops, search, getDistance]);

  function selectShop(shop: ShopWithPhoto) {
    setSelected(shop);
    setStep('confirming');
  }

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to add a photo to your check-in.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow camera access to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  }

  async function submit() {
    if (!selected || !user || !userLocation) return;
    setStep('submitting');
    try {
      const checkinResult = await mutation.mutateAsync({
        userId: user.id,
        shopId: selected.id,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        photoUri,
        notes: note.trim() || undefined,
        isFeatured: selected.is_featured,
      });
      setResult(checkinResult);
      setStep('success');
    } catch (e: any) {
      setStep('note');
      Alert.alert('Check-in failed', e.message ?? 'Please try again.');
    }
  }

  function reset() {
    setStep('idle');
    setSelected(null);
    setPhotoUri(null);
    setNote('');
    setResult(null);
    setSearch('');
  }

  const selectedDistance = selected ? getDistance(selected) : null;
  const withinRange = selectedDistance !== null && selectedDistance * 1000 <= CHECK_IN_RADIUS_M;
  const shopIsOpen = selected
    ? isOpenNow(selected.opening_hours as unknown as OpeningHours)
    : true;

  // ── Success ────────────────────────────────────────────────
  if (step === 'success' && result && selected) {
    return (
      <BadgeCelebration
        pointsEarned={result.pointsEarned}
        newBadges={result.newBadges}
        shopName={selected.name}
        onDone={reset}
      />
    );
  }

  // ── Submitting ─────────────────────────────────────────────
  if (step === 'submitting') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2D5016" />
        <Text style={styles.submittingText}>Checking in…</Text>
      </View>
    );
  }

  // ── Confirming / Photo / Note ──────────────────────────────
  if (step !== 'idle' && selected) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.flowScroll} keyboardShouldPersistTaps="handled">

            {/* Back */}
            <TouchableOpacity onPress={reset} style={styles.backButton}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>

            {/* Shop card */}
            <View style={styles.shopCard}>
              <Text style={styles.shopCardName}>{selected.name}</Text>
              <Text style={styles.shopCardAddress}>{formatAddress(selected)}</Text>

              {/* Shop of the Week bonus banner */}
              {selected.is_featured && (
                <View style={styles.featuredBanner}>
                  <Text style={styles.featuredBannerText}>
                    ⭐ Shop of the Week — +10 bonus points!
                  </Text>
                </View>
              )}

              {/* GPS status */}
              <View style={[styles.statusRow, withinRange ? styles.statusGreen : styles.statusRed]}>
                <Text style={styles.statusIcon}>●</Text>
                <Text style={styles.statusText}>
                  {selectedDistance === null
                    ? 'Acquiring location…'
                    : withinRange
                    ? `You're here (${formatDistance(selectedDistance)} away)`
                    : `Too far away — ${formatDistance(selectedDistance)} (need ≤200m)`}
                </Text>
              </View>

              {/* Closed status */}
              {!shopIsOpen && (
                <View style={[styles.statusRow, styles.statusOrange]}>
                  <Text style={styles.statusIcon}>●</Text>
                  <Text style={styles.statusText}>This shop is currently closed</Text>
                </View>
              )}
            </View>

            {/* Photo section */}
            <Text style={styles.sectionLabel}>Photo <Text style={styles.optional}>(optional)</Text></Text>
            {photoUri ? (
              <View style={styles.photoPreviewWrap}>
                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                <TouchableOpacity style={styles.removePhoto} onPress={() => setPhotoUri(null)}>
                  <Text style={styles.removePhotoText}>✕ Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoButtons}>
                <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                  <Text style={styles.photoButtonText}>Take photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoButton} onPress={pickPhoto}>
                  <Text style={styles.photoButtonText}>Choose from library</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Note section */}
            <Text style={styles.sectionLabel}>Note <Text style={styles.optional}>(optional)</Text></Text>
            <TextInput
              style={styles.noteInput}
              placeholder="How was it? What did you order?"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              maxLength={280}
            />
            <Text style={styles.charCount}>{note.length}/280</Text>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitButton, (!withinRange || !shopIsOpen) && styles.submitButtonDisabled]}
              onPress={submit}
              disabled={!withinRange || !shopIsOpen}
            >
              <Text style={styles.submitText}>
                {!withinRange
                  ? 'Too far away to check in'
                  : !shopIsOpen
                  ? 'Shop is currently closed'
                  : 'Check in!'}
              </Text>
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Idle — shop picker ─────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.idleHeader}>
        <Text style={styles.idleTitle}>Check In</Text>
        <Text style={styles.idleSubtitle}>Select the shop you're visiting</Text>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search shops…"
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
      </View>

      {locationError && (
        <Text style={styles.locationError}>
          Location access denied — distance cannot be shown and check-in range cannot be verified.
        </Text>
      )}

      {shopsLoading ? (
        <ActivityIndicator style={styles.loader} color="#2D5016" />
      ) : (
        <FlatList
          data={shopsWithDistance}
          keyExtractor={(s) => s.id}
          renderItem={({ item }) => {
            const dist = item.distKm;
            const inRange = dist !== null && dist * 1000 <= CHECK_IN_RADIUS_M;
            const isOpen = isOpenNow(item.opening_hours as unknown as OpeningHours);
            return (
              <TouchableOpacity
                style={[styles.shopRow, item.is_featured && styles.shopRowFeatured]}
                onPress={() => selectShop(item)}
              >
                <View style={styles.shopRowInfo}>
                  <Text style={styles.shopRowName}>{item.name}</Text>
                  {item.is_featured && (
                    <Text style={styles.shopRowFeaturedLabel}>⭐ Shop of the Week</Text>
                  )}
                  <Text style={styles.shopRowCity}>{item.city} · {item.postcode}</Text>
                </View>
                <View style={styles.shopRowRight}>
                  {dist !== null && (
                    <Text style={[styles.shopRowDist, inRange && styles.shopRowDistGreen]}>
                      {formatDistance(dist)}
                    </Text>
                  )}
                  {inRange && <Text style={styles.nearbyBadge}>Nearby</Text>}
                  {!isOpen && <Text style={styles.closedBadge}>Closed</Text>}
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={<Text style={styles.emptyText}>No shops found.</Text>}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#f8f5f0' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  submittingText: { color: '#555', fontSize: 16 },

  // Idle
  idleHeader: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  idleTitle: { fontSize: 26, fontWeight: '800' },
  idleSubtitle: { fontSize: 14, color: '#888', marginTop: 2 },
  searchWrap: { paddingHorizontal: 16, paddingBottom: 8 },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  locationError: { fontSize: 13, color: '#c00', paddingHorizontal: 16, marginBottom: 8 },
  loader: { marginTop: 40 },
  listContent: { paddingBottom: 24 },
  shopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  shopRowFeatured: {
    backgroundColor: '#fffbf0',
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  shopRowFeaturedLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b45309',
    marginTop: 2,
    marginBottom: 1,
  },
  shopRowInfo: { flex: 1 },
  shopRowName: { fontSize: 15, fontWeight: '600' },
  shopRowCity: { fontSize: 13, color: '#888', marginTop: 2 },
  shopRowRight: { alignItems: 'flex-end', gap: 4 },
  shopRowDist: { fontSize: 13, color: '#888' },
  shopRowDistGreen: { color: '#2D5016', fontWeight: '600' },
  nearbyBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2D5016',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40 },

  // Flow
  flowScroll: { padding: 20, paddingBottom: 40 },
  backButton: { marginBottom: 16 },
  backText: { color: '#2D5016', fontSize: 15, fontWeight: '600' },
  shopCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  shopCardName: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  shopCardAddress: { fontSize: 13, color: '#888', marginBottom: 12 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 8, padding: 10, marginTop: 8 },
  statusGreen: { backgroundColor: '#e8f5e9' },
  statusRed: { backgroundColor: '#fce4e4' },
  statusOrange: { backgroundColor: '#fff3e0' },
  statusIcon: { fontSize: 10 },
  statusText: { fontSize: 13, fontWeight: '600', flex: 1 },

  featuredBanner: {
    backgroundColor: '#fff8e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 8,
  },
  featuredBannerText: { fontSize: 13, fontWeight: '600', color: '#b45309' },

  closedBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#888',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#444', marginBottom: 10 },
  optional: { fontWeight: '400', color: '#999' },

  photoButtons: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  photoButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  photoButtonText: { fontSize: 14, color: '#555' },
  photoPreviewWrap: { marginBottom: 24 },
  photoPreview: { width: '100%', height: 200, borderRadius: 10 },
  removePhoto: { marginTop: 8, alignSelf: 'flex-end' },
  removePhotoText: { fontSize: 13, color: '#c00' },

  noteInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 14,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 90,
    marginBottom: 4,
  },
  charCount: { fontSize: 11, color: '#bbb', textAlign: 'right', marginBottom: 24 },

  submitButton: {
    backgroundColor: '#2D5016',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  submitButtonDisabled: { backgroundColor: '#aaa' },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
