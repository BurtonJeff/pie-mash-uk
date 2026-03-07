import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Image, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { JourneyStackParamList } from '../../navigation/JourneyNavigator';
import { useAuthStore } from '../../store/authStore';
import { useUpdateCheckIn } from '../../hooks/useCheckin';

type Props = NativeStackScreenProps<JourneyStackParamList, 'EditCheckIn'>;

const MAX_PHOTOS = 5;

export default function EditCheckInScreen({ navigation, route }: Props) {
  const { checkInId, shopName, initialPhotoUrls, initialNotes } = route.params;
  const { user } = useAuthStore();
  const mutation = useUpdateCheckIn(user?.id ?? '');

  // Existing remote URLs (user can remove these)
  const [existingPhotoUrls, setExistingPhotoUrls] = useState<string[]>(initialPhotoUrls);
  // Newly picked local URIs (to upload on save)
  const [newPhotoUris, setNewPhotoUris] = useState<string[]>([]);
  const [notes, setNotes] = useState(initialNotes ?? '');

  const totalPhotos = existingPhotoUrls.length + newPhotoUris.length;
  const canAddMore = totalPhotos < MAX_PHOTOS;

  const hasUnsavedChanges =
    notes !== (initialNotes ?? '') ||
    newPhotoUris.length > 0 ||
    existingPhotoUrls.length !== initialPhotoUrls.length;

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to add photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) {
      setNewPhotoUris((prev) => [...prev, result.assets[0].uri]);
    }
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
    if (!result.canceled) {
      setNewPhotoUris((prev) => [...prev, result.assets[0].uri]);
    }
  }

  function removeExisting(url: string) {
    setExistingPhotoUrls((prev) => prev.filter((u) => u !== url));
  }

  function removeNew(uri: string) {
    setNewPhotoUris((prev) => prev.filter((u) => u !== uri));
  }

  async function doShare() {
    const parts: string[] = [];
    if (notes.trim()) parts.push(notes.trim());
    parts.push(`Just visited ${shopName} for some pie & mash!`);
    parts.push('#PieAndMashUK');
    const message = parts.join('\n\n');
    const firstPhoto = existingPhotoUrls[0] ?? null;
    try {
      const shareOptions: Parameters<typeof Share.share>[0] = { message };
      if (firstPhoto) shareOptions.url = firstPhoto;
      await Share.share(shareOptions);
    } catch {
      // user cancelled or share not supported — no action needed
    }
  }

  function handleShare() {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Unsaved changes',
        'You have unsaved changes. Save before sharing?',
        [
          { text: 'Share anyway', onPress: doShare },
          { text: 'Save first', style: 'default', onPress: () => save(doShare) },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
    } else {
      doShare();
    }
  }

  function save(onSuccess?: () => void) {
    if (!user) return;
    mutation.mutate(
      { checkInId, userId: user.id, newPhotoUris, existingPhotoUrls, notes },
      {
        onSuccess: onSuccess ?? (() => navigation.goBack()),
        onError: (e: any) => Alert.alert('Error', e.message ?? 'Could not save changes.'),
      },
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          <Text style={styles.shopName}>{shopName}</Text>

          <Text style={styles.sectionLabel}>
            Photos <Text style={styles.optional}>(optional · up to {MAX_PHOTOS})</Text>
          </Text>

          {/* Photo grid */}
          {totalPhotos > 0 && (
            <View style={styles.photoGrid}>
              {existingPhotoUrls.map((url) => (
                <View key={url} style={styles.photoThumbWrap}>
                  <Image source={{ uri: url }} style={styles.photoThumb} />
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removeExisting(url)}>
                    <Ionicons name="close-circle" size={22} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              {newPhotoUris.map((uri) => (
                <View key={uri} style={styles.photoThumbWrap}>
                  <Image source={{ uri }} style={styles.photoThumb} />
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removeNew(uri)}>
                    <Ionicons name="close-circle" size={22} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Add photo buttons */}
          {canAddMore && (
            <View style={styles.photoButtons}>
              <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                <Text style={styles.photoButtonText}>Take photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoButton} onPress={pickPhoto}>
                <Text style={styles.photoButtonText}>Choose from library</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.sectionLabel}>Note <Text style={styles.optional}>(optional)</Text></Text>
          <TextInput
            style={styles.noteInput}
            placeholder="How was it? What did you order?"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            maxLength={280}
          />
          <Text style={styles.charCount}>{notes.length}/280</Text>

          <TouchableOpacity
            style={[styles.saveButton, mutation.isPending && styles.saveButtonDisabled]}
            onPress={() => save()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            disabled={mutation.isPending}
          >
            <Text style={styles.shareButtonText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.discardButton}
            onPress={() => navigation.goBack()}
            disabled={mutation.isPending}
          >
            <Text style={styles.discardButtonText}>Discard</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8f5f0' },
  flex: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },

  shopName: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 24 },

  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#444', marginBottom: 10 },
  optional: { fontWeight: '400', color: '#999' },

  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  photoThumbWrap: { position: 'relative' },
  photoThumb: { width: 100, height: 100, borderRadius: 8 },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 11,
  },

  photoButtons: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  photoButton: {
    flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderStyle: 'dashed',
  },
  photoButtonText: { fontSize: 14, color: '#555' },

  noteInput: {
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1,
    borderColor: '#e0e0e0', padding: 14, fontSize: 14,
    textAlignVertical: 'top', minHeight: 90, marginBottom: 4,
  },
  charCount: { fontSize: 11, color: '#bbb', textAlign: 'right', marginBottom: 24 },

  saveButton: {
    backgroundColor: '#2D5016', borderRadius: 14, padding: 18, alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  shareButton: {
    borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 12,
    borderWidth: 1, borderColor: '#2D5016', backgroundColor: '#fff',
  },
  shareButtonText: { color: '#2D5016', fontSize: 16, fontWeight: '600' },
  discardButton: {
    borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 12,
    borderWidth: 1, borderColor: '#e0e0e0', backgroundColor: '#fff',
  },
  discardButtonText: { color: '#666', fontSize: 16, fontWeight: '500' },
});
