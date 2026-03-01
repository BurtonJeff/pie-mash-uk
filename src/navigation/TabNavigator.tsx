import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

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

export default function TabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeNavigator} options={{ headerShown: false }} />
      <Tab.Screen
        name="Discover"
        component={DiscoverNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen name="CheckIn" component={CheckInScreen} />
      <Tab.Screen name="Journey" component={JourneyNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="Community" component={CommunityNavigator} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}
