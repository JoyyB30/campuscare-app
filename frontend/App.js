import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import { getUser, getToken } from './src/services/api';

import FMNavigator from './src/navigation/FMNavigator';
import CMNavigator from './src/navigation/CMNavigator';
import WorkerNavigator from './src/navigation/WorkerNavigator';
import AdminNavigator from './src/navigation/AdminNavigator';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Login');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = await getToken();
    const user = await getUser();

    if (!token || !user) {
      setInitialRoute('Login');
      setLoading(false);
      return;
    }

    if (user.role === 'facility_manager') {
      setInitialRoute('FMApp');
    } else if (user.role === 'community_member') {
      setInitialRoute('CMApp');
    } else if (user.role === 'worker') {
      setInitialRoute('WorkerApp');
    } else if (user.role === 'admin') {
      setInitialRoute('AdminApp');
    } else {
      setInitialRoute('Login');
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F4EF' }}>
        <ActivityIndicator size="large" color="#0B1F3A" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />

        <Stack.Screen name="FMApp" component={FMNavigator} />
        <Stack.Screen name="CMApp" component={CMNavigator} />
        <Stack.Screen name="WorkerApp" component={WorkerNavigator} />
        <Stack.Screen name="AdminApp" component={AdminNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}