import React, { useLayoutEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Switch, ActivityIndicator, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminStackParamList } from '../../navigation/AdminNavigator';
import { fetchAllDidYouKnowFacts, deleteDidYouKnowFact, upsertDidYouKnowFact, DidYouKnowFact } from '../../lib/content';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminFacts'>;

export default function AdminFactsScreen({ navigation }: Props) {
  const qc = useQueryClient();
  const { data: facts = [], isLoading } = useQuery({
    queryKey: ['adminFacts'],
    queryFn: () => fetchAllDidYouKnowFacts(),
  });

  const toggleActive = useMutation({
    mutationFn: (fact: DidYouKnowFact) =>
      upsertDidYouKnowFact({ ...fact, is_active: !fact.is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adminFacts'] }),
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('AdminFactForm', {})} style={{ marginRight: 4 }}>
          <Ionicons name="add" size={26} color="#2D5016" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const renderItem = ({ item }: { item: DidYouKnowFact }) => (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardBody}
        onPress={() => navigation.navigate('AdminFactForm', { factId: item.id })}
      >
        <Text style={styles.factText} numberOfLines={3}>{item.fact}</Text>
        <Text style={styles.meta}>Order: {item.sort_order}</Text>
      </TouchableOpacity>
      <Switch
        value={item.is_active}
        onValueChange={() => toggleActive.mutate(item)}
        trackColor={{ false: '#ddd', true: '#2D5016' }}
        thumbColor="#fff"
      />
    </View>
  );

  return (
    <FlatList
      data={facts}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      style={styles.container}
      contentContainerStyle={styles.content}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      ListEmptyComponent={
        isLoading
          ? <ActivityIndicator size="large" color="#2D5016" style={{ marginTop: 40 }} />
          : <Text style={styles.empty}>No facts yet. Tap + to add one.</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0ede8' },
  content: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardBody: { flex: 1 },
  factText: { fontSize: 14, color: '#1a1a1a', lineHeight: 20 },
  meta: { fontSize: 12, color: '#aaa', marginTop: 6 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 15 },
});
