import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/AdminNavigator';
import { useAdminFeedback, useDeleteFeedback } from '../../hooks/useAdmin';
import { FeedbackItem } from '../../lib/admin';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminFeedback'>;

export default function AdminFeedbackScreen(_: Props) {
  const { data: items = [], isLoading } = useAdminFeedback();
  const deleteMutation = useDeleteFeedback();

  function confirmDelete(item: FeedbackItem) {
    Alert.alert('Delete Feedback', 'Are you sure you want to delete this feedback?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(item.id),
      },
    ]);
  }

  if (isLoading) {
    return <ActivityIndicator size="large" color="#2D5016" style={styles.loader} />;
  }

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No feedback yet.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <FeedbackCard item={item} onDelete={() => confirmDelete(item)} />
      )}
      showsVerticalScrollIndicator={false}
    />
  );
}

function FeedbackCard({ item, onDelete }: { item: FeedbackItem; onDelete: () => void }) {
  const user = item.user;
  const name = user?.display_name ?? 'Unknown User';
  const username = user?.username ? `@${user.username}` : '';
  const initials = name.trim().slice(0, 2).toUpperCase();

  const date = new Date(item.submitted_at);
  const dateStr = date.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <View style={styles.card}>
      {/* User row */}
      <View style={styles.userRow}>
        {user?.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{name}</Text>
          {username ? <Text style={styles.userHandle}>{username}</Text> : null}
        </View>
        <Text style={styles.date}>{dateStr}{'\n'}{timeStr}</Text>
      </View>

      {/* Stats pills */}
      {user && (
        <View style={styles.statsRow}>
          <StatPill label="Points" value={user.total_points} />
          <StatPill label="Visits" value={user.total_visits} />
        </View>
      )}

      {/* Message */}
      <Text style={styles.message}>{item.message}</Text>

      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
        <Ionicons name="trash-outline" size={14} color="#c0392b" />
        <Text style={styles.deleteBtnText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillValue}>{value.toLocaleString()}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0ede8' },
  content: { padding: 16, paddingBottom: 40 },
  loader: { flex: 1, marginTop: 80 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, color: '#aaa' },

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

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  avatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2D5016',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 15, fontWeight: '700', color: '#fff' },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  userHandle: { fontSize: 12, color: '#888', marginTop: 1 },
  date: { fontSize: 11, color: '#aaa', textAlign: 'right', lineHeight: 16 },

  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  pill: {
    backgroundColor: '#eef4e8',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'center',
  },
  pillValue: { fontSize: 13, fontWeight: '700', color: '#2D5016' },
  pillLabel: { fontSize: 10, color: '#5a8a30', marginTop: 1 },

  message: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
    marginTop: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f5c6c6',
    backgroundColor: '#fef2f2',
  },
  deleteBtnText: { fontSize: 12, color: '#c0392b', fontWeight: '600' },
});
