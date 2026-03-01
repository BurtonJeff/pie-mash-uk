import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/AdminNavigator';
import { useAddShop } from '../../hooks/useAdmin';
import { ShopFormData } from '../../lib/admin';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminShopForm'>;

export default function AdminShopFormScreen({ navigation }: Props) {
  const addShop = useAddShop();

  const [form, setForm] = useState<ShopFormData>({
    name: '',
    description: '',
    address_line1: '',
    address_line2: '',
    city: '',
    postcode: '',
    phone: '',
    website: '',
    latitude: '',
    longitude: '',
    price_range: 1,
    features: { is_takeaway: false, has_seating: false, has_parking: false },
  });

  const set = (key: keyof ShopFormData, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setFeature = (key: keyof ShopFormData['features'], value: boolean) =>
    setForm((prev) => ({
      ...prev,
      features: { ...prev.features, [key]: value },
    }));

  const validate = (): string | null => {
    if (!form.name.trim()) return 'Name is required.';
    if (!form.address_line1.trim()) return 'Address Line 1 is required.';
    if (!form.city.trim()) return 'City is required.';
    if (!form.postcode.trim()) return 'Postcode is required.';
    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) return 'Latitude must be a valid number between -90 and 90.';
    if (isNaN(lng) || lng < -180 || lng > 180) return 'Longitude must be a valid number between -180 and 180.';
    return null;
  };

  const handleSubmit = () => {
    const err = validate();
    if (err) {
      Alert.alert('Validation Error', err);
      return;
    }

    addShop.mutate(form, {
      onSuccess: () => {
        Alert.alert('Success', `"${form.name}" has been added.`, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      },
      onError: (e: any) => {
        Alert.alert('Error', e.message ?? 'Could not add shop. Please try again.');
      },
    });
  };

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
        placeholder="e.g. M. Manze"
        placeholderTextColor="#bbb"
      />

      <FieldLabel label="Description" />
      <TextInput
        style={[styles.input, styles.multiline]}
        value={form.description}
        onChangeText={(v) => set('description', v)}
        placeholder="A short description of the shop"
        placeholderTextColor="#bbb"
        multiline
        numberOfLines={3}
      />

      <FieldLabel label="Address Line 1" required />
      <TextInput
        style={styles.input}
        value={form.address_line1}
        onChangeText={(v) => set('address_line1', v)}
        placeholder="e.g. 87 Tower Bridge Road"
        placeholderTextColor="#bbb"
      />

      <FieldLabel label="Address Line 2" />
      <TextInput
        style={styles.input}
        value={form.address_line2}
        onChangeText={(v) => set('address_line2', v)}
        placeholder="Optional"
        placeholderTextColor="#bbb"
      />

      <FieldLabel label="City" required />
      <TextInput
        style={styles.input}
        value={form.city}
        onChangeText={(v) => set('city', v)}
        placeholder="e.g. London"
        placeholderTextColor="#bbb"
      />

      <FieldLabel label="Postcode" required />
      <TextInput
        style={styles.input}
        value={form.postcode}
        onChangeText={(v) => set('postcode', v)}
        placeholder="e.g. SE1 4TH"
        placeholderTextColor="#bbb"
        autoCapitalize="characters"
      />

      <FieldLabel label="Phone" />
      <TextInput
        style={styles.input}
        value={form.phone}
        onChangeText={(v) => set('phone', v)}
        placeholder="e.g. 020 7407 2985"
        placeholderTextColor="#bbb"
        keyboardType="phone-pad"
      />

      <FieldLabel label="Website" />
      <TextInput
        style={styles.input}
        value={form.website}
        onChangeText={(v) => set('website', v)}
        placeholder="e.g. https://mmanze.co.uk"
        placeholderTextColor="#bbb"
        keyboardType="url"
        autoCapitalize="none"
      />

      <FieldLabel label="Latitude" required />
      <TextInput
        style={styles.input}
        value={form.latitude}
        onChangeText={(v) => set('latitude', v)}
        placeholder="e.g. 51.4994"
        placeholderTextColor="#bbb"
        keyboardType="numeric"
      />

      <FieldLabel label="Longitude" required />
      <TextInput
        style={styles.input}
        value={form.longitude}
        onChangeText={(v) => set('longitude', v)}
        placeholder="e.g. -0.0789"
        placeholderTextColor="#bbb"
        keyboardType="numeric"
      />

      <FieldLabel label="Features" />
      <View style={styles.switchGroup}>
        <SwitchRow
          label="Takeaway"
          value={form.features.is_takeaway}
          onValueChange={(v) => setFeature('is_takeaway', v)}
        />
        <View style={styles.switchSep} />
        <SwitchRow
          label="Seating"
          value={form.features.has_seating}
          onValueChange={(v) => setFeature('has_seating', v)}
        />
        <View style={styles.switchSep} />
        <SwitchRow
          label="Parking"
          value={form.features.has_parking}
          onValueChange={(v) => setFeature('has_parking', v)}
        />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, addShop.isPending && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={addShop.isPending}
      >
        {addShop.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Add Shop</Text>
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

function SwitchRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <Text style={styles.switchLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#ddd', true: '#2D5016' }}
        thumbColor="#fff"
      />
    </View>
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

  switchGroup: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0ddd8',
    overflow: 'hidden',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  switchLabel: { fontSize: 15, color: '#1a1a1a' },
  switchSep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e8e8e8',
    marginLeft: 14,
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
