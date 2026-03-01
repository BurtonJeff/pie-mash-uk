import React from 'react';
import { TouchableOpacity, View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeNavigator from './HomeNavigator';
import DiscoverNavigator from './DiscoverNavigator';
import CheckInScreen from '../screens/CheckIn/CheckInScreen';
import JourneyNavigator from './JourneyNavigator';
import CommunityNavigator from './CommunityNavigator';

export type TabParamList = {
  Home: undefined;
  Discover: undefined;
  CheckIn: undefined;
  Journey: undefined;
  Community: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const ACTIVE = '#2D5016';
const INACTIVE = '#aaa';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(focused: IoniconName, unfocused: IoniconName) {
  return ({ focused: f, color, size }: { focused: boolean; color: string; size: number }) => (
    <Ionicons name={f ? focused : unfocused} size={size} color={color} />
  );
}

/** Raised green circle for the central Check In action */
function CheckInButton({
  onPress,
  onLongPress,
  accessibilityRole,
  accessibilityState,
  testID,
}: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      testID={testID}
      style={styles.checkInWrap}
      activeOpacity={0.82}
    >
      <View style={styles.checkInCircle}>
        <Ionicons name="add" size={32} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeNavigator}
        options={{
          headerShown: false,
          tabBarIcon: tabIcon('home', 'home-outline'),
        }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverNavigator}
        options={{
          headerShown: false,
          tabBarIcon: tabIcon('compass', 'compass-outline'),
        }}
      />
      <Tab.Screen
        name="CheckIn"
        component={CheckInScreen}
        options={{
          headerShown: false,
          tabBarLabel: () => null,
          tabBarIcon: () => null,
          tabBarButton: (props) => <CheckInButton {...props} />,
        }}
      />
      <Tab.Screen
        name="Journey"
        component={JourneyNavigator}
        options={{
          headerShown: false,
          tabBarIcon: tabIcon('person', 'person-outline'),
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityNavigator}
        options={{
          headerShown: false,
          tabBarIcon: tabIcon('people', 'people-outline'),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 0,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 16,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  checkInWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 0,
  },
  checkInCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ACTIVE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
    shadowColor: ACTIVE,
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 10,
  },
});
