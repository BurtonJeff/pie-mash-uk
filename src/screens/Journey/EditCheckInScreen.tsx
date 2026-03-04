import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Image, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { JourneyStackParamList } from '../../navigation/JourneyNavigator';
import { useAuthStore } from '../../store/authStore';
import { useUpdateCheckIn } from '../../hooks/useCheckin';

type Props = NativeStackScreenProps<JourneyStackParamList, 'EditCheckIn'>;

export default function EditCheckInScreen({ navigation, route }: Props) {
  const { checkInId, shopName, initialPhotoUrl, initialNotes } = route.params;
  const { user } = useAuthStore();
  const mutation = useUpdateCheckIn(user?.id ?? '');

  const [newPhotoUri, setNewPhotoUri] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialPhotoUrl ?? null);
  const [notes, setNotes] = useState(initialNotes ?? '');

  // Displayed photo: prefer a newly picked local URI, else the stored URL
  const displayPhoto = newPhotoUri ?? photoUrl;

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to change the photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) {
      setNewPhotoUri(result.assets[0].uri);
      setPhotoUrl(null);
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
      setNewPhotoUri(result.assets[0].uri);
      setPhotoUrl(null);
    }
  }

  function removePhoto() {
    setNewPhotoUri(null);
    setPhotoUrl(null);
  }

  function save() {
    if (!user) return;
    mutation.mutate(
      { checkInId, userId: user.id, newPhotoUri: newPhotoUri ?? undefined, photoUrl, notes },
      {
        onSuccess: () => navigation.goBack(),
        onError: (e: any) => Alert.alert('Error', e.message ?? 'Could not save changes.'),
      },
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          <Text style={styles.shopName}>{shopName}</Text>

          <Text style={styles.sectionLabel}>Photo <Text style={styles.optional}>(optional)</Text></Text>
          {displayPhoto ? (
            <View style={styles.photoPreviewWrap}>
              <Image source={{ uri: displayPhoto }} style={styles.photoPreview} />
              <TouchableOpacity style={styles.removePhoto} onPress={removePhoto}>
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
            onPress={save}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
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

  photoButtons: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  photoButton: {
    flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderStyle: 'dashed',
  },
  photoButtonText: { fontSize: 14, color: '#555' },
  photoPreviewWrap: { marginBottom: 24 },
  photoPreview: { width: '100%', height: 200, borderRadius: 10 },
  removePhoto: { marginTop: 8, alignSelf: 'flex-end' },
  removePhotoText: { fontSize: 13, color: '#c00' },

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
  discardButton: {
    borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 12,
    borderWidth: 1, borderColor: '#e0e0e0', backgroundColor: '#fff',
  },
  discardButtonText: { color: '#666', fontSize: 16, fontWeight: '500' },
});
