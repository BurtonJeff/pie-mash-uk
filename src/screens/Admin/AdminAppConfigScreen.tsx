import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminStackParamList } from '../../navigation/AdminNavigator';
import { fetchAppConfig, setAppConfig } from '../../lib/content';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminAppConfig'>;

export default function AdminAppConfigScreen(_: Props) {
  const qc = useQueryClient();

  const { data: currentSubtitle, isLoading } = useQuery({
    queryKey: ['appConfig', 'home_subtitle'],
    queryFn: () => fetchAppConfig('home_subtitle'),
  });

  const [subtitle, setSubtitle] = useState('');
  const [initialised, setInitialised] = useState(false);

  if (currentSubtitle !== undefined && !initialised) {
    setSubtitle(currentSubtitle ?? '');
    setInitialised(true);
  }

  const save = useMutation({
    mutationFn: () => setAppConfig('home_subtitle', subtitle.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appConfig', 'home_subtitle'] });
      Alert.alert('Saved', 'Home screen subtitle updated.');
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  if (isLoading) {
    return <ActivityIndicator size="large" color="#2D5016" style={styles.loader} />;
  }

  const busy = save.isPending;
  const valid = subtitle.trim().length > 0;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.label}>Home Screen Subtitle</Text>
      <Text style={styles.hint}>
        Shown below the header on the Home tab. Keep it short and welcoming.
      </Text>
      <TextInput
        style={styles.textArea}
        value={subtitle}
        onChangeText={setSubtitle}
        placeholder="e.g. Preserving a Great British Tradition…"
        placeholderTextColor="#bbb"
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        maxLength={200}
      />
      <Text style={styles.charCount}>{subtitle.length}/200</Text>

      <TouchableOpacity
        style={[styles.saveButton, (!valid || busy) && styles.buttonDisabled]}
        onPress={() => save.mutate()}
        disabled={!valid || busy}
      >
        {busy
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.saveButtonText}>Save Changes</Text>
        }
      </TouchableOpacity>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0ede8' },
  content: { padding: 20, paddingBottom: 48 },
  loader: { flex: 1, marginTop: 80 },

  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  hint: { fontSize: 12, color: '#aaa', marginBottom: 10, lineHeight: 18 },
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
  charCount: { fontSize: 11, color: '#bbb', textAlign: 'right', marginTop: 4, marginBottom: 28 },

  saveButton: {
    backgroundColor: '#2D5016', borderRadius: 12, padding: 16, alignItems: 'center',
  },
  buttonDisabled: { backgroundColor: '#aaa' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
