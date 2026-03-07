import React from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMeetupRsvps } from '../../hooks/useCommunity';

interface Props {
  meetupId: string | null;
  shopName: string;
  onClose: () => void;
}

export default function AttendeesModal({ meetupId, shopName, onClose }: Props) {
  const { data: attendees = [], isLoading } = useMeetupRsvps(meetupId);

  return (
    <Modal
      visible={!!meetupId}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>Going to {shopName}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={22} color="#555" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator color="#2D5016" style={styles.loader} />
        ) : attendees.length === 0 ? (
          <Text style={styles.empty}>No one has joined yet.</Text>
        ) : (
          <FlatList
            data={attendees}
            keyExtractor={(a) => a.userId}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <View style={styles.avatar}>
                  {item.avatarUrl ? (
                    <Image source={{ uri: item.avatarUrl }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>
                      {item.displayName.trim().slice(0, 2).toUpperCase()}
                    </Text>
                  )}
                </View>
                <Text style={styles.name}>{item.displayName}</Text>
              </View>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  title: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', flex: 1, marginRight: 8 },
  loader: { marginTop: 32 },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 32, fontSize: 14 },
  list: { paddingHorizontal: 20, paddingTop: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eef4e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: { width: 36, height: 36, borderRadius: 18 },
  avatarText: { fontSize: 13, fontWeight: '700', color: '#2D5016' },
  name: { fontSize: 15, color: '#1a1a1a' },
});
