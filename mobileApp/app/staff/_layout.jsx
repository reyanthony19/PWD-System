// app/(staff)/_layout.js
import React from "react";
import { Drawer } from "expo-router/drawer";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Dimensions } from "react-native";

export default function StaffLayout() {
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get("window").width;

  return (
    <Drawer
      screenOptions={{
        headerStyle: {
          backgroundColor: "#2563eb", // blue header
        },
        headerTintColor: "#fff",
        drawerActiveTintColor: "#2563eb",
        drawerInactiveTintColor: "#64748b",
        drawerType: "front", // can also try "slide" for smoother feel
        drawerStyle: {
          width: screenWidth * 0.7, // ✅ drawer takes only 70% of screen
          backgroundColor: "white",
          paddingTop: insets.top,
          borderTopRightRadius: 20,
          borderBottomRightRadius: 20,
        },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: "Events",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size + 2} color={color} />
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
        name="Profile"
        options={{
          title: "Profile",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person" size={size + 2} color={color} />
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
    </Drawer>
  );
}
