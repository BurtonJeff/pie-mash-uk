import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  onClose: () => void;
}

// NOTE: In-app purchases (react-native-iap) require a development build and
// are not compatible with Expo Go. This is a placeholder until we set up EAS.
export default function TipJarModal({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="close" size={22} color="#888" />
        </TouchableOpacity>
        <Text style={styles.title}>Support the App</Text>
        <Text style={styles.subtitle}>
          Pie & Mash is free and always will be. If you'd like to help cover hosting
          costs, a small tip is very much appreciated.
        </Text>
        <View style={styles.unavailable}>
          <Ionicons name="storefront-outline" size={32} color="#ccc" />
          <Text style={styles.unavailableText}>Tip jar coming soon</Text>
          <Text style={styles.unavailableSubtext}>
            In-app purchases are not yet available. Check back in a future update!
          </Text>
        </View>
        <Text style={styles.legal}>
          Purchases are processed by Apple / Google and are non-refundable.
        </Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  closeBtn: { alignSelf: 'flex-end', padding: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#1a1a1a', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#555', lineHeight: 20, marginBottom: 24 },
  unavailable: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  unavailableText: { fontSize: 16, fontWeight: '600', color: '#aaa', marginTop: 4 },
  unavailableSubtext: { fontSize: 13, color: '#bbb', textAlign: 'center', lineHeight: 18 },
  legal: { fontSize: 11, color: '#bbb', textAlign: 'center', lineHeight: 16, marginTop: 16 },
});
