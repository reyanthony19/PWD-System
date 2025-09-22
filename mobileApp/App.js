import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

// Import Screens
import Login from "./screens/Login";
import Register from "./screens/Register";

// Staff Screens
import StaffHome from "./screens/staff/StaffHome";
import Profile from "./screens/staff/Profile";
import EditProfile from "./screens/staff/EditProfile";
import About from "./screens/staff/About";
import Attendance from "./screens/staff/Attendance";
import BenefitAttendance from "./screens/staff/BenefitAttendance";
import Benefits from "./screens/staff/Benefits";
import BenefitScanner from "./screens/staff/BenefitScanner";
import Events from "./screens/staff/Events";
import Scanner from "./screens/staff/Scanner";
import MemberList from "./screens/staff/MemberList";
import Terms from "./screens/member/Terms";
// Member Screens
import MemberHome from "./screens/member/MemberHome";
import MemberProfile from "./screens/member/MemberProfile";
import MemberEditProfile from "./screens/member/MemberEditProfile";
import ContactUs from "./screens/member/ContactUs";
import MemberAttendance from "./screens/member/MemberAttendance";
import MemberEvents from "./screens/member/MemberEvents";
import MemberBenefits from "./screens/member/MemberBenefits";
import MemberBenefitRecord from "./screens/member/MemberBenefitsRecord";  

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(''); // Add state to store the user's role

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const userStr = await AsyncStorage.getItem("user");
        const user = userStr ? JSON.parse(userStr) : null;

        if (token && user?.role) {
          setUserRole(user.role); // Store the role
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

  if (loading || !initialRoute) return null; // You can show a splash screen here

  // Staff Flow: Tab Navigation
  const StaffFlow = () => {
    return (
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            } else if (route.name === 'Benefits') {
              iconName = focused ? 'folder' : 'folder-outline';
            } else if (route.name === 'About') {
              iconName = focused ? 'document-text' : 'document-text-outline';
            } else if (route.name === 'Events') {
              iconName = focused ? 'calendar' : 'calendar-outline';
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#2563eb',
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen name="Home" component={StaffHome} />
        <Tab.Screen name="Events" component={Events} />
        <Tab.Screen name="Benefits" component={Benefits} />
        <Tab.Screen name="Profile" component={Profile} />
        <Tab.Screen name="About" component={About} />
      </Tab.Navigator>
    );
  };

  // Member Flow: Tab Navigation
  const MemberFlow = () => {
    return (
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            } else if (route.name === 'Events') {
              iconName = focused ? 'calendar' : 'calendar-outline';
            } else if (route.name === 'About') {
              iconName = focused ? 'document-text' : 'document-text-outline';
            } else if (route.name === 'Benefits') {
              iconName = focused ? 'folder' : 'folder-outline';
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#2563eb',
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen name="Home" component={MemberHome} />
        <Tab.Screen name="Events" component={MemberEvents} />
        <Tab.Screen name="Benefits" component={MemberBenefits} />
        <Tab.Screen name="Profile" component={MemberProfile} />
        <Tab.Screen name="About" component={About} />
      </Tab.Navigator>
    );
  };

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerStyle: { backgroundColor: "#f3f4f6" },
          headerTintColor: "#2563eb",
          headerTitleStyle: { fontWeight: "bold", fontSize: 18 },
          headerTitleAlign: "center",
          animation: "slide_from_right",
          headerBackTitleVisible: false,
        }}
      >
        {/* Public Screens */}
        {initialRoute === "Login" && (
          <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
        )}
        {initialRoute === "Register" && (
          <Stack.Screen name="Register" component={Register} options={{ headerShown: false }} />
        )}

        {/* Staff Flow */}
        <Stack.Screen name="StaffFlow" options={{ headerShown: false }}>
          {() => <StaffFlow />}
        </Stack.Screen>

        {/* Member Flow */}
        <Stack.Screen name="MemberFlow" options={{ headerShown: false }}>
          {() => <MemberFlow />}
        </Stack.Screen>

        {/* STAFF SCREENS */}
        <Stack.Screen name="EditProfile" component={EditProfile} />
        <Stack.Screen name="BenefitAttendance" component={BenefitAttendance} />
        <Stack.Screen name="Scanner" component={Scanner} />
        <Stack.Screen name="Attendance" component={Attendance} />
        <Stack.Screen name="BenefitScanner" component={BenefitScanner} />
        <Stack.Screen name="MemberList" component={MemberList} />
        <Stack.Screen name="Register" component={Register} />

        {/* MEMBER SCREENS */}
        <Stack.Screen name="MemberEditProfile" component={MemberEditProfile} />
        <Stack.Screen name="MemberAttendance" component={MemberAttendance} />
        <Stack.Screen name="MemberBenefitRecord" component={MemberBenefitRecord} />
        <Stack.Screen name="Terms & Conditions" component={Terms} />
        <Stack.Screen name="Location" component={ContactUs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
