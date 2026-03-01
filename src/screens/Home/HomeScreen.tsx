import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { useAuthStore } from '../../store/authStore';
import { useProfile } from '../../hooks/useProfile';
import { useFeaturedShop } from '../../hooks/useHome';
import { useGlobalFeed } from '../../hooks/useCommunity';
import FeaturedShopCard from '../../components/home/FeaturedShopCard';
import DailyFactCard from '../../components/home/DailyFactCard';
import FeedItemComponent from '../../components/community/FeedItem';

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeMain'>;

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const userId = user?.id ?? '';

  const { data: profile } = useProfile(userId);
  const { data: featured, isLoading: featuredLoading } = useFeaturedShop();
  const { data: feed = [] } = useGlobalFeed();

  const recentFeed = feed.slice(0, 3);
  const name = profile?.display_name || profile?.username || 'friend';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>🥧</Text>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.name}>{name}!</Text>
          </View>
        </View>

        {/* Stats row */}
        {profile && (
          <View style={styles.statsRow}>
            <StatPill label="Points" value={profile.total_points} />
            <StatPill label="Shops" value={profile.unique_shops_visited} />
            <StatPill label="Visits" value={profile.total_visits} />
          </View>
        )}

        {/* Featured shop */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shop of the Week</Text>
          {featuredLoading ? (
            <ActivityIndicator color="#2D5016" style={styles.loader} />
          ) : featured ? (
            <FeaturedShopCard
              shop={featured}
              onPress={() => navigation.navigate('ShopDetail', { shopId: featured.id })}
            />
          ) : (
            <Text style={styles.empty}>No featured shop this week.</Text>
          )}
        </View>

        {/* Daily fact */}
        <DailyFactCard />

        {/* Recent community activity */}
        {recentFeed.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <View style={styles.feedCard}>
              {recentFeed.map((item) => (
                <FeedItemComponent key={item.id} item={item} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statValue}>{value.toLocaleString()}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8f5f0' },
  content: { padding: 20, paddingBottom: 40 },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 14 },
  headerEmoji: { fontSize: 48 },
  greeting: { fontSize: 15, color: '#888' },
  name: { fontSize: 24, fontWeight: '800', color: '#1a1a1a' },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  statPill: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: '#2D5016' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 2 },

  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#1a1a1a', marginBottom: 12 },

  feedCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },

  loader: { marginTop: 20 },
  empty: { fontSize: 14, color: '#aaa', textAlign: 'center', marginTop: 12 },
});
