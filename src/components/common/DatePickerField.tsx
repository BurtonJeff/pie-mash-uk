import React, { useState } from 'react';
import {
  TouchableOpacity, Text, StyleSheet, Platform, Modal, View,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
  minimumDate?: Date;
  hasError?: boolean;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const today = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export default function DatePickerField({
  value,
  onChange,
  placeholder = 'Select a date',
  minimumDate,
  hasError,
}: Props) {
  const [show, setShow] = useState(false);
  const minDate = minimumDate ?? today();

  function handleChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') {
      setShow(false);
      if (event.type === 'set' && date) onChange(date);
    } else {
      if (date) onChange(date);
    }
  }

  const fieldStyle = [styles.field, hasError && styles.fieldError];

  if (Platform.OS === 'ios') {
    return (
      <>
        <TouchableOpacity style={fieldStyle} onPress={() => setShow(true)} activeOpacity={0.7}>
          <Ionicons name="calendar-outline" size={16} color="#888" style={styles.icon} />
          <Text style={value ? styles.value : styles.placeholder}>
            {value ? formatDate(value) : placeholder}
          </Text>
        </TouchableOpacity>

        <Modal visible={show} transparent animationType="slide" onRequestClose={() => setShow(false)}>
          <TouchableOpacity style={styles.iosOverlay} activeOpacity={1} onPress={() => setShow(false)} />
          <View style={styles.iosSheet}>
            <View style={styles.iosToolbar}>
              <Text style={styles.iosTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setShow(false)} style={styles.iosDoneBtn}>
                <Text style={styles.iosDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={value ?? minDate}
              mode="date"
              display="spinner"
              minimumDate={minDate}
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
        <Ionicons name="calendar-outline" size={16} color="#888" style={styles.icon} />
        <Text style={value ? styles.value : styles.placeholder}>
          {value ? formatDate(value) : placeholder}
        </Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={value ?? minDate}
          mode="date"
          display="default"
          minimumDate={minDate}
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
