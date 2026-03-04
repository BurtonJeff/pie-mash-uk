import React, { useLayoutEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Switch, ActivityIndicator, Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminStackParamList } from '../../navigation/AdminNavigator';
import { fetchAllOnboardingSlides, upsertOnboardingSlide, OnboardingSlide } from '../../lib/content';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminOnboarding'>;

export default function AdminOnboardingScreen({ navigation }: Props) {
  const qc = useQueryClient();
  const { data: slides = [], isLoading } = useQuery({
    queryKey: ['adminOnboardingSlides'],
    queryFn: () => fetchAllOnboardingSlides(),
  });

  const toggleActive = useMutation({
    mutationFn: (slide: OnboardingSlide) =>
      upsertOnboardingSlide({ ...slide, is_active: !slide.is_active }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminOnboardingSlides'] });
      qc.invalidateQueries({ queryKey: ['onboardingSlides'] });
    },
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('AdminOnboardingForm', {})}
          style={{ marginRight: 4 }}
        >
          <Ionicons name="add" size={26} color="#2D5016" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const renderItem = ({ item, index }: { item: OnboardingSlide; index: number }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('AdminOnboardingForm', { slideId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.cardLeft}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <Text style={styles.thumbEmoji}>{item.emoji ?? '🥧'}</Text>
          </View>
        )}
        <View style={styles.cardText}>
          <Text style={styles.cardOrder}>Slide {index + 1}</Text>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title.replace(/\n/g, ' ')}</Text>
          <Text style={styles.cardSubtitle} numberOfLines={2}>{item.subtitle}</Text>
        </View>
      </View>
      <Switch
        value={item.is_active}
        onValueChange={() => toggleActive.mutate(item)}
        trackColor={{ false: '#ddd', true: '#2D5016' }}
        thumbColor="#fff"
      />
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={slides}
      keyExtractor={(s) => s.id}
      renderItem={renderItem}
      style={styles.container}
      contentContainerStyle={styles.content}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      ListEmptyComponent={
        isLoading
          ? <ActivityIndicator size="large" color="#2D5016" style={{ marginTop: 40 }} />
          : <Text style={styles.empty}>No slides yet. Tap + to add one.</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0ede8' },
  content: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 52, height: 52, borderRadius: 8 },
  thumbPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#2D5016',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbEmoji: { fontSize: 28 },
  cardText: { flex: 1 },
  cardOrder: { fontSize: 11, fontWeight: '600', color: '#2D5016', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1a1a1a', marginTop: 2 },
  cardSubtitle: { fontSize: 12, color: '#888', marginTop: 2, lineHeight: 16 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 15 },
});
