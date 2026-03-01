import React, { useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AdminStackParamList } from '../../navigation/AdminNavigator';
import { useAdminBadges, useSetBadgeActive } from '../../hooks/useAdmin';
import { Badge } from '../../types/database';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminBadges'>;

export default function AdminBadgesScreen({ navigation }: Props) {
  const { data: badges, isLoading } = useAdminBadges();
  const setActive = useSetBadgeActive();
  const [activePending, setActivePending] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('AdminBadgeForm')}
          style={{ marginRight: 4 }}
        >
          <Ionicons name="add" size={26} color="#2D5016" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleSetActive = (badgeId: string, active: boolean) => {
    setActivePending(badgeId);
    setActive.mutate({ badgeId, active }, {
      onSettled: () => setActivePending(null),
    });
  };

  const renderItem = ({ item }: { item: Badge }) => {
    const isMutating = activePending === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <Text style={styles.iconText} numberOfLines={1}>
              {item.icon_url}
            </Text>
            <View style={styles.cardInfo}>
              <Text style={styles.badgeName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.categoryChip}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
            </View>
          </View>
          {isMutating ? (
            <ActivityIndicator size="small" color="#2D5016" />
          ) : (
            <Switch
              value={item.is_active}
              onValueChange={(val) => handleSetActive(item.id, val)}
              disabled={activePending !== null}
              trackColor={{ false: '#ddd', true: '#2D5016' }}
              thumbColor="#fff"
            />
          )}
        </View>
        <Text style={styles.criteria}>
          {item.criteria_type === 'total_checkins' ? 'Total check-ins' : 'Unique shops'}:{' '}
          <Text style={styles.criteriaValue}>{item.criteria_value}</Text>
        </Text>
      </View>
    );
  };

  return (
    <FlatList
      data={badges}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      style={styles.container}
      contentContainerStyle={styles.content}
      ListEmptyComponent={
        isLoading ? (
          <ActivityIndicator size="large" color="#2D5016" style={{ marginTop: 40 }} />
        ) : (
          <Text style={styles.empty}>No badges found.</Text>
        )
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
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
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  iconText: {
    fontSize: 26,
    marginRight: 10,
    width: 36,
  },
  cardInfo: {
    flex: 1,
  },
  badgeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  categoryChip: {
    backgroundColor: '#eef4e8',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 11,
    color: '#2D5016',
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  criteria: {
    fontSize: 13,
    color: '#888',
  },
  criteriaValue: {
    fontWeight: '700',
    color: '#555',
  },

  separator: {
    height: 10,
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
    fontSize: 15,
  },
});
