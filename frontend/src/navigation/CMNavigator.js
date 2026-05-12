// src/navigation/CMNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/community/HomeScreen';
import SubmitIssueScreen from '../screens/community/SubmitIssueScreen';
import MyIssuesScreen from '../screens/community/MyIssuesScreen';
import IssueStatusScreen from '../screens/community/IssueStatusScreen';
import IssueDetailScreen from '../screens/community/IssueDetailScreen';

const Stack = createNativeStackNavigator();

export default function CMNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="CMHome"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="CMHome" component={HomeScreen} />
      <Stack.Screen name="SubmitIssue" component={SubmitIssueScreen} />
      <Stack.Screen name="MyIssues" component={MyIssuesScreen} />
      <Stack.Screen name="IssueStatus" component={IssueStatusScreen} />
      <Stack.Screen name="IssueDetail" component={IssueDetailScreen} />
    </Stack.Navigator>
  );
}