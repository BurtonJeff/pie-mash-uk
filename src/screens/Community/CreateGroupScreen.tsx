import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommunityStackParamList } from '../../navigation/CommunityNavigator';
import { useAuthStore } from '../../store/authStore';
import { useCreateGroup } from '../../hooks/useCommunity';

type Props = NativeStackScreenProps<CommunityStackParamList, 'CreateGroup'>;

export default function CreateGroupScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const mutation = useCreateGroup(user?.id ?? '');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [requiresConfirmation, setRequiresConfirmation] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    try {
      const group = await mutation.mutateAsync({ name: name.trim(), description: description.trim(), requiresConfirmation });
      navigation.replace('GroupDetail', { groupId: group.id, groupName: group.name, inviteCode: group.inviteCode, createdBy: group.createdBy, requiresConfirmation: group.requiresConfirmation });
    } catch (e: any) {
      Alert.alert('Failed to create group', e.message);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Group Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. East London Pie Crew"
            maxLength={60}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="What's this group about?"
            multiline
            numberOfLines={3}
            maxLength={200}
            textAlignVertical="top"
          />

          <View style={styles.confirmRow}>
            <View style={styles.confirmText}>
              <Text style={styles.label}>Require approval to join</Text>
              <Text style={styles.confirmSub}>New members must be approved by an admin before joining</Text>
            </View>
            <Switch
              value={requiresConfirmation}
              onValueChange={setRequiresConfirmation}
              trackColor={{ false: '#ddd', true: '#2D5016' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              You'll be the group admin. After creating, share the invite code with friends so they can join.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, !name.trim() && styles.buttonDisabled]}
            onPress={submit}
            disabled={!name.trim() || mutation.isPending}
          >
            {mutation.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Create Group</Text>}
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
  textArea: { minHeight: 90 },
  confirmRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 10, borderWidth: 1, borderColor: '#e0e0e0',
    padding: 14, marginBottom: 20, gap: 12,
  },
  confirmText: { flex: 1 },
  confirmSub: { fontSize: 12, color: '#999', marginTop: 2 },
  infoBox: { backgroundColor: '#e8f5e9', borderRadius: 10, padding: 14, marginBottom: 24 },
  infoText: { fontSize: 13, color: '#444', lineHeight: 18 },
  button: { backgroundColor: '#2D5016', borderRadius: 12, padding: 16, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#aaa' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
