import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import WorkerNavigator from './src/navigation/WorkerNavigator';

const TEST_TOKEN = 'your_jwt_token_here';

export default function App() {
  return (
    <NavigationContainer>
      <WorkerNavigator token={TEST_TOKEN} />
    </NavigationContainer>
  );
}