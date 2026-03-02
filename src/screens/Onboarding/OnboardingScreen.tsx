import React, { useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Dimensions, NativeScrollEvent, NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export const ONBOARDING_KEY = 'hasSeenOnboarding';

interface Slide {
  key: string;
  emoji: string;
  title: string;
  subtitle: string;
}

const SLIDES: Slide[] = [
  {
    key: '1',
    emoji: '🥧',
    title: 'Welcome to\nPie & Mash UK',
    subtitle: "Your definitive guide to Britain's finest traditional pie & mash shops.",
  },
  {
    key: '2',
    emoji: '📍',
    title: 'Check In\n& Earn Points',
    subtitle: 'Visit a shop, snap a photo, and check in. Every visit earns you points and badges.',
  },
  {
    key: '3',
    emoji: '🏆',
    title: 'Compete\n& Connect',
    subtitle: 'Climb the leaderboard, collect badges, and challenge your mates in groups.',
  },
];

export default function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const flatRef = useRef<FlatList<Slide>>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  }, []);

  const goNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      const next = activeIndex + 1;
      flatRef.current?.scrollToIndex({ index: next, animated: true });
      setActiveIndex(next);
    } else {
      finish();
    }
  };

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    onComplete();
  };

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <View style={styles.root}>
      {/* Slides */}
      <FlatList
        ref={flatRef}
        data={SLIDES}
        keyExtractor={(s) => s.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleScroll}
        style={styles.list}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            {/* Hero area */}
            <View style={styles.hero}>
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>
            {/* Content area */}
            <View style={styles.content}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
          </View>
        )}
      />

      {/* Footer: dots + buttons */}
      <SafeAreaView style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
          ))}
        </View>
        <View style={styles.btnRow}>
          {isLast ? (
            <View style={styles.skipBtn} />
          ) : (
            <TouchableOpacity onPress={finish} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.nextBtn} onPress={goNext}>
            <Text style={styles.nextText}>{isLast ? 'Get Started' : 'Next'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8f5f0' },
  list: { flex: 1 },

  slide: { width, flex: 1 },

  hero: {
    flex: 1,
    backgroundColor: '#2D5016',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 100 },

  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1a1a1a',
    lineHeight: 38,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    lineHeight: 26,
  },

  footer: {
    backgroundColor: '#f8f5f0',
    paddingHorizontal: 28,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
  },
  dotActive: {
    width: 24,
    borderRadius: 4,
    backgroundColor: '#2D5016',
  },

  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  skipBtn: { paddingVertical: 8, paddingHorizontal: 4, minWidth: 60 },
  skipText: { fontSize: 15, color: '#aaa', fontWeight: '500' },
  nextBtn: {
    backgroundColor: '#2D5016',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 36,
  },
  nextText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
