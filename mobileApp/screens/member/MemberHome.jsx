import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function MemberHome() {
  const navigation = useNavigation();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await AsyncStorage.getItem("user");
        if (user) setCurrentUser(JSON.parse(user));
      } catch (err) {
        console.error("Error loading user:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.loader]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 8, color: "#2563eb", fontWeight: "600" }}>
          Loading...
        </Text>
      </View>
    );
  }

  const fullName = currentUser?.member_profile
    ? `${currentUser.member_profile.first_name || ""} ${
        currentUser.member_profile.last_name || ""
      }`.trim()
    : "Guest";

  const username = currentUser ? currentUser.username || "" : "";

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      {/* Welcome Header */}
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome</Text>
        <Text style={styles.username}>
          {fullName} {username ? `(${username})` : ""}
        </Text>
      </View>

      {/* Navigation Buttons */}
      <View style={styles.buttonsContainer}>
        <Pressable
          style={styles.card}
          onPress={() => navigation.navigate("MemberProfile")}
        >
          <Ionicons name="person-circle" size={32} color="#2563eb" />
          <Text style={styles.cardTitle}>My Profile</Text>
          <Text style={styles.cardSubtitle}>
            View and edit your personal information
          </Text>
        </Pressable>

        <Pressable
          style={styles.card}
          onPress={() => navigation.navigate("MemberScanner")}
        >
          <Ionicons name="camera" size={32} color="#2563eb" />
          <Text style={styles.cardTitle}>Scanner</Text>
          <Text style={styles.cardSubtitle}>Scan your QR to check in</Text>
        </Pressable>

        <Pressable
          style={styles.card}
          onPress={() => navigation.navigate("MemberReports")}
        >
          <MaterialCommunityIcons name="chart-box" size={32} color="#2563eb" />
          <Text style={styles.cardTitle}>Reports</Text>
          <Text style={styles.cardSubtitle}>View your usage reports</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  loader: { justifyContent: "center", alignItems: "center" },
  header: { marginBottom: 30 },
  welcome: { fontSize: 18, color: "#6b7280" },
  username: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 4,
  },
  buttonsContainer: { flexDirection: "column", gap: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 8,
  },
  cardSubtitle: { fontSize: 14, color: "#6b7280", marginTop: 4 },
});
