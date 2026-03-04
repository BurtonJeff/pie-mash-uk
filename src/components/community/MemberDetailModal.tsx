import React from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GroupMember } from '../../lib/groups';

interface Props {
  member: GroupMember | null;
  onClose: () => void;
}

export default function MemberDetailModal({ member, onClose }: Props) {
  if (!member) return null;

  const initials = (() => {
    const parts = member.displayName.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : member.displayName.slice(0, 2).toUpperCase();
  })();

  const joinedDate = new Date(member.joinedAt).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <Modal visible={!!member} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />

      <View style={styles.sheet}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="close" size={22} color="#888" />
        </TouchableOpacity>

        <View style={styles.content}>
          {/* Avatar */}
          {member.avatarUrl ? (
            <Image source={{ uri: member.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.initials}>{initials}</Text>
            </View>
          )}

          {/* Name + role */}
          <Text style={styles.name}>{member.displayName}</Text>
          {member.role === 'admin' && (
            <View style={styles.adminChip}>
              <Text style={styles.adminChipText}>Admin</Text>
            </View>
          )}

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{member.totalPoints}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{member.uniqueShopsVisited}</Text>
              <Text style={styles.statLabel}>Shops</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{member.totalVisits}</Text>
              <Text style={styles.statLabel}>Visits</Text>
            </View>
          </View>

          {/* Bio */}
          {member.bio ? (
            <Text style={styles.bio}>{member.bio}</Text>
          ) : null}

          {/* Joined date */}
          <View style={styles.joinedRow}>
            <Ionicons name="calendar-outline" size={15} color="#888" style={{ marginRight: 6 }} />
            <Text style={styles.joinedText}>Joined {joinedDate}</Text>
          </View>
        </View>
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
  },
  closeBtn: { alignSelf: 'flex-end', padding: 16 },
  content: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 8 },

  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 14 },
  avatarPlaceholder: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#2D5016', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  initials: { fontSize: 28, fontWeight: '700', color: '#fff' },

  name: { fontSize: 22, fontWeight: '800', color: '#1a1a1a', textAlign: 'center', marginBottom: 8 },
  adminChip: {
    backgroundColor: '#fff3e0', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 4, marginBottom: 20,
  },
  adminChipText: { fontSize: 12, fontWeight: '700', color: '#b45309', textTransform: 'uppercase', letterSpacing: 0.6 },

  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f8f5f0', borderRadius: 14,
    paddingVertical: 16, paddingHorizontal: 24,
    alignSelf: 'stretch', marginBottom: 20,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: '#2D5016' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: '#e0ddd8' },

  bio: {
    fontSize: 14, color: '#555', textAlign: 'center',
    lineHeight: 21, marginBottom: 16, paddingHorizontal: 8,
  },
  joinedRow: { flexDirection: 'row', alignItems: 'center' },
  joinedText: { fontSize: 13, color: '#888' },
});
