import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { JourneyStackParamList } from '../../navigation/JourneyNavigator';
import { useAuthStore } from '../../store/authStore';
import { fetchUserShopAdminAssignments, ShopAdminAssignment } from '../../lib/admin';

type Props = NativeStackScreenProps<JourneyStackParamList, 'MyShops'>;

export default function MyShopsScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const userId = user?.id ?? '';

  const { data: shops = [], isLoading } = useQuery({
    queryKey: ['shopAdminAssignments', userId],
    queryFn: () => fetchUserShopAdminAssignments(userId),
    enabled: !!userId,
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#2D5016" style={styles.loader} />
      ) : (
        <FlatList
          data={shops}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.content}
          renderItem={({ item }: { item: ShopAdminAssignment }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('Admin' as any, { screen: 'AdminShopForm', params: { shopId: item.shopId } } as any)}
              activeOpacity={0.7}
            >
              <View style={styles.cardBody}>
                <Text style={styles.shopName}>{item.shopName}</Text>
                <Text style={styles.shopCity}>{item.shopCity}</Text>
              </View>
              <Text style={styles.editText}>Edit →</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No shops assigned to you yet.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f5f0' },
  loader: { marginTop: 60 },
  content: { padding: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardBody: { flex: 1 },
  shopName: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  shopCity: { fontSize: 13, color: '#888', marginTop: 2 },
  editText: { fontSize: 14, color: '#2D5016', fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15, color: '#aaa' },
});
