import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const FAQS = [
  {
    q: 'How does checking in work?',
    a: 'You need to be within 200 metres of a shop to check in. The app uses your GPS location to verify this. You can only check in to the same shop once per day.',
  },
  {
    q: 'How are points calculated?',
    a: 'Your first ever visit to a shop earns 35 points — a 10-point base plus a 25-point first-visit bonus. Every return visit to that same shop on a different day earns 10 points.',
  },
  {
    q: 'What are badges?',
    a: 'Badges are awarded automatically when you reach certain milestones, such as visiting your first shop, checking in at 5 different shops, or logging 10 total visits.',
  },
  {
    q: 'What is Shop of the Week?',
    a: 'Each week the Pie & Mash UK team highlights a featured shop on the home screen — a great way to discover somewhere new.',
  },
  {
    q: 'Can I check in to the same shop more than once?',
    a: 'Yes, but only once per day. You can visit as many different shops as you like on the same day and check in to each one.',
  },
  {
    q: 'What are groups?',
    a: 'Groups let you connect with friends and fellow pie & mash fans. Create a group, share your invite code, and chat with members in the Community tab.',
  },
  {
    q: 'How do I join a group?',
    a: 'Open the Community tab and tap "Join Group". Enter the invite code shared by your group admin.',
  },
  {
    q: 'What is the leaderboard?',
    a: 'The Community tab shows an all-time leaderboard and a weekly leaderboard ranked by points. Keep visiting shops to climb the ranks!',
  },
  {
    q: 'How do I get in touch?',
    a: 'You can reach us at hello@piemashanduk.com',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.item}>
      <TouchableOpacity
        style={styles.question}
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.7}
      >
        <Text style={styles.questionText}>{q}</Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color="#888"
        />
      </TouchableOpacity>
      {open && <Text style={styles.answer}>{a}</Text>}
    </View>
  );
}

export default function FAQScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {FAQS.map((faq, i) => (
          <React.Fragment key={i}>
            <FAQItem q={faq.q} a={faq.a} />
            {i < FAQS.length - 1 && <View style={styles.separator} />}
          </React.Fragment>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0ede8' },
  content: { padding: 16 },

  item: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  separator: { height: 8 },

  question: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  questionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    lineHeight: 21,
  },
  answer: {
    fontSize: 14,
    color: '#555',
    lineHeight: 21,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});
