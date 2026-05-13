import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import FMDashboardScreen from '../screens/manager/FMDashboardScreen';
import FMIssueDetailScreen from '../screens/manager/FMIssueDetailScreen';

const Stack = createNativeStackNavigator();

export default function FMNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="FMDashboard"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="FMDashboard" component={FMDashboardScreen} />
      <Stack.Screen name="FMIssueDetail" component={FMIssueDetailScreen} />
    </Stack.Navigator>
  );
}