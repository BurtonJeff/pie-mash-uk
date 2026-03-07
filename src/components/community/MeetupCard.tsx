import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Meetup, formatMeetupDate, formatMeetupTime } from '../../lib/meetups';

interface Props {
  meetup: Meetup;
  userId: string;
  isAdmin: boolean;
  onRsvp: () => void;
  onUnrsvp: () => void;
  onCancel: () => void;
  onEdit: () => void;
  onShowAttendees: () => void;
}

export default function MeetupCard({ meetup, userId, isAdmin, onRsvp, onUnrsvp, onCancel, onEdit, onShowAttendees }: Props) {
  const isCancelled = !!meetup.cancelledAt;
  const isProposer = meetup.proposedBy === userId;
  const canCancel = !isCancelled && (isProposer || isAdmin);
  const canEdit = !isCancelled && (isProposer || isAdmin);
  const isFull = meetup.maxAttendees != null && meetup.rsvpCount >= meetup.maxAttendees && !meetup.userRsvpd;

  function confirmCancel() {
    Alert.alert(
      'Cancel Meatup',
      'Are you sure you want to cancel this meatup? All attendees will be notified.',
      [
        { text: 'Keep it', style: 'cancel' },
        { text: 'Cancel Meatup', style: 'destructive', onPress: onCancel },
      ],
    );
  }

  return (
    <View style={[styles.card, isCancelled && styles.cardCancelled]}>
      {isCancelled && (
        <View style={styles.cancelledBanner}>
          <Text style={styles.cancelledText}>CANCELLED</Text>
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.shopInfo}>
          <Ionicons name="storefront-outline" size={15} color="#2D5016" />
          <Text style={styles.shopName}>{meetup.shopName}</Text>
          <Text style={styles.shopCity}>{meetup.shopCity}</Text>
        </View>
        <View style={styles.headerActions}>
          {canEdit && (
            <TouchableOpacity onPress={onEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="pencil-outline" size={17} color="#555" />
            </TouchableOpacity>
          )}
          {canCancel && (
            <TouchableOpacity onPress={confirmCancel} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="trash-outline" size={17} color="#c0392b" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.dateRow}>
        <Ionicons name="calendar-outline" size={14} color="#888" />
        <Text style={styles.dateText}>{formatMeetupDate(meetup.meetupDate)}</Text>
      </View>
      <View style={styles.dateRow}>
        <Ionicons name="time-outline" size={14} color="#888" />
        <Text style={styles.dateText}>{formatMeetupTime(meetup.meetupTime)}</Text>
      </View>

      {meetup.description ? (
        <Text style={styles.description}>{meetup.description}</Text>
      ) : null}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.rsvpInfo} onPress={onShowAttendees} disabled={meetup.rsvpCount === 0}>
          <Ionicons name="people-outline" size={15} color="#555" />
          <Text style={[styles.rsvpText, meetup.rsvpCount > 0 && styles.rsvpTextTappable]}>
            {meetup.rsvpCount} going
            {meetup.maxAttendees != null ? ` / ${meetup.maxAttendees} max` : ''}
          </Text>
        </TouchableOpacity>

        {!isCancelled && (
          meetup.userRsvpd ? (
            <TouchableOpacity style={styles.goingBtn} onPress={onUnrsvp}>
              <Ionicons name="checkmark-circle" size={15} color="#2D5016" />
              <Text style={styles.goingText}>Going</Text>
            </TouchableOpacity>
          ) : isFull ? (
            <View style={styles.fullBtn}>
              <Text style={styles.fullText}>Full</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.rsvpBtn} onPress={onRsvp}>
              <Text style={styles.rsvpBtnText}>Join</Text>
            </TouchableOpacity>
          )
        )}
      </View>

      <Text style={styles.proposedBy}>Proposed by {meetup.proposedByName}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardCancelled: { opacity: 0.6 },
  cancelledBanner: {
    backgroundColor: '#c0392b',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  cancelledText: { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 1 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  shopInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  shopName: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  shopCity: { fontSize: 13, color: '#888' },

  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  dateText: { fontSize: 13, color: '#555' },

  description: { fontSize: 13, color: '#666', marginTop: 6, lineHeight: 18 },

  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  rsvpInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rsvpText: { fontSize: 13, color: '#555' },
  rsvpTextTappable: { color: '#2D5016', textDecorationLine: 'underline' },

  rsvpBtn: { backgroundColor: '#2D5016', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 7 },
  rsvpBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  goingBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#eef4e8', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  goingText: { color: '#2D5016', fontWeight: '700', fontSize: 13 },

  fullBtn: { backgroundColor: '#eee', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  fullText: { color: '#999', fontWeight: '600', fontSize: 13 },

  proposedBy: { fontSize: 11, color: '#bbb', marginTop: 8 },
});
