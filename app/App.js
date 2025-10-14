import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, Text } from "react-native";

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
import Terms from "./screens/member/Terms";
import ContactUs from "./screens/member/ContactUs";

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

  // Staff Flow: Tab Navigation
  const StaffFlow = () => {
    return (
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={{
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#e5e7eb',
            height: 70,
            paddingBottom: 8,
            paddingTop: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 8,
          },
          tabBarActiveTintColor: '#2563eb',
          tabBarInactiveTintColor: '#9ca3af',
          headerStyle: { 
            backgroundColor: '#2563eb',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: { 
            fontWeight: 'bold', 
            fontSize: 20,
          },
          headerTitleAlign: 'center',
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
            title: 'Staff Dashboard',
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
            title: 'Event Management',
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
            title: 'Benefits Management',
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
            title: 'Member Management',
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
            title: 'My Profile',
          }}
        />
      </Tab.Navigator>
    );
  };

  // Member Flow: Tab Navigation
  const MemberFlow = () => {
    return (
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={{
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#e5e7eb',
            height: 70,
            paddingBottom: 8,
            paddingTop: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 8,
          },
          tabBarActiveTintColor: '#2563eb',
          tabBarInactiveTintColor: '#9ca3af',
          headerStyle: { 
            backgroundColor: '#2563eb',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: { 
            fontWeight: 'bold', 
            fontSize: 20,
          },
          headerTitleAlign: 'center',
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
            title: 'Dashboard',
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
            title: 'My Events',
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
            title: 'My Benefits',
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
            title: 'About PDAO',
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
            title: 'My Profile',
          }}
        />
      </Tab.Navigator>
    );
  };

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerStyle: { 
            backgroundColor: "#2563eb",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          },
          headerTintColor: "#ffffff",
          headerTitleStyle: { 
            fontWeight: "bold", 
            fontSize: 18,
          },
          headerTitleAlign: "center",
          animation: "slide_from_right",
          headerBackTitleVisible: false,
          contentStyle: { backgroundColor: '#f8fafc' },
        }}
      >
        {/* Public Screens */}
        {initialRoute === "Login" && (
          <Stack.Screen 
            name="Login" 
            component={Login} 
            options={{ headerShown: false }} 
          />
        )}
        
        <Stack.Screen 
          name="Register" 
          component={Register} 
          options={{ 
            headerShown: true,
            title: 'Create Account',
          }} 
        />

        {/* Staff Flow */}
        <Stack.Screen 
          name="StaffFlow" 
          options={{ headerShown: false }}
        >
          {() => <StaffFlow />}
        </Stack.Screen>

        {/* Member Flow */}
        <Stack.Screen 
          name="MemberFlow" 
          options={{ headerShown: false }}
        >
          {() => <MemberFlow />}
        </Stack.Screen>

        {/* Staff Screens */}
        <Stack.Screen 
          name="Attendance" 
          component={Attendance} 
          options={{ title: 'Event Attendance' }}
        />
        <Stack.Screen 
          name="EditProfile" 
          component={EditProfile} 
          options={{ title: 'Edit Profile' }}
        />
        <Stack.Screen 
          name="BenefitAttendance" 
          component={BenefitAttendance} 
          options={{ title: 'Benefit Claims' }}
        />
        <Stack.Screen 
          name="Scanner" 
          component={Scanner} 
          options={{ title: 'QR Scanner' }}
        />
        <Stack.Screen 
          name="BenefitScanner" 
          component={BenefitScanner} 
          options={{ title: 'Benefit QR Scanner' }}
        />
        <Stack.Screen 
          name="MemberList" 
          component={MemberList} 
          options={{ title: 'Member Directory' }}
        />

        {/* Member Screens */}
        <Stack.Screen 
          name="MemberEditProfile" 
          component={MemberEditProfile} 
          options={{ title: 'Edit Profile' }}
        />
        <Stack.Screen 
          name="Terms & Conditions" 
          component={Terms} 
          options={{ title: 'Terms & Conditions' }}
        />
        <Stack.Screen 
          name="Visit Us" 
          component={ContactUs} 
          options={{ title: 'Contact Us' }}
        />
        
        {/* Shared Screens */}
        <Stack.Screen 
          name="Profile" 
          component={Profile} 
          options={{ title: 'Profile' }}
        />
        <Stack.Screen 
          name="About" 
          component={About} 
          options={{ title: 'About PDAO' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}