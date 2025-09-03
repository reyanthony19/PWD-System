import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

export default function Header({ sidebarOpen, setSidebarOpen, options }) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top }, // respect notch / status bar
      ]}
    >
      {/* Left button (toggle sidebar or go back) */}
      <TouchableOpacity
        onPress={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            setSidebarOpen?.(!sidebarOpen);
          }
        }}
      >
        <Text style={styles.buttonText}>
          {navigation.canGoBack() ? "← Back" : "☰ Menu"}
        </Text>
      </TouchableOpacity>

      {/* Title (comes from screen options or fallback) */}
      <Text style={styles.title}>
        {options?.title || "PWD System"}
      </Text>

      {/* Right placeholder (for future buttons, like profile/logout) */}
      <View style={styles.rightPlaceholder} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    backgroundColor: "#1976D2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  rightPlaceholder: {
    width: 40, // keeps spacing balanced
  },
});
