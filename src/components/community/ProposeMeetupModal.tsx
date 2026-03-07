import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { fetchShops, ShopWithPhoto } from '../../lib/shops';
import { validateMeetupTime, Meetup } from '../../lib/meetups';
import DatePickerField from '../common/DatePickerField';
import TimePickerField from '../common/TimePickerField';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (params: {
    shopId: string;
    meetupDate: string;
    meetupTime: string;
    description?: string;
    maxAttendees?: number;
  }) => Promise<void>;
  editingMeetup?: Meetup;
}

type Step = 'shop' | 'details';

export default function ProposeMeetupModal({ visible, onClose, onSubmit, editingMeetup }: Props) {
  const isEditing = !!editingMeetup;
  const [step, setStep] = useState<Step>(isEditing ? 'details' : 'shop');
  const [search, setSearch] = useState('');
  const [selectedShop, setSelectedShop] = useState<ShopWithPhoto | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timeInput, setTimeInput] = useState('');
  const [description, setDescription] = useState('');
  const [maxAttendees, setMaxAttendees] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dateError, setDateError] = useState('');
  const [timeError, setTimeError] = useState('');
  const [hoursWarning, setHoursWarning] = useState('');

  const { data: shops = [], isLoading: shopsLoading } = useQuery({
    queryKey: ['allShops'],
    queryFn: () => fetchShops(),
    staleTime: 300000,
    enabled: visible,
  });

  // In edit mode: pre-fill form and auto-select the shop once shops load
  useEffect(() => {
    if (!editingMeetup || !visible) return;
    setStep('details');
    const [y, m, d] = editingMeetup.meetupDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    setSelectedDate(dateObj);
    setTimeInput(editingMeetup.meetupTime);
    setDescription(editingMeetup.description ?? '');
    setMaxAttendees(editingMeetup.maxAttendees?.toString() ?? '');
  }, [editingMeetup, visible]);

  useEffect(() => {
    if (!editingMeetup || !shops.length || selectedShop) return;
    const shop = shops.find((s) => s.id === editingMeetup.shopId);
    if (shop) setSelectedShop(shop);
  }, [editingMeetup, shops]);

  const filteredShops = search.trim()
    ? shops.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.city.toLowerCase().includes(search.toLowerCase()),
      )
    : shops;

  function reset() {
    setStep('shop');
    setSearch('');
    setSelectedShop(null);
    setSelectedDate(null);
    setTimeInput('');
    setDescription('');
    setMaxAttendees('');
    setDateError('');
    setTimeError('');
    setHoursWarning('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  function selectShop(shop: ShopWithPhoto) {
    setSelectedShop(shop);
    setStep('details');
    setHoursWarning('');
  }

  function toISODate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function checkHours(date: Date | null, time: string) {
    if (!date || !time || !selectedShop) { setHoursWarning(''); return; }
    const warn = validateMeetupTime(
      selectedShop.opening_hours as Record<string, any>,
      toISODate(date),
      time,
    );
    setHoursWarning(warn ?? '');
  }

  function handleDateChange(date: Date) {
    setSelectedDate(date);
    setDateError('');
    checkHours(date, timeInput);
  }

  function handleTimeChange(val: string) {
    setTimeInput(val);
    setTimeError('');
    checkHours(selectedDate, val);
  }

  async function handleSubmit() {
    let hasError = false;
    if (!selectedDate) { setDateError('Please select a date.'); hasError = true; }
    if (!timeInput) { setTimeError('Please select a time.'); hasError = true; }
    if (hasError) return;
    if (!selectedShop) return;

    const isoDate = toISODate(selectedDate!);
    const hoursErr = validateMeetupTime(
      selectedShop.opening_hours as Record<string, any>,
      isoDate,
      timeInput,
    );
    if (hoursErr) {
      Alert.alert('Shop may be closed', `${hoursErr}. Do you still want to propose this meatup?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Propose anyway', onPress: () => doSubmit(isoDate, timeInput) },
      ]);
      return;
    }

    doSubmit(isoDate, timeInput);
  }

  async function doSubmit(meetupDate: string, meetupTime: string) {
    setSubmitting(true);
    try {
      const maxNum = maxAttendees.trim() ? parseInt(maxAttendees, 10) : undefined;
      await onSubmit({
        shopId: selectedShop!.id,
        meetupDate,
        meetupTime,
        description: description.trim() || undefined,
        maxAttendees: maxNum && !isNaN(maxNum) && maxNum > 0 ? maxNum : undefined,
      });
      reset();
      onClose();
    } catch (e: any) {
      Alert.alert('Failed to propose meatup', e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            {step === 'details' ? (
              <TouchableOpacity onPress={() => setStep('shop')} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={22} color="#2D5016" />
              </TouchableOpacity>
            ) : (
              <View style={styles.backBtn} />
            )}
            <Text style={styles.title}>
              {isEditing ? 'Edit Meatup' : step === 'shop' ? 'Select a Shop' : 'Meatup Details'}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#555" />
            </TouchableOpacity>
          </View>

          {/* ── Step 1: Shop Picker ── */}
          {step === 'shop' && (
            <>
              <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={16} color="#aaa" />
                <TextInput
                  style={styles.searchInput}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search shops or cities…"
                  autoCorrect={false}
                />
              </View>
              {shopsLoading ? (
                <ActivityIndicator style={{ marginTop: 40 }} color="#2D5016" />
              ) : (
                <FlatList
                  data={filteredShops}
                  keyExtractor={(s) => s.id}
                  contentContainerStyle={styles.shopList}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.shopRow} onPress={() => selectShop(item)}>
                      <View style={styles.shopRowInfo}>
                        <Text style={styles.shopRowName}>{item.name}</Text>
                        <Text style={styles.shopRowCity}>{item.city}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#ccc" />
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={<Text style={styles.empty}>No shops found.</Text>}
                />
              )}
            </>
          )}

          {/* ── Step 2: Details Form ── */}
          {step === 'details' && selectedShop && (
            <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
              {/* Selected shop */}
              <View style={styles.selectedShop}>
                <Ionicons name="storefront-outline" size={16} color="#2D5016" />
                <Text style={styles.selectedShopName}>{selectedShop.name}, {selectedShop.city}</Text>
              </View>

              <Text style={styles.label}>Date <Text style={styles.required}>*</Text></Text>
              <DatePickerField
                value={selectedDate}
                onChange={handleDateChange}
                placeholder="Select a date"
                hasError={!!dateError}
              />
              {dateError ? <Text style={styles.errorText}>{dateError}</Text> : null}

              <Text style={styles.label}>Time <Text style={styles.required}>*</Text></Text>
              <TimePickerField
                value={timeInput}
                onChange={handleTimeChange}
                placeholder="Select a time"
                hasError={!!timeError}
              />
              {timeError ? <Text style={styles.errorText}>{timeError}</Text> : null}

              {hoursWarning ? (
                <View style={styles.warningBox}>
                  <Ionicons name="warning-outline" size={14} color="#b45309" />
                  <Text style={styles.warningText}>{hoursWarning}</Text>
                </View>
              ) : selectedDate && timeInput && !dateError && !timeError ? (
                <View style={styles.okBox}>
                  <Ionicons name="checkmark-circle-outline" size={14} color="#2D5016" />
                  <Text style={styles.okText}>Shop should be open</Text>
                </View>
              ) : null}

              <Text style={styles.label}>Description (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Add a note about the meatup…"
                multiline
                numberOfLines={3}
                maxLength={300}
                textAlignVertical="top"
              />

              <Text style={styles.label}>Max Attendees (optional)</Text>
              <TextInput
                style={styles.input}
                value={maxAttendees}
                onChangeText={setMaxAttendees}
                placeholder="Leave blank for unlimited"
                keyboardType="number-pad"
                maxLength={4}
              />

              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.submitBtnText}>{isEditing ? 'Save Changes' : 'Propose Meatup'}</Text>
                }
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f5f0' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  backBtn: { width: 32 },
  closeBtn: { width: 32, alignItems: 'flex-end' },
  title: { fontSize: 17, fontWeight: '700', color: '#1a1a1a' },

  // Shop picker
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', margin: 12, borderRadius: 10,
    borderWidth: 1, borderColor: '#e0e0e0', paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 15 },
  shopList: { paddingHorizontal: 12, paddingBottom: 32 },
  shopRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3, elevation: 1,
  },
  shopRowInfo: { flex: 1 },
  shopRowName: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  shopRowCity: { fontSize: 13, color: '#888', marginTop: 2 },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40 },

  // Details form
  form: { padding: 20, paddingBottom: 48 },
  selectedShop: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#eef4e8', borderRadius: 10, padding: 12, marginBottom: 20,
  },
  selectedShopName: { fontSize: 14, fontWeight: '600', color: '#2D5016', flex: 1 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 16 },
  required: { color: '#c0392b' },
  input: {
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1,
    borderColor: '#e0e0e0', paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
  },
  inputError: { borderColor: '#c0392b' },
  textArea: { minHeight: 80 },
  errorText: { fontSize: 12, color: '#c0392b', marginTop: 4 },
  warningBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff3cd', borderRadius: 8, padding: 10, marginTop: 8,
  },
  warningText: { fontSize: 12, color: '#b45309', flex: 1 },
  okBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#eef4e8', borderRadius: 8, padding: 10, marginTop: 8,
  },
  okText: { fontSize: 12, color: '#2D5016' },
  submitBtn: {
    backgroundColor: '#2D5016', borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 28,
  },
  submitBtnDisabled: { backgroundColor: '#aaa' },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
