import React, { useState } from 'react';
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
import { useAddBadge } from '../../hooks/useAdmin';
import { BadgeFormData } from '../../lib/admin';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminBadgeForm'>;

type CriteriaType = 'total_checkins' | 'unique_shops';

export default function AdminBadgeFormScreen({ navigation }: Props) {
  const addBadge = useAddBadge();

  const [form, setForm] = useState<BadgeFormData>({
    name: '',
    description: '',
    icon_url: '',
    category: '',
    criteria_type: 'total_checkins',
    criteria_value: '',
  });

  const set = (key: keyof BadgeFormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validate = (): string | null => {
    if (!form.name.trim()) return 'Name is required.';
    if (!form.description.trim()) return 'Description is required.';
    if (!form.icon_url.trim()) return 'Icon URL / emoji is required.';
    if (!form.category.trim()) return 'Category is required.';
    const val = parseInt(form.criteria_value, 10);
    if (isNaN(val) || val <= 0) return 'Criteria value must be a positive number.';
    return null;
  };

  const handleSubmit = () => {
    const err = validate();
    if (err) {
      Alert.alert('Validation Error', err);
      return;
    }

    addBadge.mutate(form, {
      onSuccess: () => {
        Alert.alert('Success', `Badge "${form.name}" has been added.`, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      },
      onError: (e: any) => {
        Alert.alert('Error', e.message ?? 'Could not add badge. Please try again.');
      },
    });
  };

  const CRITERIA_OPTIONS: { type: CriteriaType; label: string }[] = [
    { type: 'total_checkins', label: 'Total Check-ins' },
    { type: 'unique_shops', label: 'Unique Shops' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <FieldLabel label="Name" required />
      <TextInput
        style={styles.input}
        value={form.name}
        onChangeText={(v) => set('name', v)}
        placeholder="e.g. Regular"
        placeholderTextColor="#bbb"
      />

      <FieldLabel label="Description" required />
      <TextInput
        style={[styles.input, styles.multiline]}
        value={form.description}
        onChangeText={(v) => set('description', v)}
        placeholder="e.g. Visit 5 different shops"
        placeholderTextColor="#bbb"
        multiline
        numberOfLines={3}
      />

      <FieldLabel label="Icon URL / Emoji" required />
      <TextInput
        style={styles.input}
        value={form.icon_url}
        onChangeText={(v) => set('icon_url', v)}
        placeholder="e.g. 🥧 or https://..."
        placeholderTextColor="#bbb"
      />

      <FieldLabel label="Category" required />
      <TextInput
        style={styles.input}
        value={form.category}
        onChangeText={(v) => set('category', v)}
        placeholder="e.g. milestone, explorer"
        placeholderTextColor="#bbb"
        autoCapitalize="none"
      />

      <FieldLabel label="Criteria Type" required />
      <View style={styles.toggleRow}>
        {CRITERIA_OPTIONS.map(({ type, label }) => {
          const selected = form.criteria_type === type;
          return (
            <TouchableOpacity
              key={type}
              style={[styles.toggleBtn, selected && styles.toggleBtnSelected]}
              onPress={() => set('criteria_type', type)}
            >
              <Text style={[styles.toggleBtnText, selected && styles.toggleBtnTextSelected]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FieldLabel label="Criteria Value" required />
      <TextInput
        style={styles.input}
        value={form.criteria_value}
        onChangeText={(v) => set('criteria_value', v)}
        placeholder="e.g. 10"
        placeholderTextColor="#bbb"
        keyboardType="numeric"
      />

      <TouchableOpacity
        style={[styles.submitButton, addBadge.isPending && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={addBadge.isPending}
      >
        {addBadge.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Add Badge</Text>
        )}
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
    minHeight: 80,
    textAlignVertical: 'top',
  },

  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0ddd8',
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleBtnSelected: {
    backgroundColor: '#2D5016',
    borderColor: '#2D5016',
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#555',
  },
  toggleBtnTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },

  submitButton: {
    backgroundColor: '#2D5016',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
