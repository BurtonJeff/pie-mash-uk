import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UpcomingMeetup, formatMeetupDate, formatMeetupTime } from '../../lib/meetups';

interface Props {
  meetups: UpcomingMeetup[];
  onPress: (meetup: UpcomingMeetup) => void;
}

export default function UpcomingMeetupsCard({ meetups, onPress }: Props) {
  if (!meetups.length) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Your Upcoming Meatups</Text>
      <View style={styles.card}>
        {meetups.map((meetup, index) => (
          <View key={meetup.id}>
            {index > 0 && <View style={styles.divider} />}
            <TouchableOpacity style={styles.row} onPress={() => onPress(meetup)} activeOpacity={0.7}>
              <View style={styles.iconWrap}>
                <Ionicons name="calendar" size={20} color="#2D5016" />
              </View>
              <View style={styles.info}>
                <Text style={styles.shopName}>{meetup.shopName}</Text>
                <Text style={styles.shopCity}>{meetup.shopCity}</Text>
                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={12} color="#888" />
                  <Text style={styles.metaText}>
                    {formatMeetupDate(meetup.meetupDate)} at {formatMeetupTime(meetup.meetupTime)}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="people-outline" size={12} color="#888" />
                  <Text style={styles.metaText}>{meetup.groupName}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#1a1a1a', marginBottom: 12 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#f0ede8',
    marginLeft: 60,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef4e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  shopName: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  shopCity: { fontSize: 12, color: '#888', marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  metaText: { fontSize: 12, color: '#666' },
});
