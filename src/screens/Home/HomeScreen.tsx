import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { useAuthStore } from '../../store/authStore';
import { useProfile } from '../../hooks/useProfile';
import { useFeaturedShop } from '../../hooks/useHome';
import { useGlobalFeed } from '../../hooks/useCommunity';
import FeaturedShopCard from '../../components/home/FeaturedShopCard';
import DailyFactCard from '../../components/home/DailyFactCard';
import FeedbackModal from '../../components/home/FeedbackModal';
import FeedItemComponent from '../../components/community/FeedItem';

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeMain'>;

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const userId = user?.id ?? '';
  const [feedbackVisible, setFeedbackVisible] = useState(false);

  const { data: profile } = useProfile(userId);
  const { data: featured, isLoading: featuredLoading } = useFeaturedShop();
  const { data: feed = [] } = useGlobalFeed();

  const recentFeed = feed.slice(0, 3);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Subtitle */}
        <Text style={styles.subtitle}>Preserving a Great British Tradition, One Visit at a Time</Text>

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

        {/* Feedback */}
        <TouchableOpacity
          style={styles.feedbackButton}
          onPress={() => setFeedbackVisible(true)}
          activeOpacity={0.75}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={18} color="#2D5016" />
          <Text style={styles.feedbackButtonText}>Share Feedback</Text>
          <Ionicons name="chevron-forward" size={16} color="#aaa" style={styles.feedbackChevron} />
        </TouchableOpacity>

        {/* Recent community activity */}
        {recentFeed.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <View style={styles.feedCard}>
              {recentFeed.map((item) => (
                <FeedItemComponent
                  key={item.id}
                  item={item}
                  onEdit={item.userId === userId ? () => {
                    navigation.navigate('EditCheckIn', {
                      checkInId: item.id,
                      shopName: item.shopName,
                      initialPhotoUrl: item.photoUrl,
                      initialNotes: item.notes,
                    });
                  } : undefined}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <FeedbackModal
        visible={feedbackVisible}
        userId={userId}
        onClose={() => setFeedbackVisible(false)}
      />
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

  subtitle: { fontSize: 15, color: '#888', fontStyle: 'italic', marginBottom: 20 },

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

  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 28,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  feedbackButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#2D5016',
  },
  feedbackChevron: { marginLeft: 'auto' },
});
