import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import MemberLogin from './screens/MemberLogin';
import MemberRegistration from './screens/MemberRegistration';


const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="MemberLogin">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="MemberLogin" component={MemberLogin} />
        <Stack.Screen name="MemberRegistration" component={MemberRegistration} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
