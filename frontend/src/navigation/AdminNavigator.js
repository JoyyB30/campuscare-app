import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminUserListScreen from '../screens/admin/AdminUserListScreen';

const Stack = createNativeStackNavigator();

export default function AdminNavigator({ token }) {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AdminUserList"
        component={AdminUserListScreen}
        initialParams={{ token: token }}
        options={{ title: 'User Management' }}
      />
    </Stack.Navigator>
  );
}