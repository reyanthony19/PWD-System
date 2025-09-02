import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./screens/LoginScreen";
import MemberRegistration from "./screens/MemberRegistration";
import Home from "./screens/Home";
import StaffHome from "./screens/StaffHome";
import Header from "./screens/Header";
import { SafeAreaProvider } from "react-native";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Header />
        <Stack.Navigator initialRouteName="LoginScreen">
          {/* Public Screens */}
          <Stack.Screen
            name="LoginScreen"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="MemberRegistration" component={MemberRegistration} />

          {/* Role-based Screens */}
          <Stack.Screen
            name="Home"
            component={Home}
            options={{ title: "Member Home" }}
          />
          <Stack.Screen
            name="StaffHome"
            component={StaffHome}
            options={{ title: "Staff Dashboard" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
