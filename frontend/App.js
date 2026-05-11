import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FMNavigator from './src/navigation/FMNavigator';

// ─────────────────────────────────────────────────────────────────
// TEMPORARY TEST FILE — Mohamed's standalone test
// When Joy integrates, she will:
//   1. Keep her RootNavigator that shows Login first
//   2. After login, if user.role === 'facility_manager'
//      → navigate to FMNavigator from src/navigation/FMNavigator.js
// ─────────────────────────────────────────────────────────────────

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="FM" component={FMNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
