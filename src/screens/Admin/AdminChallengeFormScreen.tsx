import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/AdminNavigator';
import { useAddChallenge, useUpdateChallenge, useAdminChallengeById } from '../../hooks/useAdmin';
import { ChallengeFormData } from '../../lib/admin';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminChallengeForm'>;

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export default function AdminChallengeFormScreen({ navigation, route }: Props) {
  const challengeId = route.params?.challengeId;
  const isEditing = !!challengeId;

  const addChallenge = useAddChallenge();
  const updateChallenge = useUpdateChallenge();
  const { data: existingChallenge, isLoading: challengeLoading } = useAdminChallengeById(challengeId);

  const [form, setForm] = useState<ChallengeFormData>({
    title: '',
    description: '',
    points_reward: '',
    start_date: '',
    end_date: '',
  });

  useLayoutEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Edit Challenge' : 'New Challenge' });
  }, [navigation, isEditing]);

  useEffect(() => {
    if (existingChallenge) {
      setForm({
        title: existingChallenge.title,
        description: existingChallenge.description,
        points_reward: existingChallenge.pointsReward.toString(),
        start_date: existingChallenge.startDate,
        end_date: existingChallenge.endDate,
      });
    }
  }, [existingChallenge]);

  const set = (key: keyof ChallengeFormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validate = (): string | null => {
    if (!form.title.trim()) return 'Title is required.';
    if (!form.description.trim()) return 'Description is required.';
    const pts = parseInt(form.points_reward, 10);
    if (isNaN(pts) || pts <= 0) return 'Points reward must be a positive number.';
    if (!form.start_date.trim()) return 'Start date is required.';
    if (!form.end_date.trim()) return 'End date is required.';
    if (!DATE_REGEX.test(form.start_date)) return 'Start date must be in YYYY-MM-DD format.';
    if (!DATE_REGEX.test(form.end_date)) return 'End date must be in YYYY-MM-DD format.';
    if (form.end_date <= form.start_date) return 'End date must be after start date.';
    return null;
  };

  const handleSubmit = () => {
    const err = validate();
    if (err) {
      Alert.alert('Validation Error', err);
      return;
    }

    if (isEditing) {
      updateChallenge.mutate({ challengeId, data: form }, {
        onSuccess: () => {
          Alert.alert('Success', `Challenge "${form.title}" has been updated.`, [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        },
        onError: (e: any) => {
          Alert.alert('Error', e.message ?? 'Could not update challenge. Please try again.');
        },
      });
    } else {
      addChallenge.mutate(form, {
        onSuccess: () => {
          Alert.alert('Success', `Challenge "${form.title}" has been created.`, [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        },
        onError: (e: any) => {
          Alert.alert('Error', e.message ?? 'Could not create challenge. Please try again.');
        },
      });
    }
  };

  const isPending = addChallenge.isPending || updateChallenge.isPending;

  if (isEditing && challengeLoading) {
    return <ActivityIndicator size="large" color="#2D5016" style={styles.loader} />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <FieldLabel label="Title" required />
      <TextInput
        style={styles.input}
        value={form.title}
        onChangeText={(v) => set('title', v)}
        placeholder="e.g. Spring Explorer"
        placeholderTextColor="#bbb"
      />

      <FieldLabel label="Description" required />
      <TextInput
        style={[styles.input, styles.multiline]}
        value={form.description}
        onChangeText={(v) => set('description', v)}
        placeholder="e.g. Visit 3 different pie shops this spring"
        placeholderTextColor="#bbb"
        multiline
        numberOfLines={4}
      />

      <FieldLabel label="Points Reward" required />
      <TextInput
        style={styles.input}
        value={form.points_reward}
        onChangeText={(v) => set('points_reward', v)}
        placeholder="e.g. 100"
        placeholderTextColor="#bbb"
        keyboardType="numeric"
      />

      <FieldLabel label="Start Date" required />
      <TextInput
        style={styles.input}
        value={form.start_date}
        onChangeText={(v) => set('start_date', v)}
        placeholder="2026-03-01"
        placeholderTextColor="#bbb"
        autoCapitalize="none"
        keyboardType="numbers-and-punctuation"
      />

      <FieldLabel label="End Date" required />
      <TextInput
        style={styles.input}
        value={form.end_date}
        onChangeText={(v) => set('end_date', v)}
        placeholder="2026-06-01"
        placeholderTextColor="#bbb"
        autoCapitalize="none"
        keyboardType="numbers-and-punctuation"
      />

      <View style={styles.scopeNote}>
        <Text style={styles.scopeNoteText}>
          All challenges created here are <Text style={styles.bold}>Global</Text> scope.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.submitButton, isPending && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isPending}
      >
        {isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>
            {isEditing ? 'Save Changes' : 'Create Challenge'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.discardButton}
        onPress={() => navigation.goBack()}
        disabled={isPending}
      >
        <Text style={styles.discardButtonText}>Discard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Text style={styles.label}>
      {label}
      {required && <Text style={styles.required}> *</Text>}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0ede8' },
  content: { paddingHorizontal: 20, paddingBottom: 48, paddingTop: 16 },
  loader: { flex: 1, marginTop: 80 },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
    marginTop: 14,
    marginLeft: 2,
  },
  required: { color: '#c00' },

  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0ddd8',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#1a1a1a',
  },
  multiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },

  scopeNote: {
    backgroundColor: '#eef4e8',
    borderRadius: 10,
    padding: 12,
    marginTop: 20,
  },
  scopeNoteText: {
    fontSize: 13,
    color: '#4a7a2a',
  },
  bold: { fontWeight: '700' },

  discardButton: {
    borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 12,
    borderWidth: 1, borderColor: '#e0ddd8', backgroundColor: '#fff',
  },
  discardButtonText: { color: '#666', fontSize: 16, fontWeight: '500' },

  submitButton: {
    backgroundColor: '#2D5016',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
