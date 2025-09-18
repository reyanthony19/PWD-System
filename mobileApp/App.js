import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Screens
import Login from "./screens/Login";
import Register from "./screens/Register";
import StaffHome from "./screens/staff/StaffHome";
import MemberHome from "./screens/member/MemberHome";
import Profile from "./screens/staff/Profile";
import About from "./screens/staff/About";
import Benefits from "./screens/staff/Benefits";
import Events from "./screens/staff/Events";
import Scanner from "./screens/staff/Scanner";
import BenefitScanner from "./screens/staff/BenefitScanner";
import Attendance from "./screens/staff/Attendance";
import BenefitAttendance from "./screens/staff/BenefitAttendance";
import EditProfile from "./screens/staff/EditProfile";
import MemberEditProfile from "./screens/member/MemberEditProfile";
import MemberProfile from "./screens/member/MemberProfile";

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState("Login");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const userStr = await AsyncStorage.getItem("user");
        const user = userStr ? JSON.parse(userStr) : null;

        if (token && user?.role) {
          if (user.role === "staff") {
            setInitialRoute("StaffHome");
          } else if (user.role === "member") {
            setInitialRoute("MemberHome");
          }
        } else {
          setInitialRoute("Login");
        }
      } catch (err) {
        console.log("Auth check failed:", err);
        setInitialRoute("Login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) return null; // You can put a splash screen here

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        {/* Public */}
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />

        {/* Staff */}
        <Stack.Screen name="StaffHome" component={StaffHome} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="About" component={About} />
        <Stack.Screen name="Benefits" component={Benefits} />
        <Stack.Screen name="Events" component={Events} />
        <Stack.Screen name="Attendance" component={Attendance} />
        <Stack.Screen name="BenefitAttendance" component={BenefitAttendance} />
        <Stack.Screen name="EditProfile" component={EditProfile} />

        {/* Scanners */}
        <Stack.Screen name="Scanner" component={Scanner} />
        <Stack.Screen name="BenefitScanner" component={BenefitScanner} />

        {/* Member */}
        <Stack.Screen name="MemberHome" component={MemberHome} />
        <Stack.Screen name="MemberProfile" component={MemberProfile} />
        <Stack.Screen name="MemberEditProfile" component={MemberEditProfile} />



      </Stack.Navigator>
    </NavigationContainer>
  );
}
