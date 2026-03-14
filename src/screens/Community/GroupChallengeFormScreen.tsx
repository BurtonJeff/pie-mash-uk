import React, { useState, useLayoutEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommunityStackParamList } from '../../navigation/CommunityNavigator';
import { createGroupChallenge, updateGroupChallenge, GroupChallengeFormData } from '../../lib/challenges';
import { useQueryClient } from '@tanstack/react-query';
import DatePickerField from '../../components/common/DatePickerField';

type Props = NativeStackScreenProps<CommunityStackParamList, 'GroupChallengeForm'>;
type CriteriaType = 'total_checkins' | 'unique_shops' | 'shop_tour';

const CRITERIA_OPTIONS: { type: CriteriaType; label: string }[] = [
  { type: 'total_checkins', label: 'Total Check-ins' },
  { type: 'unique_shops', label: 'Unique Shops' },
];

export default function GroupChallengeFormScreen({ route, navigation }: Props) {
  const { groupId, challengeId } = route.params;
  const isEditing = !!challengeId;
  const qc = useQueryClient();

  const [form, setForm] = useState<GroupChallengeFormData>({
    title: '',
    description: '',
    points_reward: '',
    start_date: '',
    end_date: '',
    criteria_type: 'total_checkins',
    criteria_value: '',
    criteria_shops: [],
  });
  const [startDateObj, setStartDateObj] = useState<Date | null>(null);
  const [endDateObj, setEndDateObj] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Edit Challenge' : 'New Group Challenge' });
  }, [navigation, isEditing]);

  function toISODate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const set = (key: keyof GroupChallengeFormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validate = (): string | null => {
    if (!form.title.trim()) return 'Title is required.';
    if (!form.description.trim()) return 'Description is required.';
    const pts = parseInt(form.points_reward, 10);
    if (isNaN(pts) || pts <= 0) return 'Points reward must be a positive number.';
    if (!startDateObj) return 'Start date is required.';
    if (!endDateObj) return 'End date is required.';
    if (endDateObj <= startDateObj) return 'End date must be after start date.';
    const val = parseInt(form.criteria_value, 10);
    if (isNaN(val) || val <= 0) return 'Criteria value must be a positive number.';
    return null;
  };

  async function handleSubmit() {
    const err = validate();
    if (err) { Alert.alert('Validation Error', err); return; }
    setSaving(true);
    try {
      if (isEditing) {
        await updateGroupChallenge(challengeId!, form);
      } else {
        await createGroupChallenge(groupId, form);
      }
      qc.invalidateQueries({ queryKey: ['challenges'] });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not save challenge.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <FieldLabel label="Title" required />
      <TextInput style={styles.input} value={form.title} onChangeText={(v) => set('title', v)} placeholder="e.g. Monthly Pie Challenge" placeholderTextColor="#bbb" />

      <FieldLabel label="Description" required />
      <TextInput style={[styles.input, styles.multiline]} value={form.description} onChangeText={(v) => set('description', v)} placeholder="Describe the challenge..." placeholderTextColor="#bbb" multiline numberOfLines={3} />

      <FieldLabel label="Points Reward" required />
      <TextInput style={styles.input} value={form.points_reward} onChangeText={(v) => set('points_reward', v)} placeholder="e.g. 50" placeholderTextColor="#bbb" keyboardType="numeric" />

      <FieldLabel label="Start Date" required />
      <DatePickerField value={startDateObj} onChange={(d) => { setStartDateObj(d); setForm((p) => ({ ...p, start_date: toISODate(d) })); }} placeholder="Select start date" />

      <FieldLabel label="End Date" required />
      <DatePickerField value={endDateObj} onChange={(d) => { setEndDateObj(d); setForm((p) => ({ ...p, end_date: toISODate(d) })); }} minimumDate={startDateObj ?? undefined} placeholder="Select end date" />

      <FieldLabel label="Criteria Type" required />
      <View style={styles.toggleRow}>
        {CRITERIA_OPTIONS.map(({ type, label }) => (
          <TouchableOpacity
            key={type}
            style={[styles.toggleBtn, form.criteria_type === type && styles.toggleBtnSelected]}
            onPress={() => setForm((p) => ({ ...p, criteria_type: type }))}
          >
            <Text style={[styles.toggleBtnText, form.criteria_type === type && styles.toggleBtnTextSelected]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FieldLabel label="Criteria Value" required />
      <TextInput style={styles.input} value={form.criteria_value} onChangeText={(v) => set('criteria_value', v)} placeholder="e.g. 3" placeholderTextColor="#bbb" keyboardType="numeric" />

      <TouchableOpacity style={[styles.submitButton, saving && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>{isEditing ? 'Save Changes' : 'Create Challenge'}</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.discardButton} onPress={() => navigation.goBack()} disabled={saving}>
        <Text style={styles.discardButtonText}>Discard</Text>
      </TouchableOpacity>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return <Text style={styles.label}>{label}{required && <Text style={styles.required}> *</Text>}</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0ede8' },
  content: { paddingHorizontal: 20, paddingBottom: 48, paddingTop: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 14, marginLeft: 2 },
  required: { color: '#c00' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0ddd8', borderRadius: 10, padding: 12, fontSize: 15, color: '#1a1a1a' },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  toggleRow: { flexDirection: 'row', gap: 10 },
  toggleBtn: { flex: 1, paddingVertical: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0ddd8', borderRadius: 10, alignItems: 'center' },
  toggleBtnSelected: { backgroundColor: '#2D5016', borderColor: '#2D5016' },
  toggleBtnText: { fontSize: 13, fontWeight: '500', color: '#555' },
  toggleBtnTextSelected: { color: '#fff', fontWeight: '700' },
  submitButton: { backgroundColor: '#2D5016', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  discardButton: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: '#e0ddd8', backgroundColor: '#fff' },
  discardButtonText: { color: '#666', fontSize: 16, fontWeight: '500' },
});
