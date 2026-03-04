import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchLegalContent, saveLegalContent } from '../../lib/content';

type LegalType = 'privacy_policy' | 'terms_of_service';

function LegalEditor({ type, title }: { type: LegalType; title: string }) {
  const qc = useQueryClient();

  const { data: saved = '', isLoading } = useQuery({
    queryKey: ['adminLegal', type],
    queryFn: () => fetchLegalContent(type),
  });

  const [content, setContent] = useState('');
  const [initialised, setInitialised] = useState(false);

  if (saved && !initialised) {
    setContent(saved);
    setInitialised(true);
  }

  const save = useMutation({
    mutationFn: () => saveLegalContent(type, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminLegal', type] });
      qc.invalidateQueries({ queryKey: ['legalContent', type] });
      Alert.alert('Saved', `${title} updated successfully.`);
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {isLoading ? (
        <ActivityIndicator color="#2D5016" style={{ marginVertical: 16 }} />
      ) : (
        <>
          <TextInput
            style={styles.textArea}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            placeholder="Enter content…"
          />
          <TouchableOpacity
            style={[styles.saveButton, save.isPending && styles.buttonDisabled]}
            onPress={() => save.mutate()}
            disabled={save.isPending}
          >
            {save.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveButtonText}>Save {title}</Text>
            }
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

export default function AdminLegalScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <LegalEditor type="privacy_policy" title="Privacy Policy" />
      <LegalEditor type="terms_of_service" title="Terms of Service" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0ede8' },
  content: { padding: 20, paddingBottom: 48 },
  section: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 20,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 },
  textArea: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10,
    padding: 12, fontSize: 14, minHeight: 200, color: '#333',
  },
  saveButton: {
    backgroundColor: '#2D5016', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 12,
  },
  buttonDisabled: { backgroundColor: '#aaa' },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
