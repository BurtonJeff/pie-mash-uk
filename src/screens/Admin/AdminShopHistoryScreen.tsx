import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminStackParamList } from '../../navigation/AdminNavigator';
import { fetchShopAuditLog, revertShopToAuditVersion, ShopAuditEntry } from '../../lib/admin';
import { timeAgo } from '../../utils/dateUtils';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminShopHistory'>;

export default function AdminShopHistoryScreen({ route }: Props) {
  const { shopId } = route.params;
  const qc = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['shopAuditLog', shopId],
    queryFn: () => fetchShopAuditLog(shopId),
  });

  const revert = useMutation({
    mutationFn: (previousData: Record<string, any>) => revertShopToAuditVersion(shopId, previousData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminShop', shopId] });
      qc.invalidateQueries({ queryKey: ['shopAuditLog', shopId] });
      Alert.alert('Reverted', 'The shop has been reverted to the selected version.');
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  function changedFields(entry: ShopAuditEntry): string[] {
    return Object.keys(entry.newData).filter(
      (k) => JSON.stringify(entry.previousData[k]) !== JSON.stringify(entry.newData[k]),
    );
  }

  function confirmRevert(entry: ShopAuditEntry) {
    Alert.alert(
      'Revert to this version?',
      `This will restore the shop data from ${timeAgo(entry.changedAt)}. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Revert', style: 'destructive', onPress: () => revert.mutate(entry.previousData) },
      ],
    );
  }

  if (isLoading) {
    return <ActivityIndicator size="large" color="#2D5016" style={styles.loader} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={entries}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.content}
        renderItem={({ item }: { item: ShopAuditEntry }) => {
          const changed = changedFields(item);
          return (
            <View style={styles.entry}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryTime}>{timeAgo(item.changedAt)}</Text>
                {item.changedByUsername && (
                  <Text style={styles.entryUser}>by @{item.changedByUsername}</Text>
                )}
              </View>
              {changed.length > 0 && (
                <Text style={styles.entryFields}>Changed: {changed.join(', ')}</Text>
              )}
              <TouchableOpacity
                style={styles.revertBtn}
                onPress={() => confirmRevert(item)}
                disabled={revert.isPending}
              >
                <Text style={styles.revertBtnText}>Revert to this version</Text>
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>No history found for this shop.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0ede8' },
  loader: { flex: 1, marginTop: 80 },
  content: { padding: 16 },
  entry: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  entryTime: { fontSize: 13, fontWeight: '700', color: '#1a1a1a' },
  entryUser: { fontSize: 12, color: '#888' },
  entryFields: { fontSize: 13, color: '#555', marginBottom: 10, lineHeight: 18 },
  revertBtn: {
    backgroundColor: '#fce4e4', borderRadius: 8, paddingVertical: 8, alignItems: 'center',
  },
  revertBtnText: { fontSize: 13, fontWeight: '700', color: '#c0392b' },
  empty: { textAlign: 'center', color: '#aaa', fontSize: 14, marginTop: 40 },
});
