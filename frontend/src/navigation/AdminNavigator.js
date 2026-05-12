import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AdminUserListScreen from '../screens/AdminUserListScreen';

const Stack = createNativeStackNavigator();

export default function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminUserList" component={AdminUserListScreen} />
    </Stack.Navigator>
  );
}