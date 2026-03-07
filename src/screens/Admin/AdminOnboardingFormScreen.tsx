import React, { useLayoutEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Switch, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminStackParamList } from '../../navigation/AdminNavigator';
import {
  fetchAllOnboardingSlides,
  upsertOnboardingSlide,
  deleteOnboardingSlide,
  uploadOnboardingImage,
} from '../../lib/content';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminOnboardingForm'>;
type HeroType = 'emoji' | 'image';

export default function AdminOnboardingFormScreen({ route, navigation }: Props) {
  const { slideId } = route.params;
  const qc = useQueryClient();
  const isNew = !slideId;

  const { data: slides = [] } = useQuery({
    queryKey: ['adminOnboardingSlides'],
    queryFn: () => fetchAllOnboardingSlides(),
    enabled: !isNew,
  });

  const existing = slides.find((s) => s.id === slideId);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [heroType, setHeroType] = useState<HeroType>('emoji');
  const [emoji, setEmoji] = useState('');
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [newImageUri, setNewImageUri] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [initialised, setInitialised] = useState(false);

  if (existing && !initialised) {
    setTitle(existing.title);
    setSubtitle(existing.subtitle);
    setEmoji(existing.emoji ?? '');
    setExistingImageUrl(existing.image_url ?? null);
    setHeroType(existing.image_url ? 'image' : 'emoji');
    setSortOrder(String(existing.sort_order));
    setIsActive(existing.is_active);
    setInitialised(true);
  }

  useLayoutEffect(() => {
    navigation.setOptions({ title: isNew ? 'New Slide' : 'Edit Slide' });
  }, [navigation, isNew]);

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setNewImageUri(result.assets[0].uri);
      setExistingImageUrl(null);
    }
  }

  const save = useMutation({
    mutationFn: async () => {
      let finalImageUrl: string | null = existingImageUrl;

      if (heroType === 'image' && newImageUri) {
        finalImageUrl = await uploadOnboardingImage(newImageUri);
      }

      const payload = {
        ...(slideId ? { id: slideId } : {}),
        title: title.trim(),
        subtitle: subtitle.trim(),
        emoji: heroType === 'emoji' ? emoji.trim() || null : null,
        image_url: heroType === 'image' ? finalImageUrl : null,
        sort_order: parseInt(sortOrder, 10) || 0,
        is_active: isActive,
      } as any;

      await upsertOnboardingSlide(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminOnboardingSlides'] });
      qc.invalidateQueries({ queryKey: ['onboardingSlides'] });
      navigation.goBack();
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  const remove = useMutation({
    mutationFn: () => deleteOnboardingSlide(slideId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminOnboardingSlides'] });
      qc.invalidateQueries({ queryKey: ['onboardingSlides'] });
      navigation.goBack();
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  function confirmDelete() {
    Alert.alert('Delete Slide', 'Are you sure you want to delete this slide?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove.mutate() },
    ]);
  }

  const previewImage = newImageUri ?? existingImageUrl;
  const busy = save.isPending || remove.isPending;
  const valid = title.trim().length > 0 && subtitle.trim().length > 0;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Welcome to&#10;Pie & Mash"
        multiline
        numberOfLines={2}
        textAlignVertical="top"
        placeholderTextColor="#bbb"
      />
      <Text style={styles.hint}>Use a real line break in the text to split the title across two lines.</Text>

      <Text style={styles.label}>Subtitle</Text>
      <TextInput
        style={styles.textArea}
        value={subtitle}
        onChangeText={setSubtitle}
        placeholder="Describe what this slide is about…"
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        placeholderTextColor="#bbb"
      />

      <Text style={styles.label}>Hero Type</Text>
      <View style={styles.toggleRow}>
        {(['emoji', 'image'] as HeroType[]).map((type) => {
          const selected = heroType === type;
          return (
            <TouchableOpacity
              key={type}
              style={[styles.toggleBtn, selected && styles.toggleBtnSelected]}
              onPress={() => setHeroType(type)}
            >
              <Text style={[styles.toggleBtnText, selected && styles.toggleBtnTextSelected]}>
                {type === 'emoji' ? 'Emoji' : 'Image'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {heroType === 'emoji' ? (
        <>
          <Text style={styles.label}>Emoji</Text>
          <TextInput
            style={styles.input}
            value={emoji}
            onChangeText={setEmoji}
            placeholder="e.g. 🥧"
            placeholderTextColor="#bbb"
          />
        </>
      ) : (
        <>
          <Text style={styles.label}>Image</Text>
          {previewImage ? (
            <View style={styles.imagePreviewWrap}>
              <Image source={{ uri: previewImage }} style={styles.imagePreview} resizeMode="cover" />
              <TouchableOpacity style={styles.changeImageBtn} onPress={pickImage}>
                <Ionicons name="camera-outline" size={16} color="#2D5016" />
                <Text style={styles.changeImageText}>Change Image</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              <Ionicons name="image-outline" size={32} color="#2D5016" />
              <Text style={styles.imagePickerText}>Tap to choose an image</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      <Text style={styles.label}>Sort Order</Text>
      <TextInput
        style={styles.input}
        value={sortOrder}
        onChangeText={setSortOrder}
        keyboardType="number-pad"
        placeholder="0"
        placeholderTextColor="#bbb"
      />
      <Text style={styles.hint}>Lower numbers appear first.</Text>

      <View style={styles.switchRow}>
        <Text style={styles.label}>Active</Text>
        <Switch
          value={isActive}
          onValueChange={setIsActive}
          trackColor={{ false: '#ddd', true: '#2D5016' }}
          thumbColor="#fff"
        />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, (!valid || busy) && styles.buttonDisabled]}
        onPress={() => save.mutate()}
        disabled={!valid || busy}
      >
        {save.isPending
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.saveButtonText}>{isNew ? 'Add Slide' : 'Save Changes'}</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity style={styles.discardButton} onPress={() => navigation.goBack()} disabled={busy}>
        <Text style={styles.discardButtonText}>Discard</Text>
      </TouchableOpacity>

      {!isNew && (
        <TouchableOpacity style={styles.deleteButton} onPress={confirmDelete} disabled={busy}>
          <Text style={styles.deleteButtonText}>Delete Slide</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0ede8' },
  content: { padding: 20, paddingBottom: 48 },

  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 16 },
  hint: { fontSize: 12, color: '#aaa', marginTop: 4 },

  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1a1a1a',
    minHeight: 48,
  },
  textArea: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1a1a1a',
    minHeight: 90,
  },

  toggleRow: { flexDirection: 'row', gap: 10 },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0ddd8',
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleBtnSelected: { backgroundColor: '#2D5016', borderColor: '#2D5016' },
  toggleBtnText: { fontSize: 14, fontWeight: '500', color: '#555' },
  toggleBtnTextSelected: { color: '#fff', fontWeight: '700' },

  imagePicker: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imagePickerText: { fontSize: 14, color: '#2D5016', fontWeight: '500' },
  imagePreviewWrap: { borderRadius: 10, overflow: 'hidden' },
  imagePreview: { width: '100%', height: 180 },
  changeImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#eef4e8',
  },
  changeImageText: { fontSize: 13, color: '#2D5016', fontWeight: '500' },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },

  saveButton: {
    backgroundColor: '#2D5016',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  buttonDisabled: { backgroundColor: '#aaa' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  discardButton: {
    borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 12,
    borderWidth: 1, borderColor: '#e0e0e0', backgroundColor: '#fff',
  },
  discardButtonText: { color: '#666', fontSize: 15, fontWeight: '500' },
  deleteButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  deleteButtonText: { color: '#c0392b', fontSize: 15, fontWeight: '500' },
});
