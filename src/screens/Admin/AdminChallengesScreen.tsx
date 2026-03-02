import React, { useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AdminStackParamList } from '../../navigation/AdminNavigator';
import { useAdminChallenges } from '../../hooks/useAdmin';
import { AdminChallenge } from '../../lib/admin';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminChallenges'>;

export default function AdminChallengesScreen({ navigation }: Props) {
  const { data: challenges, isLoading } = useAdminChallenges();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('AdminChallengeForm', {})}
          style={{ marginRight: 4 }}
        >
          <Ionicons name="add" size={26} color="#2D5016" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const renderItem = ({ item }: { item: AdminChallenge }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('AdminChallengeForm', { challengeId: item.id })}
    >
      <View style={styles.cardTop}>
        <View style={styles.scopeBadge}>
          <Text style={styles.scopeText}>
            {item.scope === 'global' ? 'Global' : 'Group'}
          </Text>
        </View>
        <View style={[styles.activeDot, item.isActive && styles.activeDotOn]} />
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>

      <View style={styles.meta}>
        <Ionicons name="star" size={13} color="#f5a623" style={{ marginRight: 4 }} />
        <Text style={styles.points}>{item.pointsReward} pts</Text>
      </View>

      <Text style={styles.dates}>
        {formatDate(item.startDate)} → {formatDate(item.endDate)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={challenges}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      style={styles.container}
      contentContainerStyle={styles.content}
      ListEmptyComponent={
        isLoading ? (
          <ActivityIndicator size="large" color="#2D5016" style={{ marginTop: 40 }} />
        ) : (
          <Text style={styles.empty}>No challenges found.</Text>
        )
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0ede8' },
  content: { padding: 16, paddingBottom: 32 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  scopeBadge: {
    backgroundColor: '#eef4e8',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  scopeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2D5016',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ccc',
  },
  activeDotOn: {
    backgroundColor: '#34c759',
  },

  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },

  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  points: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },

  dates: {
    fontSize: 12,
    color: '#aaa',
  },

  separator: { height: 10 },
  empty: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
    fontSize: 15,
  },
});
