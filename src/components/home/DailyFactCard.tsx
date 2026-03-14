import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Linking, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { fetchActiveDidYouKnowFacts, fetchDidYouKnowLinkConfig } from '../../lib/content';
import { getDailyFact } from '../../utils/facts';

function todayIndex(count: number): number {
  if (count === 0) return 0;
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000,
  );
  return dayOfYear % count;
}

export default function DailyFactCard() {
  const { data: facts = [] } = useQuery({
    queryKey: ['didYouKnow'],
    queryFn: () => fetchActiveDidYouKnowFacts(),
    staleTime: 1000 * 60 * 60,
  });

  const { data: linkConfig } = useQuery({
    queryKey: ['didYouKnowLink'],
    queryFn: () => fetchDidYouKnowLinkConfig(),
    staleTime: 1000 * 60 * 30,
  });

  const items = facts.length > 0 ? facts.map((f) => f.fact) : [getDailyFact()];
  const [currentIdx, setCurrentIdx] = useState(() => todayIndex(items.length));
  const slideAnim = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);

  function slide(direction: 'next' | 'prev') {
    if (isAnimating.current || items.length <= 1) return;
    isAnimating.current = true;

    const outX = direction === 'next' ? -300 : 300;
    const inX  = direction === 'next' ?  300 : -300;

    Animated.timing(slideAnim, {
      toValue: outX,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setCurrentIdx((idx) =>
        direction === 'next'
          ? (idx + 1) % items.length
          : (idx - 1 + items.length) % items.length,
      );
      slideAnim.setValue(inX);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => { isAnimating.current = false; });
    });
  }

  const showNav = items.length > 1;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Did you know?</Text>
      </View>

      <View style={styles.slideArea}>
        {showNav && (
          <TouchableOpacity onPress={() => slide('prev')} hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}>
            <Ionicons name="chevron-back" size={20} color="#5a8a30" />
          </TouchableOpacity>
        )}

        <Animated.View style={[styles.factWrap, { transform: [{ translateX: slideAnim }] }]}>
          <Text style={styles.fact}>{items[currentIdx]}</Text>
        </Animated.View>

        {showNav && (
          <TouchableOpacity onPress={() => slide('next')} hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}>
            <Ionicons name="chevron-forward" size={20} color="#5a8a30" />
          </TouchableOpacity>
        )}
      </View>

      {linkConfig?.url ? (
        <TouchableOpacity onPress={() => Linking.openURL(linkConfig.url)} style={styles.linkWrap}>
          <Text style={styles.linkText}>
            {linkConfig.text} <Text style={styles.linkBold}>{linkConfig.bold}</Text>
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#e8f0e0',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  header: { fontSize: 14, fontWeight: '700', color: '#2D5016' },
  slideArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  factWrap: { flex: 1 },
  fact: { fontSize: 14, color: '#333', lineHeight: 22 },
  linkWrap: { marginTop: 12 },
  linkText: { fontSize: 13, color: '#2D5016' },
  linkBold: { fontWeight: '700' },
});
