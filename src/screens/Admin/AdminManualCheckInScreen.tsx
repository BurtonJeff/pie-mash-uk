import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, FlatList, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AdminStackParamList } from '../../navigation/AdminNavigator';
import { useAdminUsers } from '../../hooks/useAdmin';
import { useAdminCreateCheckIn } from '../../hooks/useAdmin';
import { useAdminShops } from '../../hooks/useAdmin';
import { AdminUser } from '../../lib/admin';
import { AdminShop } from '../../lib/admin';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminManualCheckIn'>;

type Step = 'user' | 'shop' | 'datetime';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

function shopHoursHint(shop: AdminShop, date: Date): string {
  const dayKey = DAYS[date.getDay()];
  const hours = (shop.opening_hours as any)?.[dayKey];
  if (!hours) return '';
  if (hours.closed) return `Closed on ${dayKey.charAt(0).toUpperCase() + dayKey.slice(1)}s`;
  return `Open ${hours.open} – ${hours.close} on ${dayKey.charAt(0).toUpperCase() + dayKey.slice(1)}s`;
}

export default function AdminManualCheckInScreen({ navigation }: Props) {
  const { data: users = [], isLoading: usersLoading } = useAdminUsers();
  const { data: shops = [], isLoading: shopsLoading } = useAdminShops();
  const mutation = useAdminCreateCheckIn();

  const [step, setStep] = useState<Step>('user');
  const [userSearch, setUserSearch] = useState('');
  const [shopSearch, setShopSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedShop, setSelectedShop] = useState<AdminShop | null>(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.display_name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q),
    );
  }, [users, userSearch]);

  const filteredShops = useMemo(() => {
    const q = shopSearch.trim().toLowerCase();
    if (!q) return shops;
    return shops.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.postcode.toLowerCase().includes(q),
    );
  }, [shops, shopSearch]);

  function confirmSubmit() {
    if (!selectedUser || !selectedShop) return;
    const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    Alert.alert(
      'Confirm Check-In',
      `Check in ${selectedUser.display_name} at ${selectedShop.name} on ${dateStr} at ${timeStr}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            mutation.mutate(
              { targetUserId: selectedUser.id, shopId: selectedShop.id, checkedInAt: date },
              {
                onSuccess: () => {
                  Alert.alert('Done', 'Check-in recorded successfully.', [
                    { text: 'OK', onPress: () => navigation.goBack() },
                  ]);
                },
                onError: (e: any) => Alert.alert('Error', e.message ?? 'Could not create check-in.'),
              },
            );
          },
        },
      ],
    );
  }

  // ── Step: Select user ──────────────────────────────────────────────────────
  if (step === 'user') {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.header}>
          <Text style={styles.stepLabel}>Step 1 of 3</Text>
          <Text style={styles.stepTitle}>Select User</Text>
          <TextInput
            style={styles.search}
            placeholder="Search by name or username…"
            value={userSearch}
            onChangeText={setUserSearch}
            clearButtonMode="while-editing"
            autoFocus
          />
        </View>
        {usersLoading ? (
          <ActivityIndicator style={styles.loader} color="#2D5016" />
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(u) => u.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.row}
                onPress={() => { setSelectedUser(item); setStep('shop'); }}
              >
                <View style={styles.rowInfo}>
                  <Text style={styles.rowTitle}>{item.display_name}</Text>
                  <Text style={styles.rowSub}>@{item.username}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#ccc" />
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.empty}>No users found.</Text>}
          />
        )}
      </SafeAreaView>
    );
  }

  // ── Step: Select shop ──────────────────────────────────────────────────────
  if (step === 'shop') {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('user')} style={styles.back}>
            <Text style={styles.backText}>← {selectedUser?.display_name}</Text>
          </TouchableOpacity>
          <Text style={styles.stepLabel}>Step 2 of 3</Text>
          <Text style={styles.stepTitle}>Select Shop</Text>
          <TextInput
            style={styles.search}
            placeholder="Search by name, town, postcode…"
            value={shopSearch}
            onChangeText={setShopSearch}
            clearButtonMode="while-editing"
            autoFocus
          />
        </View>
        {shopsLoading ? (
          <ActivityIndicator style={styles.loader} color="#2D5016" />
        ) : (
          <FlatList
            data={filteredShops}
            keyExtractor={(s) => s.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.row}
                onPress={() => { setSelectedShop(item); setStep('datetime'); }}
              >
                <View style={styles.rowInfo}>
                  <Text style={styles.rowTitle}>{item.name}</Text>
                  <Text style={styles.rowSub}>{item.city} · {item.postcode}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#ccc" />
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.empty}>No shops found.</Text>}
          />
        )}
      </SafeAreaView>
    );
  }

  // ── Step: Date & time ──────────────────────────────────────────────────────
  const hoursHint = selectedShop ? shopHoursHint(selectedShop, date) : '';
  const hoursIsClosed = hoursHint.startsWith('Closed');

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.datetimeScroll}>
        <TouchableOpacity onPress={() => setStep('shop')} style={styles.back}>
          <Text style={styles.backText}>← {selectedShop?.name}</Text>
        </TouchableOpacity>
        <Text style={styles.stepLabel}>Step 3 of 3</Text>
        <Text style={styles.stepTitle}>Date & Time</Text>

        {/* Summary card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Ionicons name="person-outline" size={16} color="#555" />
            <Text style={styles.summaryText}>{selectedUser?.display_name}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="storefront-outline" size={16} color="#555" />
            <Text style={styles.summaryText}>{selectedShop?.name}</Text>
          </View>
        </View>

        {/* Date picker */}
        <Text style={styles.fieldLabel}>Date</Text>
        <TouchableOpacity style={styles.pickerButton} onPress={() => setShowDatePicker(true)}>
          <Ionicons name="calendar-outline" size={18} color="#2D5016" />
          <Text style={styles.pickerButtonText}>
            {date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            maximumDate={new Date()}
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={(_, selected) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selected) {
                const updated = new Date(date);
                updated.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
                setDate(updated);
              }
            }}
          />
        )}

        {/* Time picker */}
        <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Time</Text>
        <TouchableOpacity style={styles.pickerButton} onPress={() => setShowTimePicker(true)}>
          <Ionicons name="time-outline" size={18} color="#2D5016" />
          <Text style={styles.pickerButtonText}>
            {date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>
        {showTimePicker && (
          <DateTimePicker
            value={date}
            mode="time"
            is24Hour
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, selected) => {
              setShowTimePicker(Platform.OS === 'ios');
              if (selected) {
                const updated = new Date(date);
                updated.setHours(selected.getHours(), selected.getMinutes());
                setDate(updated);
              }
            }}
          />
        )}

        {/* Opening hours hint */}
        {hoursHint ? (
          <View style={[styles.hoursHint, hoursIsClosed && styles.hoursHintClosed]}>
            <Ionicons
              name={hoursIsClosed ? 'warning-outline' : 'information-circle-outline'}
              size={16}
              color={hoursIsClosed ? '#b45309' : '#2D5016'}
            />
            <Text style={[styles.hoursHintText, hoursIsClosed && styles.hoursHintTextClosed]}>
              {hoursHint}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.submitButton, mutation.isPending && styles.submitButtonDisabled]}
          onPress={confirmSubmit}
          disabled={mutation.isPending}
        >
          {mutation.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitText}>Record Check-In</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0ede8' },

  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  back: { marginBottom: 8 },
  backText: { color: '#2D5016', fontSize: 14, fontWeight: '600' },
  stepLabel: { fontSize: 11, fontWeight: '600', color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  stepTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a1a', marginBottom: 12 },
  search: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0ddd8',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },

  loader: { marginTop: 60 },
  list: { padding: 16, paddingTop: 8, paddingBottom: 40 },
  empty: { textAlign: 'center', color: '#aaa', fontSize: 15, marginTop: 40 },

  row: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  rowInfo: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  rowSub: { fontSize: 12, color: '#888', marginTop: 2 },

  datetimeScroll: { padding: 20, paddingBottom: 48 },

  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryText: { fontSize: 14, color: '#1a1a1a', fontWeight: '500' },

  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },

  pickerButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0ddd8',
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pickerButtonText: { fontSize: 15, color: '#1a1a1a', flex: 1 },

  hoursHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eef4e8',
    borderRadius: 8,
    padding: 10,
    marginTop: 16,
  },
  hoursHintClosed: { backgroundColor: '#fff8e1' },
  hoursHintText: { fontSize: 13, color: '#2D5016', flex: 1 },
  hoursHintTextClosed: { color: '#b45309' },

  submitButton: {
    backgroundColor: '#2D5016',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 32,
  },
  submitButtonDisabled: { backgroundColor: '#aaa' },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
