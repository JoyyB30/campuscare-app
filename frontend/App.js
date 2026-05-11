import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FMNavigator from './src/navigation/FMNavigator';
import { saveAuth } from './src/services/api';

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    // TEMPORARY ONLY FOR TESTING FM SCREENS.
    // Remove this later when the real login screen is connected.
    saveAuth(
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6ImZhY2lsaXR5X21hbmFnZXIiLCJpYXQiOjE3Nzg1MjI1MzIsImV4cCI6MTc3ODUyOTczMn0.vpMU--DOCileO8e3smdG7Y9jlNjJoCqdelW9w3HOiRE',
      {
        id: 4,
        role: 'facility_manager',
        username: 'manager1',
        email: 'manager1@example.com',
      }
    );
  }, []);

  return (
    <NavigationContainer
      documentTitle={{
        formatter: () => 'CampusCare',
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="CampusCare" component={FMNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}