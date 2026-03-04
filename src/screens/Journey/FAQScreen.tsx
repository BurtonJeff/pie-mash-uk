import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { fetchActiveFaqItems, FaqItem } from '../../lib/content';

const FALLBACK_FAQS: FaqItem[] = [
  { id: '1', question: 'How does checking in work?', answer: 'You need to be within 200 metres of a shop to check in. The app uses your GPS location to verify this. You can only check in to the same shop once per day.', is_active: true, sort_order: 0, created_at: '' },
  { id: '2', question: 'How are points calculated?', answer: 'Your first ever visit to a shop earns 35 points — a 10-point base plus a 25-point first-visit bonus. Every return visit to that same shop on a different day earns 10 points.', is_active: true, sort_order: 1, created_at: '' },
  { id: '3', question: 'What are badges?', answer: 'Badges are awarded automatically when you reach certain milestones, such as visiting your first shop, checking in at 5 different shops, or logging 10 total visits.', is_active: true, sort_order: 2, created_at: '' },
  { id: '4', question: 'What is Shop of the Week?', answer: 'Each week the Pie & Mash team highlights a featured shop on the home screen — a great way to discover somewhere new.', is_active: true, sort_order: 3, created_at: '' },
  { id: '5', question: 'Can I check in to the same shop more than once?', answer: 'Yes, but only once per day. You can visit as many different shops as you like on the same day and check in to each one.', is_active: true, sort_order: 4, created_at: '' },
  { id: '6', question: 'What are groups?', answer: 'Groups let you connect with friends and fellow pie & mash fans. Create a group, share your invite code, and chat with members in the Community tab.', is_active: true, sort_order: 5, created_at: '' },
  { id: '7', question: 'How do I join a group?', answer: 'Open the Community tab and tap "Join Group". Enter the invite code shared by your group admin.', is_active: true, sort_order: 6, created_at: '' },
  { id: '8', question: 'What is the leaderboard?', answer: 'The Community tab shows an all-time leaderboard and a weekly leaderboard ranked by points. Keep visiting shops to climb the ranks!', is_active: true, sort_order: 7, created_at: '' },
  { id: '9', question: 'How do I get in touch?', answer: 'You can reach us at hello@piemashanduk.com', is_active: true, sort_order: 8, created_at: '' },
];

interface FAQItemProps {
  q: string;
  a: string;
  isOpen: boolean;
  onToggle: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
}

function FAQItem({ q, a, isOpen, onToggle, onLayout }: FAQItemProps) {
  return (
    <View style={styles.item} onLayout={onLayout}>
      <TouchableOpacity style={styles.question} onPress={onToggle} activeOpacity={0.7}>
        <Text style={styles.questionText}>{q}</Text>
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#888" />
      </TouchableOpacity>
      {isOpen && <Text style={styles.answer}>{a}</Text>}
    </View>
  );
}

export default function FAQScreen() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const itemYs = useRef<number[]>([]);

  const { data: dbFaqs, isLoading } = useQuery({
    queryKey: ['faqItems'],
    queryFn: () => fetchActiveFaqItems(),
    staleTime: 1000 * 60 * 30,
  });

  const faqs = (dbFaqs && dbFaqs.length > 0) ? dbFaqs : FALLBACK_FAQS;

  function handleToggle(i: number) {
    const isOpening = openIndex !== i;
    setOpenIndex(isOpening ? i : null);
    if (isOpening) {
      requestAnimationFrame(() => {
        const y = itemYs.current[i] ?? 0;
        scrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
      });
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#2D5016" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {faqs.map((faq, i) => (
            <React.Fragment key={faq.id}>
              <FAQItem
                q={faq.question}
                a={faq.answer}
                isOpen={openIndex === i}
                onToggle={() => handleToggle(i)}
                onLayout={(e) => { itemYs.current[i] = e.nativeEvent.layout.y; }}
              />
              {i < faqs.length - 1 && <View style={styles.separator} />}
            </React.Fragment>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0ede8' },
  content: { padding: 16 },
  item: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  separator: { height: 8 },
  question: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 16, gap: 12,
  },
  questionText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1a1a1a', lineHeight: 21 },
  answer: { fontSize: 14, color: '#555', lineHeight: 21, paddingHorizontal: 16, paddingBottom: 16 },
});
