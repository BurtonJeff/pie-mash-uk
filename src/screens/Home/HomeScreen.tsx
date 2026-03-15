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
import { useProfile, useUserBadges } from '../../hooks/useProfile';
import { useFeaturedShop } from '../../hooks/useHome';
import { useUpcomingMeetups } from '../../hooks/useCommunity';
import { useQuery } from '@tanstack/react-query';
import { fetchAppConfig } from '../../lib/content';
import FeaturedShopCard from '../../components/home/FeaturedShopCard';
import DailyFactCard from '../../components/home/DailyFactCard';
import FeedbackModal from '../../components/home/FeedbackModal';
import TipJarModal from '../../components/home/TipJarModal';
import UpcomingMeetupsCard from '../../components/home/UpcomingMeetupsCard';
import { UpcomingMeetup } from '../../lib/meetups';
import BadgeItem from '../../components/journey/BadgeItem';

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeMain'>;

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const userId = user?.id ?? '';
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [tipJarVisible, setTipJarVisible] = useState(false);

  const { data: profile } = useProfile(userId);
  const { data: featured, isLoading: featuredLoading } = useFeaturedShop();
  const { data: upcomingMeetups = [] } = useUpcomingMeetups(userId);
  const { data: userBadges = [] } = useUserBadges(userId);
  const { data: subtitle } = useQuery({
    queryKey: ['appConfig', 'home_subtitle'],
    queryFn: () => fetchAppConfig('home_subtitle'),
    staleTime: 1000 * 60 * 10,
  });

  const sortedBadges = [...userBadges].sort(
    (a, b) => new Date(b.awarded_at).getTime() - new Date(a.awarded_at).getTime(),
  );

  function handleMeetupPress(meetup: UpcomingMeetup) {
    navigation.getParent()?.navigate('Community', {
      screen: 'GroupDetail',
      params: {
        groupId: meetup.groupId,
        groupName: meetup.groupName,
        createdBy: meetup.groupCreatedBy,
        initialTab: 'meetups',
      },
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Subtitle */}
        <Text style={styles.subtitle}>
          {subtitle ?? 'Preserving a Great British Tradition, One Visit at a Time'}
        </Text>

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

        {/* Upcoming meatups */}
        <UpcomingMeetupsCard meetups={upcomingMeetups} onPress={handleMeetupPress} />

        {/* Earned badges */}
        {sortedBadges.length > 0 && (
          <View style={[styles.section, styles.badgesSection]}>
            <Text style={styles.sectionTitle}>Your Badges</Text>
            <View style={styles.badgeGrid}>
              {sortedBadges.map((ub) => (
                <BadgeItem
                  key={ub.badge.id}
                  badge={ub.badge}
                  earned
                  awardedAt={ub.awarded_at}
                  profile={profile}
                />
              ))}
            </View>
          </View>
        )}

        {/* Bottom buttons */}
        <View style={styles.bottomButtons}>
          <TouchableOpacity
            style={styles.feedbackButton}
            onPress={() => setFeedbackVisible(true)}
            activeOpacity={0.75}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#2D5016" />
            <Text style={styles.feedbackButtonText}>Share Feedback</Text>
            <Ionicons name="chevron-forward" size={16} color="#aaa" style={styles.feedbackChevron} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.feedbackButton}
            onPress={() => setTipJarVisible(true)}
            activeOpacity={0.75}
          >
            <Ionicons name="heart-outline" size={18} color="#2D5016" />
            <Text style={styles.feedbackButtonText}>Support Pie & Mash</Text>
            <Ionicons name="chevron-forward" size={16} color="#aaa" style={styles.feedbackChevron} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.feedbackButton}
            onPress={() => navigation.navigate('FAQ')}
            activeOpacity={0.75}
          >
            <Ionicons name="help-circle-outline" size={18} color="#2D5016" />
            <Text style={styles.feedbackButtonText}>Help & FAQ</Text>
            <Ionicons name="chevron-forward" size={16} color="#aaa" style={styles.feedbackChevron} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <FeedbackModal
        visible={feedbackVisible}
        userId={userId}
        onClose={() => setFeedbackVisible(false)}
      />
      <TipJarModal
        visible={tipJarVisible}
        onClose={() => setTipJarVisible(false)}
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
  badgesSection: { marginBottom: 12 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },

  bottomButtons: {
    gap: 10,
    marginBottom: 28,
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
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
