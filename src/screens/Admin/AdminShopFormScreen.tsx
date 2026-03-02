import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/AdminNavigator';
import {
  useAddShop,
  useUpdateShop,
  useAdminShopById,
  useShopPhotos,
  useUploadShopPhoto,
  useDeleteShopPhoto,
  useSetShopPhotoPrimary,
} from '../../hooks/useAdmin';
import { ShopFormData, ShopPhoto } from '../../lib/admin';
import { shopPhotoUrl } from '../../utils/shopUtils';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminShopForm'>;

export default function AdminShopFormScreen({ navigation, route }: Props) {
  const shopId = route.params?.shopId;
  const isEditing = !!shopId;

  const addShop = useAddShop();
  const updateShop = useUpdateShop();
  const { data: existingShop, isLoading: shopLoading } = useAdminShopById(shopId);
  const { data: photos = [] } = useShopPhotos(shopId);
  const uploadPhoto = useUploadShopPhoto();
  const deletePhoto = useDeleteShopPhoto();
  const setPrimary = useSetShopPhotoPrimary();

  const [form, setForm] = useState<ShopFormData>({
    name: '',
    description: '',
    address_line1: '',
    address_line2: '',
    city: '',
    postcode: '',
    phone: '',
    website: '',
    latitude: '',
    longitude: '',
    price_range: 1,
  });

  useLayoutEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Edit Shop' : 'Add Shop' });
  }, [navigation, isEditing]);

  useEffect(() => {
    if (existingShop) {
      setForm({
        name: existingShop.name,
        description: existingShop.description || '',
        address_line1: existingShop.address_line1,
        address_line2: existingShop.address_line2 || '',
        city: existingShop.city,
        postcode: existingShop.postcode,
        phone: existingShop.phone || '',
        website: existingShop.website || '',
        latitude: existingShop.latitude.toString(),
        longitude: existingShop.longitude.toString(),
        price_range: existingShop.price_range,
      });
    }
  }, [existingShop]);

  const set = (key: keyof ShopFormData, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validate = (): string | null => {
    if (!form.name.trim()) return 'Name is required.';
    if (!form.address_line1.trim()) return 'Address Line 1 is required.';
    if (!form.city.trim()) return 'City is required.';
    if (!form.postcode.trim()) return 'Postcode is required.';
    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) return 'Latitude must be a valid number between -90 and 90.';
    if (isNaN(lng) || lng < -180 || lng > 180) return 'Longitude must be a valid number between -180 and 180.';
    return null;
  };

  const handleSubmit = () => {
    const err = validate();
    if (err) {
      Alert.alert('Validation Error', err);
      return;
    }

    if (isEditing) {
      updateShop.mutate({ shopId, data: form }, {
        onSuccess: () => {
          Alert.alert('Success', `"${form.name}" has been updated.`, [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        },
        onError: (e: any) => {
          Alert.alert('Error', e.message ?? 'Could not update shop. Please try again.');
        },
      });
    } else {
      addShop.mutate(form, {
        onSuccess: () => {
          Alert.alert('Success', `"${form.name}" has been added.`, [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        },
        onError: (e: any) => {
          Alert.alert('Error', e.message ?? 'Could not add shop. Please try again.');
        },
      });
    }
  };

  const handleAddPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (result.canceled || !shopId) return;

    uploadPhoto.mutate(
      { shopId, uri: result.assets[0].uri, isFirst: photos.length === 0 },
      {
        onError: (e: any) => {
          Alert.alert('Upload failed', e.message ?? 'Could not upload photo. Please try again.');
        },
      },
    );
  };

  const handleDeletePhoto = (photo: ShopPhoto) => {
    Alert.alert('Delete Photo', 'Are you sure you want to delete this photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deletePhoto.mutate(
            { photoId: photo.id, storagePath: photo.storage_path, shopId: shopId! },
            {
              onError: (e: any) => {
                Alert.alert('Error', e.message ?? 'Could not delete photo.');
              },
            },
          );
        },
      },
    ]);
  };

  const handleSetPrimary = (photo: ShopPhoto) => {
    if (photo.is_primary || !shopId) return;
    setPrimary.mutate(
      { shopId, photoId: photo.id },
      {
        onError: (e: any) => {
          Alert.alert('Error', e.message ?? 'Could not set primary photo.');
        },
      },
    );
  };

  const isPending = addShop.isPending || updateShop.isPending;

  if (isEditing && shopLoading) {
    return <ActivityIndicator size="large" color="#2D5016" style={styles.loader} />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <FieldLabel label="Name" required />
      <TextInput
        style={styles.input}
        value={form.name}
        onChangeText={(v) => set('name', v)}
        placeholder="e.g. M. Manze"
        placeholderTextColor="#bbb"
      />

      <FieldLabel label="Description" />
      <TextInput
        style={[styles.input, styles.multiline]}
        value={form.description}
        onChangeText={(v) => set('description', v)}
        placeholder="A short description of the shop"
        placeholderTextColor="#bbb"
        multiline
        numberOfLines={3}
      />

      <FieldLabel label="Address Line 1" required />
      <TextInput
        style={styles.input}
        value={form.address_line1}
        onChangeText={(v) => set('address_line1', v)}
        placeholder="e.g. 87 Tower Bridge Road"
        placeholderTextColor="#bbb"
      />

      <FieldLabel label="Address Line 2" />
      <TextInput
        style={styles.input}
        value={form.address_line2}
        onChangeText={(v) => set('address_line2', v)}
        placeholder="Optional"
        placeholderTextColor="#bbb"
      />

      <FieldLabel label="City" required />
      <TextInput
        style={styles.input}
        value={form.city}
        onChangeText={(v) => set('city', v)}
        placeholder="e.g. London"
        placeholderTextColor="#bbb"
      />

      <FieldLabel label="Postcode" required />
      <TextInput
        style={styles.input}
        value={form.postcode}
        onChangeText={(v) => set('postcode', v)}
        placeholder="e.g. SE1 4TH"
        placeholderTextColor="#bbb"
        autoCapitalize="characters"
      />

      <FieldLabel label="Phone" />
      <TextInput
        style={styles.input}
        value={form.phone}
        onChangeText={(v) => set('phone', v)}
        placeholder="e.g. 020 7407 2985"
        placeholderTextColor="#bbb"
        keyboardType="phone-pad"
      />

      <FieldLabel label="Website" />
      <TextInput
        style={styles.input}
        value={form.website}
        onChangeText={(v) => set('website', v)}
        placeholder="e.g. https://mmanze.co.uk"
        placeholderTextColor="#bbb"
        keyboardType="url"
        autoCapitalize="none"
      />

      <FieldLabel label="Latitude" required />
      <TextInput
        style={styles.input}
        value={form.latitude}
        onChangeText={(v) => set('latitude', v)}
        placeholder="e.g. 51.4994"
        placeholderTextColor="#bbb"
        keyboardType="numeric"
      />

      <FieldLabel label="Longitude" required />
      <TextInput
        style={styles.input}
        value={form.longitude}
        onChangeText={(v) => set('longitude', v)}
        placeholder="e.g. -0.0789"
        placeholderTextColor="#bbb"
        keyboardType="numeric"
      />

      {/* Photos — only available when editing an existing shop */}
      {isEditing && (
        <>
          <FieldLabel label="Photos" />
          <View style={styles.photoRow}>
            {photos.map((photo) => (
              <View key={photo.id} style={styles.photoTile}>
                <Image
                  source={{ uri: shopPhotoUrl(photo.storage_path) }}
                  style={styles.photoThumb}
                />

                {/* Primary star */}
                <TouchableOpacity
                  style={styles.photoStar}
                  onPress={() => handleSetPrimary(photo)}
                  disabled={setPrimary.isPending}
                >
                  <Ionicons
                    name={photo.is_primary ? 'star' : 'star-outline'}
                    size={15}
                    color={photo.is_primary ? '#f5a623' : '#fff'}
                  />
                </TouchableOpacity>

                {/* Delete button */}
                <TouchableOpacity
                  style={styles.photoDelete}
                  onPress={() => handleDeletePhoto(photo)}
                  disabled={deletePhoto.isPending}
                >
                  <Ionicons name="close-circle" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}

            {/* Add photo tile */}
            <TouchableOpacity
              style={styles.photoAddTile}
              onPress={handleAddPhoto}
              disabled={uploadPhoto.isPending}
            >
              {uploadPhoto.isPending ? (
                <ActivityIndicator color="#2D5016" />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={26} color="#2D5016" />
                  <Text style={styles.photoAddText}>Add</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {photos.length === 0 && !uploadPhoto.isPending && (
            <Text style={styles.noPhotosText}>
              No photos yet. Tap "Add" to upload one. The first photo will become the primary.
            </Text>
          )}
          {photos.length > 0 && (
            <Text style={styles.photoHint}>
              Tap ★ to set as primary (shown in listings). Tap ✕ to delete.
            </Text>
          )}
        </>
      )}

      {!isEditing && (
        <View style={styles.photoNote}>
          <Text style={styles.photoNoteText}>
            Photos can be added after saving the shop.
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.submitButton, isPending && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isPending}
      >
        {isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>
            {isEditing ? 'Save Changes' : 'Add Shop'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Text style={styles.label}>
      {label}
      {required && <Text style={styles.required}> *</Text>}
    </Text>
  );
}

const TILE_SIZE = 90;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0ede8' },
  content: { paddingHorizontal: 20, paddingBottom: 48, paddingTop: 16 },
  loader: { flex: 1, marginTop: 80 },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
    marginTop: 14,
    marginLeft: 2,
  },
  required: { color: '#c00' },

  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0ddd8',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#1a1a1a',
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // ── Photos ────────────────────────────────────────────────
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  photoThumb: {
    width: TILE_SIZE,
    height: TILE_SIZE,
  },
  photoStar: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 10,
    padding: 3,
  },
  photoDelete: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  photoAddTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2D5016',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoAddText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2D5016',
  },
  noPhotosText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    lineHeight: 18,
  },
  photoHint: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 6,
  },
  photoNote: {
    backgroundColor: '#eef4e8',
    borderRadius: 10,
    padding: 12,
    marginTop: 20,
  },
  photoNoteText: {
    fontSize: 13,
    color: '#4a7a2a',
  },

  submitButton: {
    backgroundColor: '#2D5016',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
