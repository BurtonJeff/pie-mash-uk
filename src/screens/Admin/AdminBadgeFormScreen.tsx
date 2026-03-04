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
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/AdminNavigator';
import { useAddBadge, useUpdateBadge, useAdminBadgeById, useAdminShops } from '../../hooks/useAdmin';
import { BadgeFormData } from '../../lib/admin';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminBadgeForm'>;

type CriteriaType = 'total_checkins' | 'unique_shops' | 'shop_tour';

const CRITERIA_OPTIONS: { type: CriteriaType; label: string }[] = [
  { type: 'total_checkins', label: 'Total Check-ins' },
  { type: 'unique_shops', label: 'Unique Shops' },
  { type: 'shop_tour', label: 'Shop Tour' },
];

export default function AdminBadgeFormScreen({ navigation, route }: Props) {
  const badgeId = route.params?.badgeId;
  const isEditing = !!badgeId;

  const addBadge = useAddBadge();
  const updateBadge = useUpdateBadge();
  const { data: existingBadge, isLoading: badgeLoading } = useAdminBadgeById(badgeId);
  const { data: allShops = [] } = useAdminShops();
  const [shopSearch, setShopSearch] = useState('');

  const [form, setForm] = useState<BadgeFormData>({
    name: '',
    description: '',
    icon_url: '',
    category: '',
    criteria_type: 'total_checkins',
    criteria_value: '',
    criteria_shops: [],
  });

  useLayoutEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Edit Badge' : 'Add Badge' });
  }, [navigation, isEditing]);

  useEffect(() => {
    if (existingBadge) {
      setForm({
        name: existingBadge.name,
        description: existingBadge.description,
        icon_url: existingBadge.icon_url,
        category: existingBadge.category,
        criteria_type: existingBadge.criteria_type as CriteriaType,
        criteria_value: existingBadge.criteria_value.toString(),
        criteria_shops: existingBadge.criteria_shops ?? [],
      });
    }
  }, [existingBadge]);

  const set = (key: keyof BadgeFormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validate = (): string | null => {
    if (!form.name.trim()) return 'Name is required.';
    if (!form.description.trim()) return 'Description is required.';
    if (!form.icon_url.trim()) return 'Icon URL / emoji is required.';
    if (!form.category.trim()) return 'Category is required.';
    if (form.criteria_type === 'shop_tour') {
      if (form.criteria_shops.length === 0) return 'Select at least one shop for the tour.';
    } else {
      const val = parseInt(form.criteria_value, 10);
      if (isNaN(val) || val <= 0) return 'Criteria value must be a positive number.';
    }
    return null;
  };

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

  const handleSubmit = () => {
    const err = validate();
    if (err) {
      Alert.alert('Validation Error', err);
      return;
    }

    if (isEditing) {
      updateBadge.mutate({ badgeId, data: form }, {
        onSuccess: () => {
          Alert.alert('Success', `Badge "${form.name}" has been updated.`, [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        },
        onError: (e: any) => {
          Alert.alert('Error', e.message ?? 'Could not update badge. Please try again.');
        },
      });
    } else {
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
    }
  };

  const isPending = addBadge.isPending || updateBadge.isPending;

  if (isEditing && badgeLoading) {
    return <ActivityIndicator size="large" color="#2D5016" style={styles.loader} />;
  }

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

      {form.criteria_type === 'shop_tour' ? (
        <>
          <FieldLabel label={`Shops to Visit (${form.criteria_shops.length} selected)`} required />
          <TextInput
            style={styles.input}
            value={shopSearch}
            onChangeText={setShopSearch}
            placeholder="Search shops…"
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
            placeholder="e.g. 10"
            placeholderTextColor="#bbb"
            keyboardType="numeric"
          />
        </>
      )}

      <TouchableOpacity
        style={[styles.submitButton, isPending && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isPending}
      >
        {isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>
            {isEditing ? 'Save Changes' : 'Add Badge'}
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
    marginTop: 28,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
