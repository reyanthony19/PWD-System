import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, Text, StatusBar } from "react-native";

// Import Screens
import Login from "./screens/Login";
import Register from "./screens/Register";

// Staff Screens
import StaffHome from "./screens/staff/StaffHome";
import Profile from "./screens/staff/Profile";
import About from "./screens/staff/About";
import Attendance from "./screens/staff/Attendance";
import Benefits from "./screens/staff/Benefits";
import Events from "./screens/staff/Events";
import EditProfile from "./screens/staff/EditProfile";
import BenefitAttendance from "./screens/staff/BenefitAttendance";
import Scanner from "./screens/staff/Scanner";
import BenefitScanner from "./screens/staff/BenefitScanner";
import MemberList from "./screens/staff/MemberList";

// Member Screens
import MemberHome from "./screens/member/MemberHome";
import MemberProfile from "./screens/member/MemberProfile";
import MemberEditProfile from "./screens/member/MemberEditProfile";
import MemberEvents from "./screens/member/MemberEvents";
import MemberBenefits from "./screens/member/MemberBenefits";
import MemberAttendance from "./screens/member/MemberAttendance";
import MemberBenefitsRecord from "./screens/member/MemberBenefitsRecord";
import Terms from "./screens/member/Terms";
import ContactUs from "./screens/member/ContactUs";
import RegistrationSuccess from "./screens/RegistrationSuccess";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const userStr = await AsyncStorage.getItem("user");
        const user = userStr ? JSON.parse(userStr) : null;

        if (token && user?.role) {
          setUserRole(user.role);
          setInitialRoute(user.role === "staff" ? "StaffFlow" : "MemberFlow");
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

  if (loading || !initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#667eea' }}>
        <MaterialCommunityIcons name="heart-circle" size={64} color="#fff" />
        <Text style={{ color: '#fff', fontSize: 18, marginTop: 16, fontWeight: '600' }}>
          Loading...
        </Text>
      </View>
    );
  }

  // Custom Tab Bar Icon Component
  const TabBarIcon = ({ focused, iconName, label, type = 'ionicons' }) => {
    const IconComponent = type === 'material' ? MaterialCommunityIcons : Ionicons;

    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 4 }}>
        <IconComponent
          name={iconName}
          size={24}
          color={focused ? '#2563eb' : '#9ca3af'}
        />
        <Text
          style={{
            fontSize: 10,
            marginTop: 2,
            color: focused ? '#2563eb' : '#9ca3af',
            fontWeight: focused ? '600' : '400'
          }}
        >
          {label}
        </Text>
      </View>
    );
  };

  // Staff Flow: Tab Navigation - COMPLETELY HEADERLESS
  const StaffFlow = () => {
    return (
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false, // No headers in tab navigator
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#e5e7eb',
            height: 60, // Reduced tab bar height
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: '#2563eb',
          tabBarInactiveTintColor: '#9ca3af',
        }}
      >
        <Tab.Screen
          name="Home"
          component={StaffHome}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabBarIcon
                focused={focused}
                iconName={focused ? 'home' : 'home-outline'}
                label=""
              />
            ),
          }}
        />
        <Tab.Screen
          name="Events"
          component={Events}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabBarIcon
                focused={focused}
                iconName={focused ? 'calendar' : 'calendar-outline'}
                label=""
              />
            ),
          }}
        />
        <Tab.Screen
          name="Benefits"
          component={Benefits}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabBarIcon
                focused={focused}
                iconName={focused ? 'gift' : 'gift-outline'}
                label=""
              />
            ),
          }}
        />
        <Tab.Screen
          name="Members"
          component={MemberList}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabBarIcon
                focused={focused}
                iconName={focused ? 'people' : 'people-outline'}
                label=""
              />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={Profile}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabBarIcon
                focused={focused}
                iconName={focused ? 'person' : 'person-outline'}
                label=""
              />
            ),
          }}
        />
      </Tab.Navigator>
    );
  };

  // Member Flow: Tab Navigation - COMPLETELY HEADERLESS
  const MemberFlow = () => {
    return (
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false, // No headers in tab navigator
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#e5e7eb',
            height: 60, // Reduced tab bar height
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: '#2563eb',
          tabBarInactiveTintColor: '#9ca3af',
        }}
      >
        <Tab.Screen
          name="Home"
          component={MemberHome}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabBarIcon
                focused={focused}
                iconName={focused ? 'home' : 'home-outline'}
                label=""
              />
            ),
          }}
        />
        <Tab.Screen
          name="Events"
          component={MemberEvents}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabBarIcon
                focused={focused}
                iconName={focused ? 'calendar' : 'calendar-outline'}
                label=""
              />
            ),
          }}
        />
        <Tab.Screen
          name="Benefits"
          component={MemberBenefits}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabBarIcon
                focused={focused}
                iconName={focused ? 'gift' : 'gift-outline'}
                label=""
              />
            ),
          }}
        />
        <Tab.Screen
          name="About"
          component={About}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabBarIcon
                focused={focused}
                iconName={focused ? 'information-circle' : 'information-circle-outline'}
                label=""
              />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={MemberProfile}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabBarIcon
                focused={focused}
                iconName={focused ? 'person' : 'person-outline'}
                label=""
              />
            ),
          }}
        />
      </Tab.Navigator>
    );
  };

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#2563eb" />
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          // ULTRA COMPACT HEADER SETTINGS
          headerStyle: {
            backgroundColor: "#2563eb",
            shadowColor: "transparent", // Remove shadow
            elevation: 0, // Remove elevation on Android
            height: 50, // Even more compact - from 60px to 50px
          },
          headerTintColor: "#ffffff",
          headerTitleStyle: {
            fontWeight: "600",
            fontSize: 16,
          },
          headerTitleAlign: "center",
          animation: "slide_from_right",
          headerBackTitleVisible: false,
          contentStyle: { backgroundColor: '#f8fafc' },
          headerBackButtonMenuEnabled: false,
        }}
      >
        {/* Public Screens */}
        <Stack.Screen
          name="Login"
          component={Login}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="Register"
          component={Register}
          options={{
            headerShown: true,
            title: 'Create Account',
            headerStyle: {
              backgroundColor: "#2563eb",
              height: 50,
              shadowColor: "transparent",
              elevation: 0,
            },
          }}
        />

        <Stack.Screen
          name="RegistrationSuccess"
          component={RegistrationSuccess}
          options={{ headerShown: false }}
        />

        {/* Main Flows - No Headers */}
        <Stack.Screen
          name="StaffFlow"
          component={StaffFlow}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="MemberFlow"
          component={MemberFlow}
          options={{ headerShown: false }}
        />

        {/* Staff Screens - ULTRA COMPACT HEADERS */}
        <Stack.Screen
          name="Attendance"
          component={Attendance}
          options={{ 
            title: 'Event Attendance',
            headerStyle: {
              backgroundColor: "#2563eb",
              height: 48, // Ultra compact
              shadowColor: "transparent",
              elevation: 0,
            },
          }}
        />

        <Stack.Screen
          name="EditProfile"
          component={EditProfile}
          options={{ 
            title: 'Edit Profile',
            headerStyle: {
              backgroundColor: "#2563eb",
              height: 48,
              shadowColor: "transparent",
              elevation: 0,
            },
          }}
        />

        <Stack.Screen
          name="BenefitAttendance"
          component={BenefitAttendance}
          options={{ 
            title: 'Benefit Claims',
            headerStyle: {
              backgroundColor: "#2563eb",
              height: 48,
              shadowColor: "transparent",
              elevation: 0,
            },
          }}
        />

        <Stack.Screen
          name="Scanner"
          component={Scanner}
          options={{ 
            title: 'QR Scanner',
            headerStyle: {
              backgroundColor: "#2563eb",
              height: 48,
              shadowColor: "transparent",
              elevation: 0,
            },
          }}
        />

        <Stack.Screen
          name="BenefitScanner"
          component={BenefitScanner}
          options={{ 
            title: 'Benefit QR Scanner',
            headerStyle: {
              backgroundColor: "#2563eb",
              height: 48,
              shadowColor: "transparent",
              elevation: 0,
            },
          }}
        />

        <Stack.Screen
          name="MemberList"
          component={MemberList}
          options={{ 
            title: 'Member Directory',
            headerStyle: {
              backgroundColor: "#2563eb",
              height: 48,
              shadowColor: "transparent",
              elevation: 0,
            },
          }}
        />

        {/* Member Screens - ULTRA COMPACT HEADERS */}
        <Stack.Screen
          name="MemberEditProfile"
          component={MemberEditProfile}
          options={{ 
            title: 'Edit Profile',
            headerStyle: {
              backgroundColor: "#2563eb",
              height: 48,
              shadowColor: "transparent",
              elevation: 0,
            },
          }}
        />

        <Stack.Screen
          name="MemberAttendance"
          component={MemberAttendance}
          options={{ 
            title: 'Event Details',
            headerStyle: {
              backgroundColor: "#2563eb",
              height: 48,
              shadowColor: "transparent",
              elevation: 0,
            },
          }}
        />

        <Stack.Screen
          name="MemberBenefitsRecord"
          component={MemberBenefitsRecord}
          options={{ 
            title: 'Benefit Records',
            headerStyle: {
              backgroundColor: "#2563eb",
              height: 48,
              shadowColor: "transparent",
              elevation: 0,
            },
          }}
        />

        <Stack.Screen
          name="Terms"
          component={Terms}
          options={{ 
            title: 'Terms & Conditions',
            headerStyle: {
              backgroundColor: "#2563eb",
              height: 48,
              shadowColor: "transparent",
              elevation: 0,
            },
          }}
        />

        <Stack.Screen
          name="ContactUs"
          component={ContactUs}
          options={{ 
            title: 'Contact Us',
            headerStyle: {
              backgroundColor: "#2563eb",
              height: 48,
              shadowColor: "transparent",
              elevation: 0,
            },
          }}
        />

        {/* Shared Screens - ULTRA COMPACT HEADERS */}
        <Stack.Screen
          name="Profile"
          component={Profile}
          options={{ 
            title: 'Profile',
            headerStyle: {
              backgroundColor: "#2563eb",
              height: 48,
              shadowColor: "transparent",
              elevation: 0,
            },
          }}
        />

        <Stack.Screen
          name="About"
          component={About}
          options={{ 
            title: 'About PDAO',
            headerStyle: {
              backgroundColor: "#2563eb",
              height: 48,
              shadowColor: "transparent",
              elevation: 0,
            },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}