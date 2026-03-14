import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminStackParamList } from '../../navigation/AdminNavigator';
import { fetchShopAdmins, assignShopAdmin, removeShopAdmin } from '../../lib/admin';
import { supabase } from '../../lib/supabase';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminShopAdmins'>;

export default function AdminShopAdminsScreen({ route }: Props) {
  const { shopId } = route.params;
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; username: string; display_name: string }[]>([]);
  const [searching, setSearching] = useState(false);

  const { data: admins = [], isLoading } = useQuery({
    queryKey: ['shopAdmins', shopId],
    queryFn: () => fetchShopAdmins(shopId),
  });

  const assign = useMutation({
    mutationFn: (userId: string) => assignShopAdmin(userId, shopId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shopAdmins', shopId] });
      setSearch('');
      setSearchResults([]);
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  const remove = useMutation({
    mutationFn: (userId: string) => removeShopAdmin(userId, shopId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopAdmins', shopId] }),
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  async function searchUsers(query: string) {
    setSearch(query);
    if (query.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .ilike('username', `%${query}%`)
      .limit(10);
    setSearchResults(data ?? []);
    setSearching(false);
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.sectionLabel}>Current Shop Admins</Text>
        {isLoading ? (
          <ActivityIndicator color="#2D5016" />
        ) : admins.length === 0 ? (
          <Text style={styles.empty}>No admins assigned to this shop.</Text>
        ) : (
          admins.map((admin) => (
            <View key={admin.userId} style={styles.adminRow}>
              <View style={styles.adminInfo}>
                <Text style={styles.adminName}>{admin.displayName}</Text>
                <Text style={styles.adminUsername}>@{admin.username}</Text>
              </View>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => Alert.alert('Remove Admin', `Remove ${admin.displayName} as shop admin?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Remove', style: 'destructive', onPress: () => remove.mutate(admin.userId) },
                ])}
              >
                <Text style={styles.removeBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Add Admin</Text>
        <TextInput
          style={styles.input}
          value={search}
          onChangeText={searchUsers}
          placeholder="Search by username..."
          placeholderTextColor="#bbb"
          autoCapitalize="none"
        />
        {searching && <ActivityIndicator color="#2D5016" style={{ marginTop: 8 }} />}
        {searchResults.map((user) => (
          <TouchableOpacity
            key={user.id}
            style={styles.searchRow}
            onPress={() => assign.mutate(user.id)}
          >
            <Text style={styles.searchName}>{user.display_name}</Text>
            <Text style={styles.searchUsername}>@{user.username}</Text>
            <Text style={styles.addText}>+ Add</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0ede8' },
  content: { padding: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  empty: { fontSize: 14, color: '#aaa', marginBottom: 12 },
  adminRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8 },
  adminInfo: { flex: 1 },
  adminName: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  adminUsername: { fontSize: 13, color: '#888', marginTop: 2 },
  removeBtn: { backgroundColor: '#fce4e4', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  removeBtnText: { fontSize: 13, fontWeight: '600', color: '#c0392b' },
  input: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e0ddd8', padding: 12, fontSize: 15, color: '#1a1a1a', marginBottom: 8 },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 6 },
  searchName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  searchUsername: { fontSize: 13, color: '#888', marginRight: 12 },
  addText: { fontSize: 13, fontWeight: '700', color: '#2D5016' },
});
