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
import { useAdminShops, useSetShopFeatured, useSetShopActive } from '../../hooks/useAdmin';
import { AdminShop } from '../../lib/admin';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminShops'>;

export default function AdminShopsScreen({ navigation }: Props) {
  const { data: shops, isLoading } = useAdminShops();
  const setFeatured = useSetShopFeatured();
  const setActive = useSetShopActive();

  const [featuredPending, setFeaturedPending] = useState<string | null>(null);
  const [activePending, setActivePending] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('AdminShopForm', {})}
          style={{ marginRight: 4 }}
        >
          <Ionicons name="add" size={26} color="#2D5016" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleSetFeatured = (shopId: string) => {
    setFeaturedPending(shopId);
    setFeatured.mutate(shopId, {
      onSettled: () => setFeaturedPending(null),
    });
  };

  const handleSetActive = (shopId: string, active: boolean) => {
    setActivePending(shopId);
    setActive.mutate({ shopId, active }, {
      onSettled: () => setActivePending(null),
    });
  };

  const renderItem = ({ item }: { item: AdminShop }) => {
    const isMutating =
      featuredPending === item.id || activePending === item.id;

    return (
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.rowInfo}
          onPress={() => navigation.navigate('AdminShopForm', { shopId: item.id })}
        >
          <Text style={styles.shopName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.shopCity}>{item.city}</Text>
        </TouchableOpacity>

        {isMutating ? (
          <ActivityIndicator size="small" color="#2D5016" style={styles.loader} />
        ) : (
          <View style={styles.controls}>
            <TouchableOpacity
              onPress={() => handleSetFeatured(item.id)}
              style={styles.starButton}
              disabled={featuredPending !== null}
            >
              <Ionicons
                name={item.is_featured ? 'star' : 'star-outline'}
                size={22}
                color={item.is_featured ? '#f5a623' : '#bbb'}
              />
            </TouchableOpacity>

            <Switch
              value={item.is_active}
              onValueChange={(val) => handleSetActive(item.id, val)}
              disabled={activePending !== null}
              trackColor={{ false: '#ddd', true: '#2D5016' }}
              thumbColor="#fff"
            />
          </View>
        )}
      </View>
    );
  };



  return (
    <FlatList
      data={shops}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      style={styles.container}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.headerNote}>
            <Text style={{ color: '#f5a623' }}>★</Text> = Featured on Home tab
          </Text>
        </View>
      }
      ListEmptyComponent={
        isLoading ? (
          <ActivityIndicator size="large" color="#2D5016" style={{ marginTop: 40 }} />
        ) : (
          <Text style={styles.empty}>No shops found.</Text>
        )
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0ede8' },
  content: { paddingBottom: 32 },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f0ede8',
  },
  headerNote: {
    fontSize: 13,
    color: '#666',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 60,
  },
  rowInfo: {
    flex: 1,
    marginRight: 12,
  },
  shopName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  shopCity: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  loader: {
    marginHorizontal: 16,
  },

  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e8e8e8',
    marginLeft: 16,
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
    fontSize: 15,
  },
});
