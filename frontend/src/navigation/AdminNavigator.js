import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AdminUserListScreen from '../screens/admin/AdminUserListScreen';

const Stack = createNativeStackNavigator();

export default function AdminNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="AdminUserList"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="AdminUserList" component={AdminUserListScreen} />
    </Stack.Navigator>
  );
}