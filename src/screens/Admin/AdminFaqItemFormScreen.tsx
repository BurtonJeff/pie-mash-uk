import React, { useLayoutEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Switch, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminStackParamList } from '../../navigation/AdminNavigator';
import { fetchAllFaqItems, upsertFaqItem, deleteFaqItem } from '../../lib/content';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminFaqItemForm'>;

export default function AdminFaqItemFormScreen({ route, navigation }: Props) {
  const { itemId } = route.params;
  const qc = useQueryClient();
  const isNew = !itemId;

  const { data: items = [] } = useQuery({
    queryKey: ['adminFaqItems'],
    queryFn: () => fetchAllFaqItems(),
    enabled: !isNew,
  });

  const existing = items.find((f) => f.id === itemId);

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState('0');
  const [initialised, setInitialised] = useState(false);

  if (existing && !initialised) {
    setQuestion(existing.question);
    setAnswer(existing.answer);
    setIsActive(existing.is_active);
    setSortOrder(String(existing.sort_order));
    setInitialised(true);
  }

  const save = useMutation({
    mutationFn: () => upsertFaqItem({
      ...(itemId ? { id: itemId } : {}),
      question: question.trim(),
      answer: answer.trim(),
      is_active: isActive,
      sort_order: parseInt(sortOrder, 10) || 0,
    } as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminFaqItems'] });
      qc.invalidateQueries({ queryKey: ['faqItems'] });
      navigation.goBack();
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  const remove = useMutation({
    mutationFn: () => deleteFaqItem(itemId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminFaqItems'] });
      qc.invalidateQueries({ queryKey: ['faqItems'] });
      navigation.goBack();
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  useLayoutEffect(() => {
    navigation.setOptions({ title: isNew ? 'New FAQ Item' : 'Edit FAQ Item' });
  }, [navigation, isNew]);

  function confirmDelete() {
    Alert.alert('Delete FAQ Item', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove.mutate() },
    ]);
  }

  const busy = save.isPending || remove.isPending;
  const valid = question.trim().length > 0 && answer.trim().length > 0;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Question</Text>
      <TextInput
        style={styles.input}
        value={question}
        onChangeText={setQuestion}
        placeholder="Enter the question…"
      />

      <Text style={styles.label}>Answer</Text>
      <TextInput
        style={styles.textArea}
        value={answer}
        onChangeText={setAnswer}
        placeholder="Enter the answer…"
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <Text style={styles.label}>Sort Order</Text>
      <TextInput
        style={styles.input}
        value={sortOrder}
        onChangeText={setSortOrder}
        keyboardType="number-pad"
        placeholder="0"
      />

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
          : <Text style={styles.saveButtonText}>{isNew ? 'Add FAQ Item' : 'Save Changes'}</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity style={styles.discardButton} onPress={() => navigation.goBack()} disabled={busy}>
        <Text style={styles.discardButtonText}>Discard</Text>
      </TouchableOpacity>

      {!isNew && (
        <TouchableOpacity style={styles.deleteButton} onPress={confirmDelete} disabled={busy}>
          <Text style={styles.deleteButtonText}>Delete FAQ Item</Text>
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
  input: {
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e0e0e0',
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
  },
  textArea: {
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e0e0e0',
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, minHeight: 120,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  saveButton: {
    backgroundColor: '#2D5016', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 28,
  },
  buttonDisabled: { backgroundColor: '#aaa' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  discardButton: {
    borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 12,
    borderWidth: 1, borderColor: '#e0e0e0', backgroundColor: '#fff',
  },
  discardButtonText: { color: '#666', fontSize: 15, fontWeight: '500' },
  deleteButton: {
    borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 12,
    borderWidth: 1, borderColor: '#e0e0e0', backgroundColor: '#fff',
  },
  deleteButtonText: { color: '#c0392b', fontSize: 15, fontWeight: '500' },
});
