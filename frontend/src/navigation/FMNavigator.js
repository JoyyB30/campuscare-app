import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import FMDashboardScreen from '../screens/FMDashboardScreen';
import FMIssueDetailScreen from '../screens/FMIssueDetailScreen';

const Stack = createNativeStackNavigator();

export default function FMNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FMDashboard" component={FMDashboardScreen} />
      <Stack.Screen name="FMIssueDetail" component={FMIssueDetailScreen} />
    </Stack.Navigator>
  );
}