import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
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
import MemberEditDocument from "./screens/member/MemberEditDocument";

import { EventIndicator } from "./utils/eventIndicator";
import { BenefitIndicator } from "./utils/benefitIndicator";

const Tab = createBottomTabNavigator();

// Custom hook for event indicator
const useEventIndicator = () => {
  const [eventIndicator, setEventIndicator] = useState({ hasNew: false, count: 0 });

  useEffect(() => {
    const loadIndicator = async () => {
      const indicator = await EventIndicator.getEventIndicator();
      setEventIndicator(indicator);
    };

    loadIndicator();

    // Set up an interval to check for updates
    const interval = setInterval(loadIndicator, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return eventIndicator;
};

// Custom hook for benefit indicator
const useBenefitIndicator = () => {
  const [benefitIndicator, setBenefitIndicator] = useState({ hasNew: false, count: 0 });

  useEffect(() => {
    const loadIndicator = async () => {
      const indicator = await BenefitIndicator.getBenefitIndicator();
      setBenefitIndicator(indicator);
    };

    loadIndicator();

    // Set up an interval to check for updates
    const interval = setInterval(loadIndicator, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return benefitIndicator;
};

// Custom Tab Bar Icon Component with Indicator
const TabBarIcon = ({ focused, iconName, label, type = 'ionicons', hasIndicator = false, indicatorCount = 0 }) => {
  const IconComponent = type === 'material' ? MaterialCommunityIcons : Ionicons;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 4 }}>
      <View style={{ position: 'relative' }}>
        <IconComponent
          name={iconName}
          size={24}
          color={focused ? '#2563eb' : '#9ca3af'}
        />
        {hasIndicator && (
          <View style={[
            styles.indicator,
            indicatorCount > 0 ? styles.indicatorWithCount : styles.indicatorDot
          ]}>
            {indicatorCount > 0 ? (
              <Text style={styles.indicatorText}>
                {indicatorCount > 9 ? '9+' : indicatorCount}
              </Text>
            ) : null}
          </View>
        )}
      </View>
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

// Staff Main Tabs
const StaffMainTabs = () => {
  const eventIndicator = useEventIndicator();
  const benefitIndicator = useBenefitIndicator(); // Add benefit indicator

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: 60,
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
              hasIndicator={eventIndicator.hasNew}
              indicatorCount={eventIndicator.count}
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            EventIndicator.clearEventIndicator();
          },
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
              hasIndicator={benefitIndicator.hasNew}
              indicatorCount={benefitIndicator.count}
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            BenefitIndicator.clearBenefitIndicator();
          },
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

// Staff Flow with hidden screens
const StaffFlow = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
        tabBarButton: () => null,
      }}
    >
      <Tab.Screen name="StaffMainTabs" component={StaffMainTabs} />
      <Tab.Screen name="Attendance" component={Attendance} />
      <Tab.Screen name="EditProfile" component={EditProfile} />
      <Tab.Screen name="BenefitAttendance" component={BenefitAttendance} />
      <Tab.Screen name="Scanner" component={Scanner} />
      <Tab.Screen name="BenefitScanner" component={BenefitScanner} />
      <Tab.Screen name="About" component={About} />
    </Tab.Navigator>
  );
};

// Member Main Tabs
const MemberMainTabs = () => {
  const eventIndicator = useEventIndicator();
  const benefitIndicator = useBenefitIndicator(); // Add benefit indicator

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: 60,
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
              hasIndicator={eventIndicator.hasNew}
              indicatorCount={eventIndicator.count}
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            EventIndicator.clearEventIndicator();
          },
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
              hasIndicator={benefitIndicator.hasNew}
              indicatorCount={benefitIndicator.count}
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            BenefitIndicator.clearBenefitIndicator();
          },
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

// Member Flow with hidden screens
const MemberFlow = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
        tabBarButton: () => null,
      }}
    >
      <Tab.Screen name="MemberMainTabs" component={MemberMainTabs} />
      <Tab.Screen name="MemberEditProfile" component={MemberEditProfile} />
      <Tab.Screen name="MemberAttendance" component={MemberAttendance} />
      <Tab.Screen name="MemberBenefitsRecord" component={MemberBenefitsRecord} />
      <Tab.Screen name="Terms" component={Terms} />
      <Tab.Screen name="ContactUs" component={ContactUs} />
      <Tab.Screen name="MemberEditDocument" component={MemberEditDocument} />
    </Tab.Navigator>
  );
};

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

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#2563eb" />
      <Tab.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
          tabBarButton: () => null,
        }}
      >
        {/* Public Screens */}
        <Tab.Screen name="Login" component={Login} />
        <Tab.Screen name="Register" component={Register} />
        <Tab.Screen name="RegistrationSuccess" component={RegistrationSuccess} />

        {/* Main Flows */}
        <Tab.Screen name="StaffFlow" component={StaffFlow} />
        <Tab.Screen name="MemberFlow" component={MemberFlow} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = {
  indicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorDot: {
    width: 8,
    height: 8,
  },
  indicatorWithCount: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
  },
  indicatorText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
};