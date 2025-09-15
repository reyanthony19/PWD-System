// app/(staff)/_layout.js
import React from "react";
import { Drawer } from "expo-router/drawer";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Dimensions, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function StaffLayout() {
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get("window").width;
  const router = useRouter();

  return (
    <Drawer
      screenOptions={{
        headerStyle: {
          backgroundColor: "#2563eb",
        },
        headerTintColor: "#fff",
        drawerActiveTintColor: "#2563eb",
        drawerInactiveTintColor: "#64748b",
        drawerType: "front",
        drawerStyle: {
          width: screenWidth * 0.7,
          backgroundColor: "white",
          paddingTop: insets.top,
          borderTopRightRadius: 20,
          borderBottomRightRadius: 20,
        },
        headerRight: () => (
          <TouchableOpacity
            style={{ marginRight: 16 }}
            onPress={() => router.push("staff/Profile")}
          >
            <Ionicons name="person-circle" size={32} color="#fff" />
          </TouchableOpacity>
        ),
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: "Home",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home" size={size + 2} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="Benefits"
        options={{
          title: "Benefits",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="gift" size={size + 2} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="Events"
        options={{
          title: "Events",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size + 2} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="About"
        options={{
          title: "About",
          drawerIcon: ({ color, size }) => (
            <Ionicons
              name="information-circle"
              size={size + 2}
              color={color}
            />
          ),
        }}
      />

      {/* Hidden routes (not shown in drawer menu) */}
      <Drawer.Screen
        name="scanner/index"
        options={{ drawerItemStyle: { display: "none" } }}
      />
      <Drawer.Screen
        name="scanner/BenefitScanner"
        options={{ drawerItemStyle: { display: "none" } }}
      />
      <Drawer.Screen
        name="Attendance"
        options={{ drawerItemStyle: { display: "none" } }}
      />
      <Drawer.Screen
        name="BenefitAttendance"
        options={{ drawerItemStyle: { display: "none" } }}
      />
      <Drawer.Screen
        name="EditProfile"
        options={{ drawerItemStyle: { display: "none" } }}
      />

      <Drawer.Screen
        name="Profile"
        options={{ drawerItemStyle: { display: "none" } }}
      />
    </Drawer>
  );
}
