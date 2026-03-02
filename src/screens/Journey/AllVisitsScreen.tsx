import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { useUserCheckins } from '../../hooks/useProfile';
import VisitRow from '../../components/journey/VisitRow';

export default function AllVisitsScreen() {
  const { user } = useAuthStore();
  const { data: checkins = [], isLoading } = useUserCheckins(user?.id ?? '');

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2D5016" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={checkins}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <VisitRow
            shopName={item.shop_name}
            checkedInAt={item.checked_in_at}
            photoUrl={item.photo_url}
            pointsEarned={item.points_earned}
          />
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No visits yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f5f0' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 40 },
  emptyText: { fontSize: 15, color: '#aaa' },
});
