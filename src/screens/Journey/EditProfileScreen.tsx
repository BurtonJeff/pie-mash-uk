import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { JourneyStackParamList } from '../../navigation/JourneyNavigator';
import { useAuthStore } from '../../store/authStore';
import { useProfile } from '../../hooks/useProfile';
import { updateProfile } from '../../lib/profile';
import { useQueryClient } from '@tanstack/react-query';

type Props = NativeStackScreenProps<JourneyStackParamList, 'EditProfile'>;

export default function EditProfileScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const userId = user?.id ?? '';
  const { data: profile } = useProfile(userId);
  const queryClient = useQueryClient();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name);
      setBio(profile.bio ?? '');
    }
  }, [profile]);

  async function save() {
    if (!displayName.trim()) return;
    setSaving(true);
    try {
      await updateProfile(userId, { display_name: displayName.trim(), bio: bio.trim() || undefined });
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Save failed', e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            maxLength={50}
          />

          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell the community a little about yourself…"
            multiline
            numberOfLines={4}
            maxLength={200}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{bio.length}/200</Text>

          <TouchableOpacity style={styles.saveButton} onPress={save} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveText}>Save Changes</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f5f0' },
  flex: { flex: 1 },
  scroll: { padding: 20 },
  label: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 14,
    fontSize: 15,
    marginBottom: 20,
  },
  bioInput: { minHeight: 100 },
  charCount: { fontSize: 11, color: '#bbb', textAlign: 'right', marginTop: -16, marginBottom: 24 },
  saveButton: {
    backgroundColor: '#2D5016',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
