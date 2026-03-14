import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CommunityScreen from '../screens/Community/CommunityScreen';
import GroupDetailScreen from '../screens/Community/GroupDetailScreen';
import CreateGroupScreen from '../screens/Community/CreateGroupScreen';
import JoinGroupScreen from '../screens/Community/JoinGroupScreen';
import GroupChallengeFormScreen from '../screens/Community/GroupChallengeFormScreen';

export type CommunityStackParamList = {
  CommunityHome: undefined;
  GroupDetail: { groupId: string; groupName: string; inviteCode?: string; createdBy: string; requiresConfirmation?: boolean; initialTab?: 'meetups' | 'leaderboard' | 'members' };
  CreateGroup: undefined;
  JoinGroup: undefined;
  GroupChallengeForm: { groupId: string; challengeId?: string };
};

const Stack = createNativeStackNavigator<CommunityStackParamList>();

export default function CommunityNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleStyle: { fontSize: 22 } }}>
      <Stack.Screen name="CommunityHome" component={CommunityScreen} options={{ title: 'Community' }} />
      <Stack.Screen name="GroupDetail" component={GroupDetailScreen} options={{ title: '' }} />
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ title: 'Create Group' }} />
      <Stack.Screen name="JoinGroup" component={JoinGroupScreen} options={{ title: 'Join Group' }} />
      <Stack.Screen name="GroupChallengeForm" component={GroupChallengeFormScreen} />
    </Stack.Navigator>
  );
}
