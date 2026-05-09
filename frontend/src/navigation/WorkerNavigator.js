import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AssignedIssuesScreen from '../screens/worker/AssignedIssuesScreen';
import IssueDetailScreen from '../screens/worker/IssueDetailScreen';

const Stack = createNativeStackNavigator();

export default function WorkerNavigator({ token }) {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AssignedIssues"
        component={AssignedIssuesScreen}
        initialParams={{ token: token }}
        options={{ title: 'My Tasks' }}
      />
      <Stack.Screen
        name="IssueDetail"
        component={IssueDetailScreen}
        options={{ title: 'Issue Detail' }}
      />
    </Stack.Navigator>
  );
}