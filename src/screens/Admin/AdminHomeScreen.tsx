import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AdminStackParamList } from '../../navigation/AdminNavigator';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminHome'>;

export default function AdminHomeScreen({ navigation }: Props) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.heading}>Admin Panel</Text>

      {/* Navigation Buttons */}
      <Text style={styles.sectionLabel}>Manage</Text>

      <NavCard
        icon="storefront-outline"
        label="Manage Shops"
        onPress={() => navigation.navigate('AdminShops')}
      />
      <NavCard
        icon="ribbon-outline"
        label="Manage Badges"
        onPress={() => navigation.navigate('AdminBadges')}
      />
      <NavCard
        icon="trophy-outline"
        label="Manage Challenges"
        onPress={() => navigation.navigate('AdminChallenges')}
      />
      <NavCard
        icon="bulb-outline"
        label="Manage Did You Know"
        onPress={() => navigation.navigate('AdminFacts')}
      />
      <NavCard
        icon="help-circle-outline"
        label="Manage FAQ"
        onPress={() => navigation.navigate('AdminFaqItems')}
      />
      <NavCard
        icon="document-text-outline"
        label="Manage Legal Content"
        onPress={() => navigation.navigate('AdminLegal')}
      />
      <NavCard
        icon="phone-portrait-outline"
        label="Manage Onboarding"
        onPress={() => navigation.navigate('AdminOnboarding')}
      />
      <NavCard
        icon="chatbubbles-outline"
        label="User Feedback"
        onPress={() => navigation.navigate('AdminFeedback')}
      />
      <NavCard
        icon="settings-outline"
        label="App Settings"
        onPress={() => navigation.navigate('AdminAppConfig')}
      />
      <NavCard
        icon="people-outline"
        label="Users"
        onPress={() => navigation.navigate('AdminUsers')}
      />
      <NavCard
        icon="share-social-outline"
        label="Social Links"
        onPress={() => navigation.navigate('AdminSocialLinks')}
      />
    </ScrollView>
  );
}

function NavCard({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.navCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.navCardLeft}>
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={22} color="#2D5016" />
        </View>
        <Text style={styles.navCardLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#ccc" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0ede8' },
  content: { paddingHorizontal: 20, paddingBottom: 48, paddingTop: 8 },

  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 20,
    marginTop: 8,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },

  navCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  navCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef4e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navCardLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
});
