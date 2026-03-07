import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/AdminNavigator';
import { useAdminUsers, useSetUserActive } from '../../hooks/useAdmin';
import { useAuthStore } from '../../store/authStore';
import { AdminUser } from '../../lib/admin';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminUsers'>;

export default function AdminUsersScreen(_: Props) {
  const { user: currentUser } = useAuthStore();
  const { data: users = [], isLoading } = useAdminUsers();
  const toggleActive = useSetUserActive();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const filtered = useMemo(() => {
    let result = users;
    if (statusFilter === 'active') result = result.filter((u) => u.is_active);
    if (statusFilter === 'inactive') result = result.filter((u) => !u.is_active);
    const q = search.trim().toLowerCase();
    if (q) result = result.filter(
      (u) =>
        u.display_name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q),
    );
    return result;
  }, [users, search, statusFilter]);

  function confirmToggle(user: AdminUser) {
    const action = user.is_active ? 'Deactivate' : 'Reactivate';
    const message = user.is_active
      ? `Deactivating "${user.display_name}" will sign them out and prevent them from using the app.`
      : `Reactivating "${user.display_name}" will restore their access to the app.`;

    Alert.alert(action, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: action,
        style: user.is_active ? 'destructive' : 'default',
        onPress: () => toggleActive.mutate(
          { userId: user.id, active: !user.is_active },
          {
            onError: (e: any) =>
              Alert.alert('Error', e.message ?? 'Could not update user.'),
          },
        ),
      },
    ]);
  }

  if (isLoading) {
    return <ActivityIndicator size="large" color="#2D5016" style={styles.loader} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Search by name or username…"
          placeholderTextColor="#bbb"
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
        <View style={styles.filterRow}>
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, statusFilter === f && styles.filterBtnActive]}
              onPress={() => setStatusFilter(f)}
            >
              <Text style={[styles.filterBtnText, statusFilter === f && styles.filterBtnTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(u) => u.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.empty}>No users match your search.</Text>
        }
        renderItem={({ item }) => (
          <UserCard
            user={item}
            isSelf={item.id === currentUser?.id}
            onToggle={() => confirmToggle(item)}
            isPending={toggleActive.isPending}
          />
        )}
      />
    </View>
  );
}

function UserCard({
  user,
  isSelf,
  onToggle,
  isPending,
}: {
  user: AdminUser;
  isSelf: boolean;
  onToggle: () => void;
  isPending: boolean;
}) {
  const initials = user.display_name.trim().slice(0, 2).toUpperCase();
  const joined = new Date(user.created_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <View style={[styles.card, !user.is_active && styles.cardInactive]}>
      <View style={styles.topRow}>
        {user.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, !user.is_active && styles.avatarInactive]}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        )}

        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{user.display_name}</Text>
            {user.is_admin && <Text style={styles.adminBadge}>Admin</Text>}
            {!user.is_active && <Text style={styles.inactiveBadge}>Inactive</Text>}
          </View>
          <Text style={styles.username}>@{user.username}</Text>
          <Text style={styles.joined}>Joined {joined}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <Stat label="Points" value={user.total_points} />
        <Stat label="Visits" value={user.total_visits} />
        <Stat label="Shops" value={user.unique_shops_visited} />
      </View>

      {!isSelf && (
        <TouchableOpacity
          style={[styles.toggleBtn, user.is_active ? styles.deactivateBtn : styles.reactivateBtn]}
          onPress={onToggle}
          disabled={isPending}
        >
          <Text style={[styles.toggleBtnText, user.is_active ? styles.deactivateBtnText : styles.reactivateBtnText]}>
            {user.is_active ? 'Deactivate User' : 'Reactivate User'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value.toLocaleString()}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0ede8' },
  loader: { flex: 1, marginTop: 80 },

  searchWrap: { padding: 16, paddingBottom: 8 },
  search: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0ddd8',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1a1a1a',
  },

  list: { padding: 16, paddingTop: 8, paddingBottom: 40 },
  empty: { textAlign: 'center', color: '#aaa', fontSize: 15, marginTop: 40 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardInactive: { opacity: 0.65 },

  topRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2D5016',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInactive: { backgroundColor: '#aaa' },
  avatarInitials: { fontSize: 17, fontWeight: '700', color: '#fff' },

  userInfo: { flex: 1, justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  name: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  adminBadge: {
    fontSize: 10, fontWeight: '700', color: '#2D5016',
    backgroundColor: '#eef4e8', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  inactiveBadge: {
    fontSize: 10, fontWeight: '700', color: '#c0392b',
    backgroundColor: '#fef2f2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  username: { fontSize: 12, color: '#888', marginTop: 2 },
  joined: { fontSize: 11, color: '#bbb', marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  stat: {
    flex: 1,
    backgroundColor: '#f8f5f0',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  statValue: { fontSize: 14, fontWeight: '700', color: '#2D5016' },
  statLabel: { fontSize: 10, color: '#888', marginTop: 2 },

  filterRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  filterBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0ddd8',
  },
  filterBtnActive: { backgroundColor: '#2D5016', borderColor: '#2D5016' },
  filterBtnText: { fontSize: 13, fontWeight: '500', color: '#555' },
  filterBtnTextActive: { color: '#fff', fontWeight: '700' },

  toggleBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  deactivateBtn: { borderColor: '#f5c6c6', backgroundColor: '#fef2f2' },
  reactivateBtn: { borderColor: '#c6e0c6', backgroundColor: '#eef4e8' },
  toggleBtnText: { fontSize: 13, fontWeight: '600' },
  deactivateBtnText: { color: '#c0392b' },
  reactivateBtnText: { color: '#2D5016' },
});
