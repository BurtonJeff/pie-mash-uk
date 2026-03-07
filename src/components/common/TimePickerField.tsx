import React, { useState } from 'react';
import {
  TouchableOpacity, Text, StyleSheet, Platform, Modal, View,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  /** HH:MM string, or empty string if nothing selected yet. */
  value: string;
  onChange: (time: string) => void;
  placeholder?: string;
  hasError?: boolean;
}

/** Parse "HH:MM" into a Date (today's date, with that time). */
function timeStringToDate(time: string): Date {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(isNaN(h) ? 12 : h, isNaN(m) ? 0 : m, 0, 0);
  return d;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function TimePickerField({
  value,
  onChange,
  placeholder = 'Select a time',
  hasError,
}: Props) {
  const [show, setShow] = useState(false);
  const pickerValue = value ? timeStringToDate(value) : (() => { const d = new Date(); d.setMinutes(0, 0, 0); return d; })();

  function handleChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') {
      setShow(false);
      if (event.type === 'set' && date) onChange(formatTime(date));
    } else {
      if (date) onChange(formatTime(date));
    }
  }

  const fieldStyle = [styles.field, hasError && styles.fieldError];

  if (Platform.OS === 'ios') {
    return (
      <>
        <TouchableOpacity style={fieldStyle} onPress={() => setShow(true)} activeOpacity={0.7}>
          <Ionicons name="time-outline" size={16} color="#888" style={styles.icon} />
          <Text style={value ? styles.value : styles.placeholder}>
            {value || placeholder}
          </Text>
        </TouchableOpacity>

        <Modal visible={show} transparent animationType="slide" onRequestClose={() => setShow(false)}>
          <TouchableOpacity style={styles.iosOverlay} activeOpacity={1} onPress={() => setShow(false)} />
          <View style={styles.iosSheet}>
            <View style={styles.iosToolbar}>
              <Text style={styles.iosTitle}>Select Time</Text>
              <TouchableOpacity onPress={() => setShow(false)} style={styles.iosDoneBtn}>
                <Text style={styles.iosDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={pickerValue}
              mode="time"
              display="spinner"
              is24Hour
              onChange={handleChange}
              style={styles.iosPicker}
            />
          </View>
        </Modal>
      </>
    );
  }

  // Android
  return (
    <>
      <TouchableOpacity style={fieldStyle} onPress={() => setShow(true)} activeOpacity={0.7}>
        <Ionicons name="time-outline" size={16} color="#888" style={styles.icon} />
        <Text style={value ? styles.value : styles.placeholder}>
          {value || placeholder}
        </Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={pickerValue}
          mode="time"
          display="default"
          is24Hour
          onChange={handleChange}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  fieldError: {
    borderColor: '#c0392b',
  },
  icon: { marginRight: 8 },
  value: { fontSize: 15, color: '#1a1a1a' },
  placeholder: { fontSize: 15, color: '#bbb' },

  iosOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  iosSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 32,
  },
  iosToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  iosTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  iosDoneBtn: { padding: 4 },
  iosDone: { fontSize: 16, fontWeight: '700', color: '#2D5016' },
  iosPicker: { height: 200 },
});
