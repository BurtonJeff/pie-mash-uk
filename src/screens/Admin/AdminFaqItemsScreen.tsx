import React, { useLayoutEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Switch, ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminStackParamList } from '../../navigation/AdminNavigator';
import { fetchAllFaqItems, upsertFaqItem, FaqItem } from '../../lib/content';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminFaqItems'>;

export default function AdminFaqItemsScreen({ navigation }: Props) {
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['adminFaqItems'],
    queryFn: () => fetchAllFaqItems(),
  });

  const toggleActive = useMutation({
    mutationFn: (item: FaqItem) =>
      upsertFaqItem({ ...item, is_active: !item.is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adminFaqItems'] }),
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('AdminFaqItemForm', {})} style={{ marginRight: 4 }}>
          <Ionicons name="add" size={26} color="#2D5016" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const renderItem = ({ item }: { item: FaqItem }) => (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardBody}
        onPress={() => navigation.navigate('AdminFaqItemForm', { itemId: item.id })}
      >
        <Text style={styles.question} numberOfLines={2}>{item.question}</Text>
        <Text style={styles.answer} numberOfLines={2}>{item.answer}</Text>
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
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      style={styles.container}
      contentContainerStyle={styles.content}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      ListEmptyComponent={
        isLoading
          ? <ActivityIndicator size="large" color="#2D5016" style={{ marginTop: 40 }} />
          : <Text style={styles.empty}>No FAQ items yet. Tap + to add one.</Text>
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
  question: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 4 },
  answer: { fontSize: 13, color: '#888' },
  empty: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 15 },
});
