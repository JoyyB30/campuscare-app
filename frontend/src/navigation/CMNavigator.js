import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/member/HomeScreen';
import SubmitIssueScreen from '../screens/member/SubmitIssueScreen';
import MyIssuesScreen from '../screens/member/MyIssuesScreen';
import IssueStatusScreen from '../screens/member/IssueStatusScreen';
import IssueDetailScreen from '../screens/member/IssueDetailScreen';

const Stack = createNativeStackNavigator();

export default function CMNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="CMHome"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="CMHome" component={HomeScreen} />
      <Stack.Screen name="SubmitIssue" component={SubmitIssueScreen} />
      <Stack.Screen name="MyIssues" component={MyIssuesScreen} />
      <Stack.Screen name="IssueStatus" component={IssueStatusScreen} />
      <Stack.Screen name="IssueDetail" component={IssueDetailScreen} />
    </Stack.Navigator>
  );
}