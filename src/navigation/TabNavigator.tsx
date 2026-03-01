import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/Home/HomeScreen';
import DiscoverNavigator from './DiscoverNavigator';
import CheckInScreen from '../screens/CheckIn/CheckInScreen';
import JourneyScreen from '../screens/Journey/JourneyScreen';
import CommunityScreen from '../screens/Community/CommunityScreen';

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
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="Discover"
        component={DiscoverNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen name="CheckIn" component={CheckInScreen} />
      <Tab.Screen name="Journey" component={JourneyScreen} />
      <Tab.Screen name="Community" component={CommunityScreen} />
    </Tab.Navigator>
  );
}
