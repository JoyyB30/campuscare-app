import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FMNavigator from './src/navigation/FMNavigator';

// This is a TEMPORARY test entry point so Mohamed can test his screens alone.
// When Joy integrates, she will replace this with the full app navigation
// that checks user role after login and renders the correct navigator.

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* 
          For testing: goes straight to FM screens.
          In the real integrated app, Joy will add Login screen here
          and route to FMNavigator only when role === 'facility_manager'
        */}
        <Stack.Screen name="FM" component={FMNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
