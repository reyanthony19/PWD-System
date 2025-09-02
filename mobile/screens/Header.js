// Header.js (Expo + React Native Paper)
import React, { useState, useEffect } from "react";
import { View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import {
  Appbar,
  Avatar,
  Menu,
  Divider,
} from "react-native-paper";

export default function Header({ sidebarOpen, setSidebarOpen }) {
  const navigation = useNavigation();
  const [currentUser, setCurrentUser] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await AsyncStorage.getItem("user");
        if (user) setCurrentUser(JSON.parse(user));
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.navigate("Login");
  };

  return (
    <Appbar.Header mode="center-aligned" style={{ backgroundColor: "white" }}>
      {/* Left - Sidebar toggle */}
      <Appbar.Action
        icon="menu"
        onPress={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Center - App title */}
      <Appbar.Content
        title="PWD System"
        subtitle="Management Portal"
        titleStyle={{ fontWeight: "bold", color: "#1d4ed8" }}
        subtitleStyle={{ color: "#6b7280" }}
      />

      {/* Right - User menu */}
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <Appbar.Action
            icon={() =>
              currentUser?.avatar ? (
                <Avatar.Image size={36} source={{ uri: currentUser.avatar }} />
              ) : (
                <Avatar.Text
                  size={36}
                  label={currentUser?.username?.[0] || "?"}
                />
              )
            }
            onPress={() => setMenuVisible(true)}
          />
        }
      >
        <Menu.Item
          onPress={() => {
            setMenuVisible(false);
            navigation.navigate("Profile");
          }}
          title="My Profile"
          leadingIcon="account"
        />
        <Menu.Item
          onPress={() => {
            setMenuVisible(false);
            navigation.navigate("Settings");
          }}
          title="Settings"
          leadingIcon="cog"
        />
        <Divider />
        <Menu.Item
          onPress={handleLogout}
          title="Sign Out"
          leadingIcon="logout"
        />
      </Menu>
    </Appbar.Header>
  );
}
