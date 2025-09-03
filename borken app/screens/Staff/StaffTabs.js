import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Appbar } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import EventsStack from "./EventStack"; 
import BenefitScreen from "./BenefitScreen";
import ProfileScreen from "./ProfileScreen";

const Tab = createBottomTabNavigator();

function CustomHeader({ navigation, route, options }) {
  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.replace("LoginScreen");
  };

  return (
    <Appbar.Header>
      <Appbar.Content title={options.title || route.name} />
      <Appbar.Action icon="logout" onPress={handleLogout} />
    </Appbar.Header>
  );
}

export default function StaffTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        header: (props) => <CustomHeader {...props} />,
        tabBarShowLabel: true,
      }}
    >
      <Tab.Screen
        name="Events"
        component={EventsStack} // ✅ stack instead of plain screen
        options={{
          title: "Events",
          tabBarIcon: ({ color, size }) => (
            <Icon name="calendar" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Benefits"
        component={BenefitScreen}
        options={{
          title: "Benefits",
          tabBarIcon: ({ color, size }) => (
            <Icon name="gift" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Icon name="account" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
