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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DatePickerField from '../../components/common/DatePickerField';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/AdminNavigator';
import { useAddChallenge, useUpdateChallenge, useAdminChallengeById, useAdminShops } from '../../hooks/useAdmin';
import { ChallengeFormData } from '../../lib/admin';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminChallengeForm'>;

type CriteriaType = 'total_checkins' | 'unique_shops' | 'shop_tour';

const CRITERIA_OPTIONS: { type: CriteriaType; label: string }[] = [
  { type: 'total_checkins', label: 'Total Check-ins' },
  { type: 'unique_shops', label: 'Unique Shops' },
  { type: 'shop_tour', label: 'Shop Tour' },
];


export default function AdminChallengeFormScreen({ navigation, route }: Props) {
  const challengeId = route.params?.challengeId;
  const isEditing = !!challengeId;

  const addChallenge = useAddChallenge();
  const updateChallenge = useUpdateChallenge();
  const { data: existingChallenge, isLoading: challengeLoading } = useAdminChallengeById(challengeId);
  const { data: allShops = [] } = useAdminShops();
  const [shopSearch, setShopSearch] = useState('');

  const [form, setForm] = useState<ChallengeFormData>({
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

  useLayoutEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Edit Challenge' : 'New Challenge' });
  }, [navigation, isEditing]);

  function toISODate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function isoToDate(iso: string): Date | null {
    if (!iso) return null;
    const d = new Date(iso + 'T00:00:00');
    return isNaN(d.getTime()) ? null : d;
  }

  function handleStartDateChange(date: Date) {
    setStartDateObj(date);
    setForm((prev) => ({ ...prev, start_date: toISODate(date) }));
  }

  function handleEndDateChange(date: Date) {
    setEndDateObj(date);
    setForm((prev) => ({ ...prev, end_date: toISODate(date) }));
  }

  useEffect(() => {
    if (existingChallenge) {
      const start = isoToDate(existingChallenge.startDate);
      const end = isoToDate(existingChallenge.endDate);
      setStartDateObj(start);
      setEndDateObj(end);
      setForm({
        title: existingChallenge.title,
        description: existingChallenge.description,
        points_reward: existingChallenge.pointsReward.toString(),
        start_date: existingChallenge.startDate,
        end_date: existingChallenge.endDate,
        criteria_type: existingChallenge.criteriaType as CriteriaType,
        criteria_value: existingChallenge.criteriaValue > 0 ? existingChallenge.criteriaValue.toString() : '',
        criteria_shops: existingChallenge.criteriaShops ?? [],
      });
    }
  }, [existingChallenge]);

  const set = (key: keyof ChallengeFormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  function toggleShop(shopId: string) {
    setForm((prev) => ({
      ...prev,
      criteria_shops: prev.criteria_shops.includes(shopId)
        ? prev.criteria_shops.filter((id) => id !== shopId)
        : [...prev.criteria_shops, shopId],
    }));
  }

  const filteredShops = shopSearch.trim()
    ? allShops.filter((s) =>
        s.name.toLowerCase().includes(shopSearch.toLowerCase()) ||
        s.city.toLowerCase().includes(shopSearch.toLowerCase()),
      )
    : allShops;

  const validate = (): string | null => {
    if (!form.title.trim()) return 'Title is required.';
    if (!form.description.trim()) return 'Description is required.';
    const pts = parseInt(form.points_reward, 10);
    if (isNaN(pts) || pts <= 0) return 'Points reward must be a positive number.';
    if (!startDateObj) return 'Start date is required.';
    if (!endDateObj) return 'End date is required.';
    if (endDateObj <= startDateObj) return 'End date must be after start date.';
    if (form.criteria_type === 'shop_tour') {
      if (form.criteria_shops.length === 0) return 'Select at least one shop for the tour.';
    } else {
      const val = parseInt(form.criteria_value, 10);
      if (isNaN(val) || val <= 0) return 'Criteria value must be a positive number.';
    }
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
      <DatePickerField
        value={startDateObj}
        onChange={handleStartDateChange}
        placeholder="Select start date"
      />

      <FieldLabel label="End Date" required />
      <DatePickerField
        value={endDateObj}
        onChange={handleEndDateChange}
        minimumDate={startDateObj ?? undefined}
        placeholder="Select end date"
      />

      <FieldLabel label="Criteria Type" required />
      <View style={styles.toggleRow}>
        {CRITERIA_OPTIONS.map(({ type, label }) => {
          const selected = form.criteria_type === type;
          return (
            <TouchableOpacity
              key={type}
              style={[styles.toggleBtn, selected && styles.toggleBtnSelected]}
              onPress={() => setForm((prev) => ({ ...prev, criteria_type: type }))}
            >
              <Text style={[styles.toggleBtnText, selected && styles.toggleBtnTextSelected]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {form.criteria_type === 'shop_tour' ? (
        <>
          <FieldLabel label={`Shops to Visit (${form.criteria_shops.length} selected)`} required />
          <TextInput
            style={styles.input}
            value={shopSearch}
            onChangeText={setShopSearch}
            placeholder="Search shops..."
            placeholderTextColor="#bbb"
          />
          <View style={styles.shopList}>
            {filteredShops.map((shop) => {
              const selected = form.criteria_shops.includes(shop.id);
              return (
                <TouchableOpacity
                  key={shop.id}
                  style={[styles.shopRow, selected && styles.shopRowSelected]}
                  onPress={() => toggleShop(shop.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.shopRowInfo}>
                    <Text style={styles.shopRowName}>{shop.name}</Text>
                    <Text style={styles.shopRowCity}>{shop.city}</Text>
                  </View>
                  {selected && <Ionicons name="checkmark-circle" size={20} color="#2D5016" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      ) : (
        <>
          <FieldLabel label="Criteria Value" required />
          <TextInput
            style={styles.input}
            value={form.criteria_value}
            onChangeText={(v) => set('criteria_value', v)}
            placeholder="e.g. 5"
            placeholderTextColor="#bbb"
            keyboardType="numeric"
          />
        </>
      )}

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
    </KeyboardAvoidingView>
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

  shopList: {
    borderWidth: 1,
    borderColor: '#e0ddd8',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 8,
  },
  shopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ebebeb',
  },
  shopRowSelected: { backgroundColor: '#eef4e8' },
  shopRowInfo: { flex: 1 },
  shopRowName: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  shopRowCity: { fontSize: 12, color: '#888', marginTop: 1 },

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
