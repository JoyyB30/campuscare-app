import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AssignedIssuesScreen from '../screens/AssignedIssuesScreen';
import IssueDetailScreen from '../screens/IssueDetailScreen';

const Stack = createNativeStackNavigator();

export default function WorkerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AssignedIssues" component={AssignedIssuesScreen} />
      <Stack.Screen name="WorkerIssueDetail" component={IssueDetailScreen} />
    </Stack.Navigator>
  );
}