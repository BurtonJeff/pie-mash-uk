import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommunityStackParamList } from '../../navigation/CommunityNavigator';
import { useAuthStore } from '../../store/authStore';
import { useJoinGroup } from '../../hooks/useCommunity';

type Props = NativeStackScreenProps<CommunityStackParamList, 'JoinGroup'>;

export default function JoinGroupScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const mutation = useJoinGroup(user?.id ?? '');
  const [code, setCode] = useState('');

  async function submit() {
    if (code.trim().length < 4) return;
    try {
      const group = await mutation.mutateAsync(code.trim());
      navigation.replace('GroupDetail', { groupId: group.id, groupName: group.name });
    } catch (e: any) {
      Alert.alert('Could not join group', e.message);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.inner}>
        <Text style={styles.emoji}>👥</Text>
        <Text style={styles.title}>Join a Group</Text>
        <Text style={styles.subtitle}>Enter the 8-character invite code shared by the group admin.</Text>

        <TextInput
          style={styles.input}
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase())}
          placeholder="e.g. A1B2C3D4"
          autoCapitalize="characters"
          maxLength={8}
          autoCorrect={false}
        />

        <TouchableOpacity
          style={[styles.button, code.trim().length < 4 && styles.buttonDisabled]}
          onPress={submit}
          disabled={code.trim().length < 4 || mutation.isPending}
        >
          {mutation.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Join Group</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f5f0' },
  inner: { flex: 1, padding: 32, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 16,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 4,
    textAlign: 'center',
    width: '100%',
    marginBottom: 20,
  },
  button: { backgroundColor: '#2D5016', borderRadius: 12, padding: 16, alignItems: 'center', width: '100%' },
  buttonDisabled: { backgroundColor: '#aaa' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
