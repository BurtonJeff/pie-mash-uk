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
  Image,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { compressAvatar } from '../../utils/imageUtils';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { JourneyStackParamList } from '../../navigation/JourneyNavigator';
import { useAuthStore } from '../../store/authStore';
import { useProfile } from '../../hooks/useProfile';
import { updateProfile, uploadAvatar } from '../../lib/profile';
import { useQueryClient } from '@tanstack/react-query';

type Props = NativeStackScreenProps<JourneyStackParamList, 'EditProfile'>;

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(' ');
  const initials = parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : name.slice(0, 2);
  return (
    <View style={styles.avatarPlaceholder}>
      <Text style={styles.avatarInitials}>{initials.toUpperCase()}</Text>
    </View>
  );
}

export default function EditProfileScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const userId = user?.id ?? '';
  const { data: profile } = useProfile(userId);
  const queryClient = useQueryClient();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);   // local pick
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);   // remote url
  const [saving, setSaving] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name);
      setBio(profile.bio ?? '');
      setAvatarUrl(profile.avatar_url ?? null);
      setIsPrivate(profile.is_private ?? false);
    }
  }, [profile]);

  async function pickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled) {
      const compressed = await compressAvatar(result.assets[0].uri);
      setAvatarUri(compressed);
    }
  }

  async function save() {
    if (!displayName.trim()) return;
    setSaving(true);
    try {
      let newAvatarUrl = avatarUrl;
      if (avatarUri) {
        newAvatarUrl = await uploadAvatar(userId, avatarUri);
      }
      await updateProfile(userId, {
        display_name: displayName.trim(),
        bio: bio.trim() || undefined,
        is_private: isPrivate,
        ...(newAvatarUrl !== avatarUrl && { avatar_url: newAvatarUrl ?? undefined }),
      });
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Save failed', e.message);
    } finally {
      setSaving(false);
    }
  }

  const displayImage = avatarUri ?? avatarUrl;
  const nameForInitials = profile?.display_name || profile?.username || '';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* ── Avatar picker ── */}
          <TouchableOpacity style={styles.avatarWrap} onPress={pickAvatar} activeOpacity={0.8}>
            {displayImage ? (
              <Image source={{ uri: displayImage }} style={styles.avatar} />
            ) : (
              <Initials name={nameForInitials} />
            )}
            <View style={styles.avatarBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Tap to change photo</Text>

          {/* ── Display Name ── */}
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            maxLength={50}
          />

          {/* ── Bio ── */}
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

          {/* ── Private Profile ── */}
          <View style={styles.privateRow}>
            <View style={styles.privateTextWrap}>
              <Text style={styles.privateLabel}>Private profile</Text>
              <Text style={styles.privateSub}>Your stats won't appear in global leaderboards</Text>
            </View>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              trackColor={{ false: '#ddd', true: '#2D5016' }}
              thumbColor="#fff"
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={save} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveText}>Save Changes</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.discardButton}
            onPress={() => navigation.goBack()}
            disabled={saving}
          >
            <Text style={styles.discardText}>Discard</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f5f0' },
  flex: { flex: 1 },
  scroll: { padding: 20, alignItems: 'center' },

  // ── Avatar ──────────────────────────────────────────
  avatarWrap: { marginBottom: 8, position: 'relative' },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#e0e0e0',
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#2D5016',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 34, fontWeight: '700', color: '#fff' },
  avatarBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#2D5016',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#f8f5f0',
  },
  avatarHint: { fontSize: 12, color: '#999', marginBottom: 28 },

  // ── Form ────────────────────────────────────────────
  label: {
    alignSelf: 'flex-start',
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    alignSelf: 'stretch',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 14,
    fontSize: 15,
    marginBottom: 20,
  },
  bioInput: { minHeight: 100 },
  charCount: { alignSelf: 'flex-end', fontSize: 11, color: '#bbb', marginTop: -16, marginBottom: 24 },
  saveButton: {
    alignSelf: 'stretch',
    backgroundColor: '#2D5016',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  discardButton: {
    alignSelf: 'stretch',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  discardText: { color: '#666', fontSize: 16, fontWeight: '500' },
  privateRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 14,
    marginBottom: 20,
    gap: 12,
  },
  privateTextWrap: { flex: 1 },
  privateLabel: { fontSize: 15, color: '#1a1a1a', fontWeight: '600' },
  privateSub: { fontSize: 12, color: '#999', marginTop: 2 },
});
