import React, { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as PaperProvider } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "./screens/LoginScreen";
import MemberRegistration from "./screens/MemberRegistration";
import StaffTabs from "./screens/Staff/StaffTabs"; // 👈 tabs
import Home from "./screens/Home";

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const parsed = JSON.parse(userData);
          if (parsed.role === "staff") setInitialRoute("StaffTabs");
          else setInitialRoute("Home");
        } else {
          setInitialRoute("LoginScreen");
        }
      } catch (err) {
        console.error("Error checking login:", err);
        setInitialRoute("LoginScreen");
      }
    };
    checkLoginStatus();
  }, []);

  if (!initialRoute) return null;

  return (
    <PaperProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName={initialRoute}>
            <Stack.Screen
              name="LoginScreen"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="MemberRegistration"
              component={MemberRegistration}
            />
            <Stack.Screen
              name="Home"
              component={Home}
              options={{ title: "Member Home" }}
            />
            <Stack.Screen
              name="StaffTabs"
              component={StaffTabs}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </PaperProvider>
  );
}
