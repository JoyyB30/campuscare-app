import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AssignedIssuesScreen from '../screens/worker/AssignedIssuesScreen';
import IssueDetailScreen from '../screens/worker/IssueDetailScreen';

const Stack = createNativeStackNavigator();

export default function WorkerNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="AssignedIssues"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="AssignedIssues" component={AssignedIssuesScreen} />
      <Stack.Screen name="WorkerIssueDetail" component={IssueDetailScreen} />
    </Stack.Navigator>
  );
}